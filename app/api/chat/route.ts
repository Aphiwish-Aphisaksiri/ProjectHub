/*
    This file defines the API route for handling chat interactions in a Next.js application.
    It receives chat messages from the frontend, forwards them to a Python backend for processing, and streams the response back to the client in real-time.
    Key features:
    - Authentication: Ensures the user is authenticated before processing the chat request.
    - Streaming: Streams the backend response to the client in real-time.
    - Security: Uses server-side user ID to prevent spoofing, and does not trust client input for user identification.
*/

import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"  // your existing auth

export async function POST(req: NextRequest) {
    const user = await getCurrentUser()
    if (!user) return new Response("Unauthorized", { status: 401 })

    const body = await req.json()

    // Forward to Python backend, streaming
    const res = await fetch(`${process.env.BACKEND_URL}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId: user.id,        // always use server-side userId, never trust client
            message: body.message,
            history: body.history,
        }),
        cache: "no-store",  // important for streaming responses
    })

    // Pass the stream straight through to the client
    return new Response(res.body, {
        headers: { "Content-Type": "text/plain" },
    })
}