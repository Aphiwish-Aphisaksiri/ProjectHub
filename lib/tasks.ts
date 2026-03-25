import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type TaskDetail = {
    id: string;
    taskNumber: number;
    title: string;
    body: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    projectId: string;
    assignee: { name: string; avatarUrl: string | null } | null;
    project: { title: string; slug: string };
};

export async function getTaskById(id: string): Promise<TaskDetail | null> {
    const user = await getCurrentUser();
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const task = await (prisma.task.findFirst as any)({
        where: { id, project: { ownerId: user.id } },
        select: {
            id: true,
            taskNumber: true,
            title: true,
            body: true,
            status: true,
            priority: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
            projectId: true,
            assignee: { select: { name: true, avatarUrl: true } },
            project: { select: { title: true, slug: true } },
        },
    });

    return task ?? null;
}
