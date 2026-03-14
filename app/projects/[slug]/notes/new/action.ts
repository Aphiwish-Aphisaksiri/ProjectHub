'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function createNote({ projectSlug, title, body }: {
    projectSlug: string;
    title: string;
    body: string;
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error('You must be logged in to create a note.');

    const project = await prisma.project.findUnique({
        where: { slug: projectSlug },
    });

    if (!project) throw new Error('Project not found.');
    if (project.ownerId !== user.id) throw new Error('You do not have access to this project.');

    const note = await prisma.note.create({
        data: {
            title,
            body,
            projectId: project.id,
        },
    });

    embedNote(note, project.id).catch(err => {
        console.error('Embedding failed for note:', note.id, err);
    });

    return note;
}

async function embedNote(note: { id: string; title: string; body: string }, projectId: string) {
    await fetch(`${process.env.BACKEND_URL}/embed/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
            projectId,
            sourceId: note.id,
            text: `${note.title}\n${note.body}`,
        }),
    });
}