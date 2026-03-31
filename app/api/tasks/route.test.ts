import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Mocks ──────────────────────────────────────────────────────────────────

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

vi.mock('@/lib/services/tasks', () => ({
    createTaskForUser: vi.fn(),
    updateTaskForUser: vi.fn(),
    getAllTasksForUser: vi.fn(),
    getProjectTasksForUser: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
    getCurrentUser: vi.fn(),
}))

import { verifyInternalRequest, isInternalRequestValid } from '@/lib/internal-auth'
import { createTaskForUser, updateTaskForUser } from '@/lib/services/tasks'
import { POST, PATCH } from './route'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(method: string, body: Record<string, unknown>): NextRequest {
    return new NextRequest('http://localhost/api/tasks', {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': 'test-secret',
        },
        body: JSON.stringify(body),
    })
}

function authOk() {
    vi.mocked(verifyInternalRequest).mockReturnValue({ secret: 'ok' })
    vi.mocked(isInternalRequestValid).mockReturnValue(true)
}

function authFail() {
    vi.mocked(verifyInternalRequest).mockReturnValue({ secret: 'bad' })
    vi.mocked(isInternalRequestValid).mockReturnValue(false)
}

// ─── POST /api/tasks (create) ───────────────────────────────────────────────

describe('POST /api/tasks', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 401 if internal secret is invalid', async () => {
        authFail()
        const res = await POST(makeRequest('POST', { userId: 'u1', projectSlug: 'p', title: 'T' }))
        expect(res.status).toBe(401)
    })

    it('returns 400 if userId is missing', async () => {
        authOk()
        const res = await POST(makeRequest('POST', { projectSlug: 'p', title: 'T' }))
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Missing required fields' })
    })

    it('returns 400 if projectSlug is missing', async () => {
        authOk()
        const res = await POST(makeRequest('POST', { userId: 'u1', title: 'T' }))
        expect(res.status).toBe(400)
    })

    it('returns 400 if title is missing', async () => {
        authOk()
        const res = await POST(makeRequest('POST', { userId: 'u1', projectSlug: 'p' }))
        expect(res.status).toBe(400)
    })

    it('returns 201 with created task on success', async () => {
        authOk()
        const task = { id: 't1', title: 'Fix bug', status: 'TODO', priority: 'HIGH' }
        vi.mocked(createTaskForUser).mockResolvedValue(task as never)

        const res = await POST(makeRequest('POST', {
            userId: 'u1',
            projectSlug: 'my-project',
            title: 'Fix bug',
            status: 'TODO',
            priority: 'HIGH',
        }))
        expect(res.status).toBe(201)
        expect(await res.json()).toEqual(task)
    })

    it('defaults status to TODO and priority to MEDIUM', async () => {
        authOk()
        vi.mocked(createTaskForUser).mockResolvedValue({ id: 't1' } as never)

        await POST(makeRequest('POST', {
            userId: 'u1',
            projectSlug: 'p',
            title: 'T',
        }))
        expect(createTaskForUser).toHaveBeenCalledWith('u1', expect.objectContaining({
            status: 'TODO',
            priority: 'MEDIUM',
        }))
    })

    it('parses dueDate as Date when provided', async () => {
        authOk()
        vi.mocked(createTaskForUser).mockResolvedValue({ id: 't1' } as never)

        await POST(makeRequest('POST', {
            userId: 'u1',
            projectSlug: 'p',
            title: 'T',
            dueDate: '2026-04-01',
        }))
        const call = vi.mocked(createTaskForUser).mock.calls[0]
        expect(call[1].dueDate).toEqual(new Date('2026-04-01'))
    })

    it('returns 400 when service throws (e.g. project not found)', async () => {
        authOk()
        vi.mocked(createTaskForUser).mockRejectedValue(new Error('Project not found.'))

        const res = await POST(makeRequest('POST', {
            userId: 'u1',
            projectSlug: 'nonexistent',
            title: 'T',
        }))
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Project not found.' })
    })

    it('returns 400 when service throws access denied', async () => {
        authOk()
        vi.mocked(createTaskForUser).mockRejectedValue(new Error('Access denied.'))

        const res = await POST(makeRequest('POST', {
            userId: 'u1',
            projectSlug: 'other-user-project',
            title: 'T',
        }))
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Access denied.' })
    })
})

// ─── PATCH /api/tasks (update) ──────────────────────────────────────────────

describe('PATCH /api/tasks', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 401 if internal secret is invalid', async () => {
        authFail()
        const res = await PATCH(makeRequest('PATCH', { userId: 'u1', taskId: 't1' }))
        expect(res.status).toBe(401)
    })

    it('returns 400 if userId is missing', async () => {
        authOk()
        const res = await PATCH(makeRequest('PATCH', { taskId: 't1' }))
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Missing required fields' })
    })

    it('returns 400 if taskId is missing', async () => {
        authOk()
        const res = await PATCH(makeRequest('PATCH', { userId: 'u1' }))
        expect(res.status).toBe(400)
    })

    it('returns updated task on success', async () => {
        authOk()
        const updated = { id: 't1', title: 'Updated', status: 'DONE' }
        vi.mocked(updateTaskForUser).mockResolvedValue({
            updated,
            projectSlug: 'my-project',
        } as never)

        const res = await PATCH(makeRequest('PATCH', {
            userId: 'u1',
            taskId: 't1',
            title: 'Updated',
            status: 'DONE',
            priority: 'HIGH',
        }))
        expect(res.status).toBe(200)
        expect(await res.json()).toEqual(updated)
    })

    it('defaults optional fields when not provided', async () => {
        authOk()
        vi.mocked(updateTaskForUser).mockResolvedValue({
            updated: { id: 't1' },
            projectSlug: 'p',
        } as never)

        await PATCH(makeRequest('PATCH', { userId: 'u1', taskId: 't1' }))
        expect(updateTaskForUser).toHaveBeenCalledWith('u1', {
            taskId: 't1',
            title: '',
            body: '',
            status: 'TODO',
            priority: 'MEDIUM',
            dueDate: null,
        })
    })

    it('returns 400 when service throws', async () => {
        authOk()
        vi.mocked(updateTaskForUser).mockRejectedValue(new Error('Task not found or access denied.'))

        const res = await PATCH(makeRequest('PATCH', { userId: 'u1', taskId: 'bad-id' }))
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Task not found or access denied.' })
    })
})
