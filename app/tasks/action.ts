"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { Task } from "@/types";
import { updateTaskForUser } from "@/lib/services/tasks";
import { internalFetch } from "@/lib/internal-fetch";

export async function getAllUserTasks(): Promise<Task[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    const res = await internalFetch("/api/tasks");
    if (!res.ok) return [];
    return res.json();
}

export async function updateTask({
    taskId,
    title,
    body,
    status,
    priority,
    dueDate,
}: {
    taskId: string;
    title: string;
    body: string;
    status: string;
    priority: string;
    dueDate: string | null;
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const { projectSlug } = await updateTaskForUser(user.id, {
        taskId,
        title,
        body,
        status,
        priority,
        dueDate,
    });

    revalidatePath("/tasks");
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath(`/tasks/${taskId}/edit`);
    if (projectSlug) {
        revalidatePath(`/projects/${projectSlug}/tasks`);
    }
}
