'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { TaskStatus, Priority } from '@/types';

export async function createTask({ projectSlug, title, body, status, priority, dueDate }: {
    projectSlug: string;
    title: string;
    body?: string;
    status: TaskStatus;
    priority: Priority;
    dueDate?: Date;
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error('You must be logged in to create a task.');

    // Get project by slug and verify ownership
    const project = await prisma.project.findUnique({
        where: { slug: projectSlug },
    });

    if (!project) throw new Error('Project not found.');
    if (project.ownerId !== user.id) throw new Error('You do not have access to this project.');

    const task = await prisma.task.create({
        data: {
            title,
            body,
            status,
            priority,
            dueDate,
            projectId: project.id,
            assigneeId: user.id,
        },
    });

    // Fire embedding non-blocking
    embedTask(task, project.id).catch(err => {
        console.error('Embedding failed for task:', task.id, err);
    });

    return task;
}

async function embedTask(task: { id: string; title: string; body: string | null }, projectId: string) {
    const text = task.body ? `${task.title}\n${task.body}` : task.title;

    await fetch(`${process.env.BACKEND_URL}/embed/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
            projectId,
            sourceId: task.id,
            text,
        }),
    });
}