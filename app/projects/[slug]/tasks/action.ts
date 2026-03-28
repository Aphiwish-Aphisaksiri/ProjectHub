"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TaskStatus, Task } from "@/types";
import { updateTaskStatusForUser } from "@/lib/services/tasks";

export async function getProjectTasks(slug: string): Promise<Task[]> {
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

    const updated = await updateTaskStatusForUser(user.id, taskId, newStatus);

    return updated;
}
