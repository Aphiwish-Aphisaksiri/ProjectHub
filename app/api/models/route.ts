import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
    const user = await getCurrentUser()
    if (!user) return new Response("Unauthorized", { status: 401 })

    const res = await fetch(`${process.env.BACKEND_URL}/models/`, {
        cache: "no-store"
    })

    const data = await res.json()
    return Response.json(data)
}