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

vi.mock('@/lib/services/notes', () => ({
    createNoteForUser: vi.fn(),
    updateNoteForUser: vi.fn(),
}))

import { verifyInternalRequest, isInternalRequestValid } from '@/lib/internal-auth'
import { createNoteForUser, updateNoteForUser } from '@/lib/services/notes'
import { POST, PATCH } from './route'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(method: string, body: Record<string, unknown>): NextRequest {
    return new NextRequest('http://localhost/api/notes', {
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

// ─── POST /api/notes (create) ───────────────────────────────────────────────

describe('POST /api/notes', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 401 if internal secret is invalid', async () => {
        authFail()
        const res = await POST(makeRequest('POST', {
            userId: 'u1', projectSlug: 'p', title: 'T', body: 'B',
        }))
        expect(res.status).toBe(401)
    })

    it('returns 400 if userId is missing', async () => {
        authOk()
        const res = await POST(makeRequest('POST', { projectSlug: 'p', title: 'T', body: 'B' }))
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Missing required fields' })
    })

    it('returns 400 if projectSlug is missing', async () => {
        authOk()
        const res = await POST(makeRequest('POST', { userId: 'u1', title: 'T', body: 'B' }))
        expect(res.status).toBe(400)
    })

    it('returns 400 if title is missing', async () => {
        authOk()
        const res = await POST(makeRequest('POST', { userId: 'u1', projectSlug: 'p', body: 'B' }))
        expect(res.status).toBe(400)
    })

    it('returns 400 if body is missing', async () => {
        authOk()
        const res = await POST(makeRequest('POST', { userId: 'u1', projectSlug: 'p', title: 'T' }))
        expect(res.status).toBe(400)
    })

    it('returns 201 with created note on success', async () => {
        authOk()
        const note = { id: 'n1', title: 'Meeting Notes', body: '## Agenda\n- Item 1' }
        vi.mocked(createNoteForUser).mockResolvedValue(note as never)

        const res = await POST(makeRequest('POST', {
            userId: 'u1',
            projectSlug: 'my-project',
            title: 'Meeting Notes',
            body: '## Agenda\n- Item 1',
        }))
        expect(res.status).toBe(201)
        expect(await res.json()).toEqual(note)
    })

    it('passes correct parameters to service', async () => {
        authOk()
        vi.mocked(createNoteForUser).mockResolvedValue({ id: 'n1' } as never)

        await POST(makeRequest('POST', {
            userId: 'u1',
            projectSlug: 'alpha',
            title: 'Note Title',
            body: 'Note body content',
        }))
        expect(createNoteForUser).toHaveBeenCalledWith('u1', {
            projectSlug: 'alpha',
            title: 'Note Title',
            body: 'Note body content',
        })
    })

    it('returns 400 when service throws (project not found)', async () => {
        authOk()
        vi.mocked(createNoteForUser).mockRejectedValue(new Error('Project not found.'))

        const res = await POST(makeRequest('POST', {
            userId: 'u1',
            projectSlug: 'nonexistent',
            title: 'T',
            body: 'B',
        }))
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Project not found.' })
    })

    it('returns 400 when service throws access denied', async () => {
        authOk()
        vi.mocked(createNoteForUser).mockRejectedValue(new Error('Access denied.'))

        const res = await POST(makeRequest('POST', {
            userId: 'u1',
            projectSlug: 'other-user-project',
            title: 'T',
            body: 'B',
        }))
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Access denied.' })
    })
})

// ─── PATCH /api/notes (update) ──────────────────────────────────────────────

describe('PATCH /api/notes', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns 401 if internal secret is invalid', async () => {
        authFail()
        const res = await PATCH(makeRequest('PATCH', {
            userId: 'u1', noteId: 'n1', title: 'T', body: 'B',
        }))
        expect(res.status).toBe(401)
    })

    it('returns 400 if userId is missing', async () => {
        authOk()
        const res = await PATCH(makeRequest('PATCH', { noteId: 'n1', title: 'T', body: 'B' }))
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Missing required fields' })
    })

    it('returns 400 if noteId is missing', async () => {
        authOk()
        const res = await PATCH(makeRequest('PATCH', { userId: 'u1', title: 'T', body: 'B' }))
        expect(res.status).toBe(400)
    })

    it('returns 400 if title is missing', async () => {
        authOk()
        const res = await PATCH(makeRequest('PATCH', { userId: 'u1', noteId: 'n1', body: 'B' }))
        expect(res.status).toBe(400)
    })

    it('returns 400 if body is missing', async () => {
        authOk()
        const res = await PATCH(makeRequest('PATCH', { userId: 'u1', noteId: 'n1', title: 'T' }))
        expect(res.status).toBe(400)
    })

    it('returns updated note on success', async () => {
        authOk()
        const updatedNote = { id: 'n1', title: 'Updated Title', body: 'Updated body' }
        vi.mocked(updateNoteForUser).mockResolvedValue({
            updatedNote,
            projectSlug: 'alpha',
        } as never)

        const res = await PATCH(makeRequest('PATCH', {
            userId: 'u1',
            noteId: 'n1',
            title: 'Updated Title',
            body: 'Updated body',
        }))
        expect(res.status).toBe(200)
        expect(await res.json()).toEqual(updatedNote)
    })

    it('passes correct parameters to service', async () => {
        authOk()
        vi.mocked(updateNoteForUser).mockResolvedValue({
            updatedNote: { id: 'n1' },
            projectSlug: 'p',
        } as never)

        await PATCH(makeRequest('PATCH', {
            userId: 'u1',
            noteId: 'n1',
            title: 'New Title',
            body: 'New body',
        }))
        expect(updateNoteForUser).toHaveBeenCalledWith('u1', {
            noteId: 'n1',
            title: 'New Title',
            body: 'New body',
        })
    })

    it('returns 400 when service throws (note not found)', async () => {
        authOk()
        vi.mocked(updateNoteForUser).mockRejectedValue(new Error('Note not found or access denied.'))

        const res = await PATCH(makeRequest('PATCH', {
            userId: 'u1',
            noteId: 'bad-id',
            title: 'T',
            body: 'B',
        }))
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'Note not found or access denied.' })
    })

    it('returns 400 when service throws validation error', async () => {
        authOk()
        vi.mocked(updateNoteForUser).mockRejectedValue(new Error('A note title is required.'))

        const res = await PATCH(makeRequest('PATCH', {
            userId: 'u1',
            noteId: 'n1',
            title: '   ',
            body: 'B',
        }))
        expect(res.status).toBe(400)
        expect(await res.json()).toEqual({ error: 'A note title is required.' })
    })
})
