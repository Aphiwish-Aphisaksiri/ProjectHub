export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const title = url.searchParams.get("title");
    // Validate title parameter
    if (!title) {
        return NextResponse.json({ error: "Missing title parameter" }, { status: 400 });
    }

    // Check current user authentication and return projects for that user
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findFirst({
        where: {
            title,
            ownerId: user.id,
        },
    });
    return NextResponse.json({ exists: !!project });
}
