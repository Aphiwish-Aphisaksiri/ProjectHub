import { NextRequest, NextResponse } from "next/server";
import {
    verifyInternalRequest,
    isInternalRequestValid,
    unauthorizedResponse,
} from "@/lib/internal-auth";
import { getCurrentUser } from "@/lib/auth";
import {
    createTaskForUser,
    updateTaskForUser,
    getAllTasksForUser,
    getProjectTasksForUser,
    deleteTaskForUser,
} from "@/lib/services/tasks";

export async function GET(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const slug = req.nextUrl.searchParams.get("slug");
    const tasks = slug
        ? await getProjectTasksForUser(user.id, slug)
        : await getAllTasksForUser(user.id);

    return NextResponse.json(tasks);
}

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

export async function DELETE(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { taskId } = body;

        if (!taskId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const deleted = await deleteTaskForUser(user.id, taskId);
        return NextResponse.json(deleted);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
