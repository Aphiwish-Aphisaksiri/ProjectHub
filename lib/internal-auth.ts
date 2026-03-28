import { NextRequest, NextResponse } from "next/server";

/**
 * Validates that a request comes from the internal Python backend
 * by checking the shared INTERNAL_API_SECRET header.
 * Returns the userId from the request body if valid, or a 401 response.
 */
export function verifyInternalRequest(req: NextRequest): { secret: string | null } {
    const secret = req.headers.get("x-internal-secret");
    return { secret };
}

export function isInternalRequestValid(secret: string | null): boolean {
    const expected = process.env.INTERNAL_API_SECRET;
    if (!expected || !secret) return false;
    return secret === expected;
}

export function unauthorizedResponse() {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
