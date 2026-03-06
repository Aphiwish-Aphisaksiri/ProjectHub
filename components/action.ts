"use server";

import { getCurrentUser } from '@/lib/auth';

export async function getCurrentUserName() {
    const user = await getCurrentUser();
    return user?.name ?? null;
}