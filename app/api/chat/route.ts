import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function POST(req: NextRequest) {
    const user = await getCurrentUser()
    if (!user) return new Response("Unauthorized", { status: 401 })

    const body = await req.json()

    const res = await fetch(`${process.env.BACKEND_URL}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId: user.id,
            message: body.message,
            history: body.history,
            modelName: body.modelName,          // ← forward new fields
            thinkingEnabled: body.thinkingEnabled,
        }),
        cache: "no-store",
    })

    return new Response(res.body, {
        headers: { "Content-Type": "text/plain" },
    })
}