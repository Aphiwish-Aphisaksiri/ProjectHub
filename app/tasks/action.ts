"use server";

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
        select: { id: true },
    });
    if (!existing) throw new Error("Task not found or access denied");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.task.update as any)({
        where: { id: taskId },
        data: {
            title: title.trim(),
            body: body.trim() || null,
            status,
            priority,
            dueDate: dueDate ? new Date(dueDate) : null,
        },
    });
}
