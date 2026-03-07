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
    return await prisma.project.create({
        data: {
            title,
            description,
            visibility,
            addReadMe,
            ownerId: user.id,
        },
    });
}
