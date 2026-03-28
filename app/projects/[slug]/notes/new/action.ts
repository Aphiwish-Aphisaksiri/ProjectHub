'use server';

import { getCurrentUser } from '@/lib/auth';
import { createNoteForUser } from '@/lib/services/notes';

export async function createNote({ projectSlug, title, body }: {
    projectSlug: string;
    title: string;
    body: string;
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error('You must be logged in to create a note.');

    return createNoteForUser(user.id, { projectSlug, title, body });
}