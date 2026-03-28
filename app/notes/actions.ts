"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { updateNoteForUser } from "@/lib/services/notes";

type UpdateUserNoteInput = {
    noteId: string;
    title: string;
    body: string;
};

export async function updateUserNote({ noteId, title, body }: UpdateUserNoteInput) {
    const user = await getCurrentUser();
    if (!user) throw new Error("You must be logged in to edit a note.");

    const { updatedNote, projectSlug } = await updateNoteForUser(user.id, {
        noteId,
        title,
        body,
    });

    revalidatePath("/notes");
    revalidatePath(`/notes/${updatedNote.id}`);
    revalidatePath(`/notes/${updatedNote.id}/edit`);
    revalidatePath(`/projects/${projectSlug}/notes`);

    return updatedNote;
}