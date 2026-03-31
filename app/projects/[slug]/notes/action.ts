"use server";

import { getCurrentUser } from "@/lib/auth";
import { internalFetch } from "@/lib/internal-fetch";

export async function getProjectNotes(slug: string) {
    const user = await getCurrentUser();
    if (!user) return [];

    const res = await internalFetch(`/api/notes?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) return [];
    return res.json();
}
