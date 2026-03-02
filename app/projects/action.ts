"use server";
import { prisma } from "@/lib/prisma";

export async function checkIfProjectTitleExists(title: string) {
    const project = await prisma.project.findFirst({
        where: { title: title }
    });
    return !!project;
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
