'use client';

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function UserPage() {
    return (
        <div className="bg-black text-white flex flex-col items-center justify-center h-full text-3xl">
            <h1 className="text-3xl font-bold">User Page</h1>
            <h2 className="text-lg mt-4">This is where your profile information will be displayed.</h2>
            <Link href="/user/signin" className="mt-6 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition">
                Sign In
            </Link>
            <button onClick={() => signOut()} className="mt-4 px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition">
                Sign Out
            </button>
        </div>
    );
}