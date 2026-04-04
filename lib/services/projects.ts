import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { syncProjectEmbedding, deleteProjectEmbedding } from "@/lib/services/embedding";

export async function createProjectForUser(
    userId: string,
    input: {
        title: string;
        description: string;
        visibility: "PRIVATE" | "PUBLIC";
        addReadMe: boolean;
    },
) {
    const slug = slugify(input.title);

    const project = await prisma.project.create({
        data: {
            title: input.title,
            slug,
            description: input.description,
            visibility: input.visibility,
            addReadMe: input.addReadMe,
            ownerId: userId,
        },
        select: {
            id: true,
            title: true,
            description: true,
            slug: true,
        },
    });

    syncProjectEmbedding(project).catch((err) => {
        console.error("Embedding failed for project:", project.id, err);
    });

    return project;
}

export async function updateProjectForUser(
    userId: string,
    input: {
        projectId: string;
        title: string;
        description: string;
        visibility: "PRIVATE" | "PUBLIC";
    },
) {
    const existing = await prisma.project.findFirst({
        where: { id: input.projectId, ownerId: userId },
        select: { id: true, title: true, slug: true },
    });
    if (!existing) throw new Error("Project not found or access denied.");

    const trimmedTitle = input.title.trim();
    const trimmedDescription = input.description.trim();

    if (!trimmedTitle) throw new Error("A project title is required.");
    if (trimmedDescription.length > 250) {
        throw new Error("Description cannot exceed 250 characters.");
    }

    const newSlug =
        trimmedTitle !== existing.title ? slugify(trimmedTitle) : existing.slug;

    const updated = await prisma.project.update({
        where: { id: input.projectId },
        data: {
            title: trimmedTitle,
            slug: newSlug,
            description: trimmedDescription || null,
            visibility: input.visibility,
        },
        select: {
            id: true,
            title: true,
            description: true,
            slug: true,
        },
    });

    syncProjectEmbedding(updated).catch((err) => {
        console.error("Embedding failed for project update:", updated.id, err);
    });

    return { updated, previousSlug: existing.slug, newSlug };
}

export async function deleteProjectForUser(userId: string, projectId: string) {
    const project = await prisma.project.findFirst({
        where: { id: projectId, ownerId: userId },
        select: {
            id: true,
            title: true,
            slug: true,
            _count: { select: { tasks: true, notes: true } },
        },
    });
    if (!project) throw new Error("Project not found or access denied.");

    await prisma.project.delete({ where: { id: projectId } });

    deleteProjectEmbedding(project.id).catch((err) => {
        console.error("Embedding cleanup failed for deleted project:", project.id, err);
    });

    return {
        projectId: project.id,
        title: project.title,
        slug: project.slug,
        taskCount: project._count.tasks,
        noteCount: project._count.notes,
    };
}
