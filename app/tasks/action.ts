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
