"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TaskStatus, TaskRaw } from "@/types";

export async function getProjectTasks(slug: string): Promise<TaskRaw[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (prisma.task.findMany as any)({
        where: {
            project: {
                slug,
                ownerId: user.id,
            },
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
        },
    });
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated.");

    // Verify ownership before updating
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: { select: { ownerId: true, id: true } } },
    });

    if (!task) throw new Error("Task not found.");
    if (task.project?.ownerId !== user.id) throw new Error("Access denied.");

    const updated = await prisma.task.update({
        where: { id: taskId },
        data: { status: newStatus },
    });

    // Re-embed non-blocking to keep vector context fresh
    reEmbedTask(updated, task.project.id).catch((err) => {
        console.error("Re-embed failed for task:", taskId, err);
    });

    return updated;
}

async function reEmbedTask(
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
