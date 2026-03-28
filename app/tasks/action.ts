"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Task } from "@/types";

export async function getAllUserTasks(): Promise<Task[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (prisma.task.findMany as any)({
        where: {
            project: { ownerId: user.id },
        },
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            taskNumber: true,
            title: true,
            body: true,
            status: true,
            priority: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
            projectId: true,
            assignee: {
                select: { name: true, avatarUrl: true },
            },
            project: {
                select: { title: true, slug: true },
            },
        },
    });
}

export async function updateTask({
    taskId,
    title,
    body,
    status,
    priority,
    dueDate,
}: {
    taskId: string;
    title: string;
    body: string;
    status: string;
    priority: string;
    dueDate: string | null;
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const existing = await prisma.task.findFirst({
        where: { id: taskId, project: { ownerId: user.id } },
        select: { id: true, projectId: true, project: { select: { slug: true } } },
    });
    if (!existing) throw new Error("Task not found or access denied");

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim() || null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.task.update as any)({
        where: { id: taskId },
        data: {
            title: trimmedTitle,
            body: trimmedBody,
            status,
            priority,
            dueDate: dueDate ? new Date(dueDate) : null,
        },
    });

    syncTaskEmbedding(
        { id: taskId, title: trimmedTitle, body: trimmedBody },
        existing.projectId,
    ).catch((err) => {
        console.error("Embedding failed for task update:", taskId, err);
    });

    revalidatePath("/tasks");
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath(`/tasks/${taskId}/edit`);
    if (existing.project?.slug) {
        revalidatePath(`/projects/${existing.project.slug}/tasks`);
    }
}

async function syncTaskEmbedding(
    task: { id: string; title: string; body: string | null },
    projectId: string,
) {
    const text = task.body ? `${task.title}\n${task.body}` : task.title;

    await fetch(`${process.env.BACKEND_URL}/embed/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
            projectId,
            sourceId: task.id,
            text,
        }),
    });
}
