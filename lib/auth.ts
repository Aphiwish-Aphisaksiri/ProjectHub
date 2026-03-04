// lib/auth.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth, { AuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { AdapterUser } from "next-auth/adapters";
import { SessionStrategy } from "next-auth";

type ExtendedUser = AdapterUser & {
    hashedPassword?: string;
};

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma), // uses Prisma to store users/sessions in DB
    providers: [
        CredentialsProvider({
            name: "Credentials", // using email/password for auth
            credentials: { email: { label: "Email", type: "text" }, password: { label: "Password", type: "password" } },
            async authorize(credentials) {
                // Check if email and password are provided
                if (!credentials?.email || !credentials.password) return null;
                // Check if user exists by email
                const user = await prisma.user.findUnique({ where: { email: credentials.email } }) as ExtendedUser | null;
                if (!user || !user.hashedPassword) return null;
                // Check if password is valid
                const valid = await bcrypt.compare(credentials.password, user.hashedPassword);
                if (!valid) return null;

                // If everything is valid, return user object including id, email, and name (for session)
                return { id: user.id, email: user.email, name: user.name };
            }
        }),
    ],
    session: { strategy: "database" as SessionStrategy }, // keeps sessions in DB via adapter
    // Callback runs every time a session is checked/created. We can add user id to session here for easy access on client/server.
    callbacks: {
        // By default, NextAuth only includes email and name in session.user. We want to add id as well for easier access.
        session({ session, user }: { session: Session; user: User }) {
            // expose user id to server/client session object
            if (session.user && user.id) {
                (session.user as typeof user & { id: string }).id = user.id;
            }
            return session;
        }
    },
    // Sign and encrypt session cookies with this secret (should be set in env for production)
    secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);

// helper to use server-side
import { getServerSession } from "next-auth/next";
export async function getCurrentUser() {
    const session = await getServerSession(authOptions);
    return session?.user ?? null; // includes id if callback added it
}