"use server";
import { prisma } from "@/lib/prisma";

export async function checkIfProjectTitleExists(title: string) {
    const project = await prisma.project.findFirst({
        where: { title: title }
    });
    return !!project;
}

export type ProjectListItem = {
    id: string;
    title: string;
    createdAt: Date;
}

export async function getProjectsTitle(userId: string | null) {
    const { take = 50, skip = 0 } = {}; // Pagination parameters, can be extended to accept from the client
    return await prisma.project.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: "desc" },
        take,
        skip,
        select: {
            id: true,
            title: true,
            createdAt: true,
        }
    });
}

export async function createProject({ title, description, visibility, addReadMe }: {
    title: string;
    description: string;
    visibility: "PRIVATE" | "PUBLIC";
    addReadMe: boolean;
}) {
    // 1. Create the project in the database
    return await prisma.project.create({
        data: {
            title,
            description,
            visibility,
            addReadMe
        },
    });
}
