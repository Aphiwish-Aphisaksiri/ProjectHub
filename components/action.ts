"use server";

import { getCurrentUser } from '@/lib/auth';
import { internalFetch } from '@/lib/internal-fetch';

export async function getCurrentUserName() {
    const user = await getCurrentUser();
    return user?.name ?? null;
}

export async function getUserProfile() {
    const user = await getCurrentUser();
    if (!user) return null;

    const res = await internalFetch('/api/user');
    if (!res.ok) return null;
    return res.json();
}

export async function getUserNotes() {
    const user = await getCurrentUser();
    if (!user) return [];

    const res = await internalFetch('/api/notes');
    if (!res.ok) return [];
    return res.json();
}
