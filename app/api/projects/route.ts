export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
    verifyInternalRequest,
    isInternalRequestValid,
    unauthorizedResponse,
} from "@/lib/internal-auth";
import { updateProjectForUser } from "@/lib/services/projects";

export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            createdAt: true,
        },
    });
    return NextResponse.json(projects);
}

export async function PATCH(req: NextRequest) {
    const { secret } = verifyInternalRequest(req);
    if (!isInternalRequestValid(secret)) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { userId, projectId, title, description, visibility } = body;

        if (!userId || !projectId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { updated } = await updateProjectForUser(userId, {
            projectId,
            title,
            description: description ?? "",
            visibility: visibility ?? "PRIVATE",
        });

        return NextResponse.json(updated);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
