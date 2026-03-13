"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// TODO: Refactor fetching data to API routes and use client components for data fetching in the UI, keeping server actions focused on mutations and server-side logic.

export async function createProject({ title, description, visibility, addReadMe }: {
    title: string;
    description: string;
    visibility: "PRIVATE" | "PUBLIC";
    addReadMe: boolean;
}) {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("You must be logged in to create a project.");
    }

    // 1. Create the project
    const project = await prisma.project.create({
        data: {
            title,
            description,
            visibility,
            addReadMe,
            ownerId: user.id,
        },
    });

    // 2. Embedding (Non-blocking)
    embedProject(project).catch((err) => {
        console.error("Error embedding project:", project.id, err);
    });

    return project;
}

async function embedProject(project: { id: string; title: string; description: string | null}) {
    await fetch(`${process.env.BACKEND_URL}/embed/project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            projectId: project.id,
            sourceId: project.id,
            title: project.title,
            description: project.description ?? "",
        }),
    });
}