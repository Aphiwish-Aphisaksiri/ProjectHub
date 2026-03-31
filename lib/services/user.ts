import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function getUserProfileForUser(userId: string) {
    const [projectsCount, tasksCount, notesCount, userData] = await Promise.all([
        prisma.project.count({ where: { ownerId: userId } }),
        prisma.task.count({ where: { assigneeId: userId } }),
        prisma.note.count({ where: { authorId: userId } }),
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
                createdAt: true,
            },
        }),
    ]);

    return {
        ...userData,
        counts: {
            projects: projectsCount,
            tasks: tasksCount,
            notes: notesCount,
        },
    };
}

export async function updateUserProfileForUser(
    userId: string,
    input: { name: string; avatarUrl: string },
) {
    const trimmedName = input.name.trim();
    if (!trimmedName) throw new Error("Name is required.");
    if (trimmedName.length > 100) throw new Error("Name cannot exceed 100 characters.");

    const trimmedAvatar = input.avatarUrl.trim() || null;
    if (trimmedAvatar && trimmedAvatar.length > 500) {
        throw new Error("Avatar URL is too long.");
    }

    await prisma.user.update({
        where: { id: userId },
        data: { name: trimmedName, avatarUrl: trimmedAvatar },
    });

    return { success: true };
}

export async function updateUserSecurityForUser(
    userId: string,
    input: { currentPassword: string; newEmail: string; newPassword: string },
) {
    if (!input.currentPassword)
        throw new Error("Current password is required to make changes.");

    const trimmedEmail = input.newEmail.trim();
    const trimmedPassword = input.newPassword.trim();

    if (!trimmedEmail && !trimmedPassword) {
        throw new Error("Enter a new email or password to update.");
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { hashedPassword: true, email: true },
    });
    if (!dbUser) throw new Error("User not found.");

    const valid = await bcrypt.compare(input.currentPassword, dbUser.hashedPassword);
    if (!valid) throw new Error("Current password is incorrect.");

    const data: { email?: string; hashedPassword?: string } = {};

    if (trimmedEmail && trimmedEmail !== dbUser.email) {
        if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
            throw new Error("Please enter a valid email address.");
        }
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

    await prisma.user.update({ where: { id: userId }, data });

    return { success: true, emailChanged: !!data.email };
}
