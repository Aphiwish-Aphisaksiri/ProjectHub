export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
    // Check current user authentication and return projects for that user
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch projects for the authenticated user, ordered by creation date
    const projects = await prisma.project.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            createdAt: true,
        },
    });
    return NextResponse.json(projects);
}
