"use server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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

export async function getCurrentUserId() {
    const user = await getCurrentUser();
    return user?.id ?? null;
}

// TODO: Add ownerId to the project creation data and ensure it's set to the current user's ID in the createProject function
export async function createProject({ title, description, visibility, addReadMe }: {
    title: string;
    description: string;
    visibility: "PRIVATE" | "PUBLIC";
    addReadMe: boolean;
    setResult: (result: { type: "success" | "error"; message: string } | null) => void;
}) {
    // Fetch ownerId automatically, and check if the user is logged in
    const user = await getCurrentUser();
    const ownerId = user?.id ?? null;

    return await prisma.project.create({
        data: {
            title,
            description,
            visibility,
            addReadMe,
            ownerId
        },
    });
}
