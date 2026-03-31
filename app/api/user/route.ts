export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
    getUserProfileForUser,
    updateUserProfileForUser,
    updateUserSecurityForUser,
} from "@/lib/services/user";

export async function GET() {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await getUserProfileForUser(user.id);
    return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { type, ...data } = body;

        if (type === "profile") {
            const result = await updateUserProfileForUser(user.id, {
                name: data.name ?? "",
                avatarUrl: data.avatarUrl ?? "",
            });
            return NextResponse.json(result);
        }

        if (type === "security") {
            const result = await updateUserSecurityForUser(user.id, {
                currentPassword: data.currentPassword ?? "",
                newEmail: data.newEmail ?? "",
                newPassword: data.newPassword ?? "",
            });
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: "Invalid update type" }, { status: 400 });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
