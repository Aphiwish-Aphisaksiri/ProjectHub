import { NextRequest, NextResponse } from "next/server";
import {
    verifyInternalRequest,
    isInternalRequestValid,
    unauthorizedResponse,
} from "@/lib/internal-auth";
import { createNoteForUser, updateNoteForUser } from "@/lib/services/notes";

export async function POST(req: NextRequest) {
    const { secret } = verifyInternalRequest(req);
    if (!isInternalRequestValid(secret)) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { userId, projectSlug, title, body: noteBody } = body;

        if (!userId || !projectSlug || !title || !noteBody) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const note = await createNoteForUser(userId, {
            projectSlug,
            title,
            body: noteBody,
        });

        return NextResponse.json(note, { status: 201 });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

export async function PATCH(req: NextRequest) {
    const { secret } = verifyInternalRequest(req);
    if (!isInternalRequestValid(secret)) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { userId, noteId, title, body: noteBody } = body;

        if (!userId || !noteId || !title || !noteBody) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { updatedNote } = await updateNoteForUser(userId, {
            noteId,
            title,
            body: noteBody,
        });

        return NextResponse.json(updatedNote);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
