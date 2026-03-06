"use client";

import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function UserSigninPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        // Clear previous result when email or password changes
        if (result !== null) {
            startTransition(() => setResult(null));
        }
    }, [email, password]);

    const validateEmail = (v: string) => /\S+@\S+\.\S+/.test(v); // Simple email validation regex

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setResult(null);

        // Validate email and password
        if (!validateEmail(email)) {
            setResult({ type: "error", message: "Please enter a valid email address." });
            return;
        }
        if (!password) {
            setResult({ type: "error", message: "Please enter your password." });
            return;
        }

        setLoading(true);

        // Sign in logic
        const res = await signIn("credentials", {
            redirect: false,
            email,
            password,
        });

        setLoading(false);

        if (res?.error) {
            setResult({ type: "error", message: res.error });
        }
        else {
            setResult({ type: "success", message: "Signed in successfully!" });
            // Optionally, you can redirect the user after successful sign-in
            // For example: router.push("/dashboard");
        }
    }

    return (
        <div className="bg-primary flex flex-col h-full items-center">
            <form onSubmit={handleSubmit}
                className="login-div flex flex-col items-center justify-center gap-2 mx-40 my-20 w-140">
                <h1 className="text-[32px] text-offwhite font-bold">
                    Login to ProjectHub
                </h1>

                {/* Email input */}
                <div className="flex flex-col items-left justify-center w-full gap-1">
                    <label htmlFor="email" className="text-[24px] text-offwhite font-semibold">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        className={`bg-primary text-lightgrey text-left border rounded-md px-4 py-1.25 h-fit w-full focus:outline-none transition-colors`}
                        placeholder="my-email@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                {/* Password input */}
                <div className="flex flex-col items-left justify-center w-full gap-1">
                    <label htmlFor="password" className="text-[24px] text-offwhite font-semibold">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        className={`bg-primary text-lightgrey text-left border rounded-md px-4 py-1.25 h-fit w-full focus:outline-none transition-colors`}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {/* Need help? */}
                <div className="flex flex-row items-center justify-end w-full">
                    <Link href="#" className="text-[16px] text-tertiary font-semibold hover:underline">
                        Need help signing in?
                    </Link>
                </div>

                {/* Sign in button */}
                <div className="flex flex-row items-center justify-center w-full">
                    <button
                        type="submit"
                        className="w-full bg-green text-offwhite text-[20px] font-semibold rounded-md px-4 py-1.25 hover:bg-green/50 transition-colors"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </div>

                {/* Register (Don't have an account) */}
                {!result && (
                    <div className="flex flex-row items-center justify-center w-full gap-1">
                        <p className="text-[16px] text-lightgrey font-semibold">
                            {"Don't have an account?"}
                        </p>
                        <Link href="/user/signup" className="text-tertiary font-semibold hover:underline">
                            Register here
                        </Link>
                    </div>
                )}

                {/* Result message */}
                {result && (
                    <div className={`w-full text-center py-2 rounded-md ${result.type === "success" ? "bg-green/20 text-green" : "bg-red/20 text-red"}`}>
                        {result.message}
                    </div>
                )}
            </form>
        </div>
    );
}