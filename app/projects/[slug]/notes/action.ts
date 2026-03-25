"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getProjectNotes(slug: string) {
    const user = await getCurrentUser();
    if (!user) return [];

    return prisma.note.findMany({
        where: {
            project: {
                slug,
                ownerId: user.id,
            },
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            body: true,
            createdAt: true,
            updatedAt: true,
            author: {
                select: { name: true, avatarUrl: true },
            },
        },
    });
}
