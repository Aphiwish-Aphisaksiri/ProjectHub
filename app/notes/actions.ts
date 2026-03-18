"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { NOTE_BODY_LIMIT } from "@/app/notes/constants";
import { prisma } from "@/lib/prisma";

type UpdateUserNoteInput = {
    noteId: string;
    title: string;
    body: string;
};

export async function updateUserNote({ noteId, title, body }: UpdateUserNoteInput) {
    const user = await getCurrentUser();
    if (!user) throw new Error("You must be logged in to edit a note.");

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle) throw new Error("A note title is required.");
    if (!trimmedBody) throw new Error("Note content cannot be empty.");
    if (trimmedBody.length > NOTE_BODY_LIMIT) {
        throw new Error(`Note content cannot exceed ${NOTE_BODY_LIMIT} characters.`);
    }

    const existingNote = await prisma.note.findFirst({
        where: {
            id: noteId,
            project: {
                ownerId: user.id,
            },
        },
        include: {
            project: {
                select: {
                    id: true,
                    slug: true,
                },
            },
        },
    });

    if (!existingNote?.project) {
        throw new Error("Note not found or access denied.");
    }

    const updatedNote = await prisma.note.update({
        where: { id: noteId },
        data: {
            title: trimmedTitle,
            body: trimmedBody,
        },
    });

    syncNoteEmbedding(updatedNote, existingNote.project.id).catch(error => {
        console.error("Embedding failed for note update:", updatedNote.id, error);
    });

    revalidatePath("/notes");
    revalidatePath(`/notes/${updatedNote.id}`);
    revalidatePath(`/notes/${updatedNote.id}/edit`);
    revalidatePath(`/projects/${existingNote.project.slug}/notes`);

    return updatedNote;
}

async function syncNoteEmbedding(note: { id: string; title: string; body: string }, projectId: string) {
    await fetch(`${process.env.BACKEND_URL}/embed/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
            projectId,
            sourceId: note.id,
            text: `${note.title}\n${note.body}`,
        }),
    });
}