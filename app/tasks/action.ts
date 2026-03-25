"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getAllUserTasks() {
    const user = await getCurrentUser();
    if (!user) return [];

    return prisma.task.findMany({
        where: {
            project: { ownerId: user.id },
        },
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            title: true,
            body: true,
            status: true,
            priority: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
            projectId: true,
            project: {
                select: { title: true, slug: true },
            },
        },
    });
}
