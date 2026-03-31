import { NextRequest, NextResponse } from "next/server";
import {
    verifyInternalRequest,
    isInternalRequestValid,
    unauthorizedResponse,
} from "@/lib/internal-auth";
import { getCurrentUser } from "@/lib/auth";
import {
    createNoteForUser,
    updateNoteForUser,
    getProjectNotesForUser,
    getUserNotesForUser,
} from "@/lib/services/notes";

export async function GET(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const slug = req.nextUrl.searchParams.get("slug");
    const notes = slug
        ? await getProjectNotesForUser(user.id, slug)
        : await getUserNotesForUser(user.id);

    return NextResponse.json(notes);
}

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
