import { NextRequest, NextResponse } from "next/server";
import {
    verifyInternalRequest,
    isInternalRequestValid,
    unauthorizedResponse,
} from "@/lib/internal-auth";
import { createTaskForUser, updateTaskForUser } from "@/lib/services/tasks";

export async function POST(req: NextRequest) {
    const { secret } = verifyInternalRequest(req);
    if (!isInternalRequestValid(secret)) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { userId, projectSlug, title, body: taskBody, status, priority, dueDate } = body;

        if (!userId || !projectSlug || !title) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const task = await createTaskForUser(userId, {
            projectSlug,
            title,
            body: taskBody,
            status: status ?? "TODO",
            priority: priority ?? "MEDIUM",
            dueDate: dueDate ? new Date(dueDate) : null,
        });

        return NextResponse.json(task, { status: 201 });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

export async function PATCH(req: NextRequest) {
    const { secret } = verifyInternalRequest(req);
    if (!isInternalRequestValid(secret)) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { userId, taskId, title, body: taskBody, status, priority, dueDate } = body;

        if (!userId || !taskId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { updated } = await updateTaskForUser(userId, {
            taskId,
            title: title ?? "",
            body: taskBody ?? "",
            status: status ?? "TODO",
            priority: priority ?? "MEDIUM",
            dueDate: dueDate ?? null,
        });

        return NextResponse.json(updated);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
