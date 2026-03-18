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

export async function getUserNotes() {
    const user = await getCurrentUser();
    if (!user) return [];

    const notes = await prisma.note.findMany({
        where: {
            project: {
                ownerId: user.id
            }
        },
        include: {
            project: {
                select: {
                    title: true,
                    id: true
                }
            },
            author: {
                select: {
                    name: true,
                    avatarUrl: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return notes.filter(
        (note): note is typeof note & { project: { id: string; title: string } } => note.project !== null
    );
}
