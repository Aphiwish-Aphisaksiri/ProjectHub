import { prisma } from "@/lib/prisma";
import { syncTaskEmbedding } from "@/lib/services/embedding";

export async function createTaskForUser(
    userId: string,
    input: {
        projectSlug: string;
        title: string;
        body?: string;
        status: string;
        priority: string;
        dueDate?: Date | null;
    },
) {
    const project = await prisma.project.findUnique({
        where: { slug: input.projectSlug },
        select: { id: true, ownerId: true },
    });
    if (!project) throw new Error("Project not found.");
    if (project.ownerId !== userId) throw new Error("Access denied.");

    const task = await prisma.task.create({
        data: {
            title: input.title,
            body: input.body ?? null,
            status: input.status as "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED",
            priority: input.priority as "LOW" | "MEDIUM" | "HIGH",
            dueDate: input.dueDate ?? null,
            projectId: project.id,
            assigneeId: userId,
        },
    });

    syncTaskEmbedding(task, project.id).catch((err) => {
        console.error("Embedding failed for task:", task.id, err);
    });

    return task;
}

export async function updateTaskForUser(
    userId: string,
    input: {
        taskId: string;
        title: string;
        body: string;
        status: string;
        priority: string;
        dueDate: string | null;
    },
) {
    const existing = await prisma.task.findFirst({
        where: { id: input.taskId, project: { ownerId: userId } },
        select: { id: true, projectId: true, project: { select: { slug: true } } },
    });
    if (!existing) throw new Error("Task not found or access denied.");

    const trimmedTitle = input.title.trim();
    const trimmedBody = input.body.trim() || null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma.task.update as any)({
        where: { id: input.taskId },
        data: {
            title: trimmedTitle,
            body: trimmedBody,
            status: input.status,
            priority: input.priority,
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
    });

    syncTaskEmbedding(
        { id: input.taskId, title: trimmedTitle, body: trimmedBody },
        existing.projectId,
    ).catch((err) => {
        console.error("Embedding failed for task update:", input.taskId, err);
    });

    return { updated, projectSlug: existing.project?.slug };
}

export async function updateTaskStatusForUser(
    userId: string,
    taskId: string,
    newStatus: string,
) {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: { select: { ownerId: true, id: true } } },
    });
    if (!task) throw new Error("Task not found.");
    if (task.project?.ownerId !== userId) throw new Error("Access denied.");

    const updated = await prisma.task.update({
        where: { id: taskId },
        data: { status: newStatus as "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED" },
    });

    syncTaskEmbedding(updated, task.project.id).catch((err) => {
        console.error("Re-embed failed for task:", taskId, err);
    });

    return updated;
}
