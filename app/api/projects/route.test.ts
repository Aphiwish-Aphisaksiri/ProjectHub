import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
    prisma: {
        project: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
        },
    },
}))

vi.mock('@/lib/auth', () => ({
    getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/services/projects', () => ({
    updateProjectForUser: vi.fn(),
}))

vi.mock('@/lib/internal-auth', () => ({
    verifyInternalRequest: vi.fn(),
    isInternalRequestValid: vi.fn(),
    unauthorizedResponse: vi.fn(() =>
        new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        })
    ),
}))

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { updateProjectForUser } from '@/lib/services/projects'
import { verifyInternalRequest, isInternalRequestValid } from '@/lib/internal-auth'
import { GET, PATCH } from './route'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makePatchRequest(body: Record<string, unknown>, secret = 'valid-secret'): NextRequest {
    return new NextRequest('http://localhost/api/projects', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': secret,
        },
        body: JSON.stringify(body),
    })
}

// ─── GET /api/projects ──────────────────────────────────────────────────────

describe('GET /api/projects', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 401 if user is not authenticated', async () => {
        vi.mocked(getCurrentUser).mockResolvedValue(null)
        const res = await GET()
        expect(res.status).toBe(401)
        expect(await res.json()).toEqual({ error: 'Unauthorized' })
    })

    it('returns projects for the authenticated user', async () => {
        vi.mocked(getCurrentUser).mockResolvedValue({ id: 'u1', email: 'a@b.c', name: 'Test' })
        const projects = [
            { id: 'p1', title: 'Alpha', slug: 'alpha', description: null, createdAt: new Date() },
        ]
        vi.mocked(prisma.project.findMany).mockResolvedValue(projects as never)

        const res = await GET()
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body).toHaveLength(1)
        expect(body[0].title).toBe('Alpha')
    })
})

// ─── PATCH /api/projects ────────────────────────────────────────────────────

describe('PATCH /api/projects', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 401 if internal secret is invalid', async () => {
        vi.mocked(verifyInternalRequest).mockReturnValue({ secret: 'bad' })
        vi.mocked(isInternalRequestValid).mockReturnValue(false)

        const res = await PATCH(makePatchRequest({ userId: 'u1', projectId: 'p1', title: 'New' }))
        expect(res.status).toBe(401)
    })

    it('returns 400 if userId is missing', async () => {
        vi.mocked(verifyInternalRequest).mockReturnValue({ secret: 'ok' })
        vi.mocked(isInternalRequestValid).mockReturnValue(true)

        const res = await PATCH(makePatchRequest({ projectId: 'p1', title: 'New' }))
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Missing required fields' })
    })

    it('returns 400 if projectId is missing', async () => {
        vi.mocked(verifyInternalRequest).mockReturnValue({ secret: 'ok' })
        vi.mocked(isInternalRequestValid).mockReturnValue(true)

        const res = await PATCH(makePatchRequest({ userId: 'u1', title: 'New' }))
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Missing required fields' })
    })

    it('returns updated project on success', async () => {
        vi.mocked(verifyInternalRequest).mockReturnValue({ secret: 'ok' })
        vi.mocked(isInternalRequestValid).mockReturnValue(true)

        const updated = { id: 'p1', title: 'New Title', description: 'desc', slug: 'new-title' }
        vi.mocked(updateProjectForUser).mockResolvedValue({
            updated,
            previousSlug: 'old-title',
            newSlug: 'new-title',
        })

        const res = await PATCH(makePatchRequest({
            userId: 'u1',
            projectId: 'p1',
            title: 'New Title',
            description: 'desc',
            visibility: 'PUBLIC',
        }))
        expect(res.status).toBe(200)
        expect(await res.json()).toEqual(updated)
        expect(updateProjectForUser).toHaveBeenCalledWith('u1', {
            projectId: 'p1',
            title: 'New Title',
            description: 'desc',
            visibility: 'PUBLIC',
        })
    })

    it('returns 400 with error message when service throws', async () => {
        vi.mocked(verifyInternalRequest).mockReturnValue({ secret: 'ok' })
        vi.mocked(isInternalRequestValid).mockReturnValue(true)
        vi.mocked(updateProjectForUser).mockRejectedValue(new Error('Project not found or access denied.'))

        const res = await PATCH(makePatchRequest({
            userId: 'u1',
            projectId: 'bad-id',
            title: 'X',
        }))
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Project not found or access denied.' })
    })

    it('defaults description to empty string and visibility to PRIVATE', async () => {
        vi.mocked(verifyInternalRequest).mockReturnValue({ secret: 'ok' })
        vi.mocked(isInternalRequestValid).mockReturnValue(true)
        vi.mocked(updateProjectForUser).mockResolvedValue({
            updated: { id: 'p1', title: 'T', description: null, slug: 't' },
            previousSlug: 't',
            newSlug: 't',
        })

        await PATCH(makePatchRequest({ userId: 'u1', projectId: 'p1', title: 'T' }))
        expect(updateProjectForUser).toHaveBeenCalledWith('u1', {
            projectId: 'p1',
            title: 'T',
            description: '',
            visibility: 'PRIVATE',
        })
    })
})
