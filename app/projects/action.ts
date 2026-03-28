"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createProjectForUser, updateProjectForUser } from "@/lib/services/projects";

export async function createProject({ title, description, visibility, addReadMe }: {
    title: string;
    description: string;
    visibility: "PRIVATE" | "PUBLIC";
    addReadMe: boolean;
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error("You must be logged in to create a project.");

    return createProjectForUser(user.id, { title, description, visibility, addReadMe });
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

    const { updated, previousSlug, newSlug } = await updateProjectForUser(user.id, {
        projectId,
        title,
        description,
        visibility,
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${previousSlug}`);
    if (newSlug !== previousSlug) {
        revalidatePath(`/projects/${newSlug}`);
    }

    return updated;
}