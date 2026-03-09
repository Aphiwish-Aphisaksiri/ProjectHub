// lib/auth.ts
export const dynamic = "force-dynamic";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth, { AuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { AdapterUser } from "next-auth/adapters";
import { SessionStrategy } from "next-auth";
import { getServerSession } from "next-auth/next";

type ExtendedUser = AdapterUser & {
    hashedPassword?: string;
};

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials): Promise<{ id: string; email: string; name: string } | null> {
                if (!credentials?.email || !credentials.password) return null;
                const user = await prisma.user.findUnique({ where: { email: credentials.email } }) as ExtendedUser | null;
                if (!user || !user.hashedPassword) return null;
                const valid = await bcrypt.compare(credentials.password, user.hashedPassword);
                if (!valid) return null;
                // Ensure all fields are present
                if (!user.id || !user.email || !user.name) return null;
                return { id: user.id, email: user.email, name: user.name };
            }
        }),
    ],
    session: { strategy: "jwt" as SessionStrategy },
    callbacks: {
        session({ session, token }: { session: Session; token: Record<string, unknown> & { id?: string } }): Session {
            if (session.user && token?.id) {
                (session.user as { id: string }).id = token.id;
            }
            return session;
        },
        jwt({ token, user }: { token: Record<string, unknown> & { id?: string }; user?: { id?: string } }): Record<string, unknown> & { id?: string } {
            if (user && user.id) {
                token.id = user.id;
            }
            return token;
        },
    },
    // ...existing code...
    secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);

export async function getCurrentUser(): Promise<{ id: string; email: string; name: string } | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    // NextAuth's session.user may not include id/email/name directly, so cast as needed
    const user = session.user as { id?: string; email?: string; name?: string };
    // Check if id, email, and name are present before returning
    if (!user.id || !user.email || !user.name) return null;
    return { id: user.id, email: user.email, name: user.name };
}