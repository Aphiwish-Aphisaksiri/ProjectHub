"use server";

import { getCurrentUser } from "@/lib/auth";
import { TaskStatus, Task } from "@/types";
import { updateTaskStatusForUser } from "@/lib/services/tasks";
import { internalFetch } from "@/lib/internal-fetch";

export async function getProjectTasks(slug: string): Promise<Task[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    const res = await internalFetch(`/api/tasks?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) return [];
    return res.json();
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated.");

    const updated = await updateTaskStatusForUser(user.id, taskId, newStatus);

    return updated;
}
