"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

export async function updateUserProfile({
    name,
    avatarUrl,
}: {
    name: string;
    avatarUrl: string;
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error("You must be logged in to edit your profile.");

    const trimmedName = name.trim();
    if (!trimmedName) throw new Error("Name is required.");
    if (trimmedName.length > 100) throw new Error("Name cannot exceed 100 characters.");

    const trimmedAvatar = avatarUrl.trim() || null;
    if (trimmedAvatar && trimmedAvatar.length > 500) {
        throw new Error("Avatar URL is too long.");
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            name: trimmedName,
            avatarUrl: trimmedAvatar,
        },
    });

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

    if (!currentPassword) throw new Error("Current password is required to make changes.");

    const trimmedEmail = newEmail.trim();
    const trimmedPassword = newPassword.trim();

    // At least one field must be changing
    if (!trimmedEmail && !trimmedPassword) {
        throw new Error("Enter a new email or password to update.");
    }

    // Verify current password
    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { hashedPassword: true, email: true },
    });
    if (!dbUser) throw new Error("User not found.");

    const valid = await bcrypt.compare(currentPassword, dbUser.hashedPassword);
    if (!valid) throw new Error("Current password is incorrect.");

    // Build the update payload
    const data: { email?: string; hashedPassword?: string } = {};

    if (trimmedEmail && trimmedEmail !== dbUser.email) {
        // Validate email format
        if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
            throw new Error("Please enter a valid email address.");
        }
        // Check uniqueness
        const existing = await prisma.user.findUnique({
            where: { email: trimmedEmail },
            select: { id: true },
        });
        if (existing) throw new Error("This email is already in use.");
        data.email = trimmedEmail;
    }

    if (trimmedPassword) {
        if (trimmedPassword.length < 6) {
            throw new Error("New password must be at least 6 characters.");
        }
        data.hashedPassword = await bcrypt.hash(trimmedPassword, 10);
    }

    if (Object.keys(data).length === 0) {
        throw new Error("No changes detected.");
    }

    await prisma.user.update({
        where: { id: user.id },
        data,
    });

    revalidatePath("/user");
    revalidatePath("/user/security");

    // Tell the client whether email changed (needs sign-out)
    return { success: true, emailChanged: !!data.email };
}
