import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'

vi.mock('@/lib/prisma', () => ({
    prisma: {
        project: {
            findFirst: vi.fn(),
        },
    },
}))

vi.mock('@/lib/auth', () => ({
    getCurrentUser: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

function makeRequest(title?: string): Request {
    const url = title
        ? `http://localhost/api/projects/title-exists?title=${encodeURIComponent(title)}`
        : 'http://localhost/api/projects/title-exists'
    return new Request(url)
}

describe('GET /api/projects/title-exists', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns 400 if title param is missing', async () => {
        const res = await GET(makeRequest())
        expect(res.status).toBe(400)
        const body = await res.json()
        expect(body).toEqual({ error: 'Missing title parameter' })
    })

    it('returns 401 if user is not authenticated', async () => {
        vi.mocked(getCurrentUser).mockResolvedValue(null)
        const res = await GET(makeRequest('My Project'))
        expect(res.status).toBe(401)
        const body = await res.json()
        expect(body).toEqual({ error: 'Unauthorized' })
    })

    it('returns { exists: true } when the title belongs to the user', async () => {
        vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'Test User' })
        vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: 'proj-1' } as Record<string, unknown>)
        const res = await GET(makeRequest('My Project'))
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body).toEqual({ exists: true })
    })

    it('returns { exists: false } when the title does not exist for the user', async () => {
        vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'Test User' })
        vi.mocked(prisma.project.findFirst).mockResolvedValue(null)
        const res = await GET(makeRequest('Nonexistent Project'))
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body).toEqual({ exists: false })
    })
})
