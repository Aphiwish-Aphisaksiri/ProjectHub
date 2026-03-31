import { cookies } from "next/headers";

/**
 * Makes a fetch call to an internal Next.js API route, forwarding the
 * current request's session cookies so that `getCurrentUser()` works
 * inside the target route handler.
 */
export async function internalFetch(
    path: string,
    options?: RequestInit,
): Promise<Response> {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    return fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
            ...(options?.headers as Record<string, string>),
        },
        cache: "no-store",
    });
}
