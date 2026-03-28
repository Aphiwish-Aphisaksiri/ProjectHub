import { prisma } from "@/lib/prisma";
import { NOTE_BODY_LIMIT } from "@/app/notes/constants";
import { syncNoteEmbedding } from "@/lib/services/embedding";

export async function createNoteForUser(
    userId: string,
    input: {
        projectSlug: string;
        title: string;
        body: string;
    },
) {
    const project = await prisma.project.findUnique({
        where: { slug: input.projectSlug },
        select: { id: true, ownerId: true },
    });
    if (!project) throw new Error("Project not found.");
    if (project.ownerId !== userId) throw new Error("Access denied.");

    const note = await prisma.note.create({
        data: {
            title: input.title,
            body: input.body,
            projectId: project.id,
            authorId: userId,
        },
    });

    syncNoteEmbedding(note, project.id).catch((err) => {
        console.error("Embedding failed for note:", note.id, err);
    });

    return note;
}

export async function updateNoteForUser(
    userId: string,
    input: {
        noteId: string;
        title: string;
        body: string;
    },
) {
    const trimmedTitle = input.title.trim();
    const trimmedBody = input.body.trim();

    if (!trimmedTitle) throw new Error("A note title is required.");
    if (!trimmedBody) throw new Error("Note content cannot be empty.");
    if (trimmedBody.length > NOTE_BODY_LIMIT) {
        throw new Error(`Note content cannot exceed ${NOTE_BODY_LIMIT} characters.`);
    }

    const existingNote = await prisma.note.findFirst({
        where: {
            id: input.noteId,
            project: { ownerId: userId },
        },
        include: {
            project: { select: { id: true, slug: true } },
        },
    });
    if (!existingNote?.project) {
        throw new Error("Note not found or access denied.");
    }

    const updatedNote = await prisma.note.update({
        where: { id: input.noteId },
        data: {
            title: trimmedTitle,
            body: trimmedBody,
        },
    });

    syncNoteEmbedding(updatedNote, existingNote.project.id).catch((err) => {
        console.error("Embedding failed for note update:", updatedNote.id, err);
    });

    return { updatedNote, projectSlug: existingNote.project.slug };
}
