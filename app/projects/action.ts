"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

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

    const slug = slugify(title);

    // 1. Create the project
    const project = await prisma.project.create({
        data: {
            title,
            slug,
            description,
            visibility,
            addReadMe,
            ownerId: user.id,
        },
        select: {
            id: true,
            title: true,
            description: true,
            slug: true,
        },
    });

    // 2. Embedding (Non-blocking)
    embedProject(project).catch((err) => {
        console.error("Error embedding project:", project.id, err);
    });

    return project;
}

async function embedProject(project: { id: string; title: string; description: string | null; slug: string }) {
    await fetch(`${process.env.BACKEND_URL}/embed/project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            projectId: project.id,
            sourceId: project.id,
            title: project.title,
            description: project.description ?? "",
            slug: project.slug,
        }),
    });
}

export async function updateProject({
    projectId,
    title,
    description,
    visibility,
}: {
    projectId: string;
    title: string;
    description: string;
    visibility: "PRIVATE" | "PUBLIC";
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error("You must be logged in to edit a project.");

    const existing = await prisma.project.findFirst({
        where: { id: projectId, ownerId: user.id },
        select: { id: true, title: true, slug: true },
    });
    if (!existing) throw new Error("Project not found or access denied.");

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) throw new Error("A project title is required.");
    if (trimmedDescription.length > 250) {
        throw new Error("Description cannot exceed 250 characters.");
    }

    // Update slug when title changes
    const newSlug = trimmedTitle !== existing.title
        ? slugify(trimmedTitle)
        : existing.slug;

    const updated = await prisma.project.update({
        where: { id: projectId },
        data: {
            title: trimmedTitle,
            slug: newSlug,
            description: trimmedDescription || null,
            visibility,
        },
        select: {
            id: true,
            title: true,
            description: true,
            slug: true,
        },
    });

    embedProject(updated).catch((err) => {
        console.error("Embedding failed for project update:", updated.id, err);
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/projects");
    revalidatePath(`/projects/${existing.slug}`);
    if (newSlug !== existing.slug) {
        revalidatePath(`/projects/${newSlug}`);
    }

    return updated;
}