import "server-only";

import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


type NoteWithRelations = Prisma.NoteGetPayload<{
    include: {
        project: {
            select: {
                id: true;
                title: true;
                slug: true;
            };
        };
        author: {
            select: {
                name: true;
                avatarUrl: true;
            };
        };
    };
}>;

type NoteWithRequiredProject = Omit<NoteWithRelations, "project"> & {
    project: NonNullable<NoteWithRelations["project"]>;
};

export const getUserNoteById = cache(async (noteId: string) => {
    const user = await getCurrentUser();
    if (!user) return null;

    const note = await prisma.note.findFirst({
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
                    title: true,
                    slug: true,
                },
            },
            author: {
                select: {
                    name: true,
                    avatarUrl: true,
                },
            },
        },
    });

    if (!note?.project) {
        return null;
    }

    return note as NoteWithRequiredProject;
});

export type UserNoteDetail = NonNullable<Awaited<ReturnType<typeof getUserNoteById>>>;