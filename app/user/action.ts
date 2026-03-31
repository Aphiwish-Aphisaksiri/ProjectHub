"use server";

import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { internalFetch } from "@/lib/internal-fetch";

export async function updateUserProfile({
    name,
    avatarUrl,
}: {
    name: string;
    avatarUrl: string;
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error("You must be logged in to edit your profile.");

    const res = await internalFetch("/api/user", {
        method: "PATCH",
        body: JSON.stringify({ type: "profile", name, avatarUrl }),
    });

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update profile.");
    }

    revalidatePath("/user");
    revalidatePath("/user/edit");

    return { success: true };
}

export async function updateUserSecurity({
    currentPassword,
    newEmail,
    newPassword,
}: {
    currentPassword: string;
    newEmail: string;
    newPassword: string;
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error("You must be logged in.");

    const res = await internalFetch("/api/user", {
        method: "PATCH",
        body: JSON.stringify({ type: "security", currentPassword, newEmail, newPassword }),
    });

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update security settings.");
    }

    revalidatePath("/user");
    revalidatePath("/user/security");

    return res.json();
}
