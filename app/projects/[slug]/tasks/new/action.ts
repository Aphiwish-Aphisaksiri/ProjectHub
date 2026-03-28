'use server';

import { getCurrentUser } from '@/lib/auth';
import { TaskStatus, Priority } from '@/types';
import { createTaskForUser } from '@/lib/services/tasks';

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

    return createTaskForUser(user.id, {
        projectSlug,
        title,
        body,
        status,
        priority,
        dueDate,
    });
}