"use server";

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function getCurrentUserName() {
    const user = await getCurrentUser();
    return user?.name ?? null;
}

export async function getUserProfile() {
    const user = await getCurrentUser();
    if (!user) return null;

    const [projectsCount, tasksCount, notesCount] = await Promise.all([
        prisma.project.count({ where: { ownerId: user.id } }),
        prisma.task.count({ where: { assigneeId: user.id } }),
        prisma.note.count({ where: { authorId: user.id } }),
    ]);

    const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            createdAt: true,
        }
    });

    return {
        ...userData,
        counts: {
            projects: projectsCount,
            tasks: tasksCount,
            notes: notesCount,
        }
    };
}