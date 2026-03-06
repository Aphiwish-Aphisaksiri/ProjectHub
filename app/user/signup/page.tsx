"use client";

import { useState, useEffect, startTransition } from "react";
import Link from "next/link";

export default function UserSignUpPage(){
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        // Clear previous result when email or password changes
        if (result !== null) {
            startTransition(() => setResult(null));
        }
    }, [name, email, password, confirmPassword]);

    const validateEmail = (v: string) => /\S+@\S+\.\S+/.test(v); // Simple email validation regex

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setResult(null);

        // Validate name, email and password
        if (!name) {
            setResult({ type: "error", message: "Please enter your name." });
            return;
        }
        if (!validateEmail(email)) {
            setResult({ type: "error", message: "Please enter a valid email address." });
            return;
        }
        if (!password) {
            setResult({ type: "error", message: "Please enter your password." });
            return;
        }
        if (!confirmPassword) {
            setResult({ type: "error", message: "Please confirm your password." });
            return;
        }
        if (password !== confirmPassword) {
            setResult({ type: "error", message: "Passwords do not match." });
            return;
        }

        setLoading(true);

        const res = await fetch("/api/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        setLoading(false);
        if (res.ok) {
            setResult({ type: "success", message: "Account created successfully! Signing you in..." });
            // Auto sign in
            const signInRes = await import("next-auth/react").then(mod => mod.signIn("credentials", {
                redirect: true,
                email,
                password,
            }));
            if (signInRes?.error) {
                setResult({ type: "error", message: signInRes.error });
            }
        } else {
            setResult({ type: "error", message: data.error || "Something went wrong." });
        }
    };

    return (
        <div className="bg-primary flex flex-col h-full items-center">
            <form onSubmit={handleSubmit}
                className="login-div flex flex-col items-center justify-center gap-4 mx-40 my-30 w-140">
                <h1 className="text-[32px] text-offwhite font-bold">
                    Sign Up for ProjectHub
                </h1>

                {/* Name input */}
                <div className="flex flex-col items-left justify-center w-full gap-1">
                    <label htmlFor="name" className="text-[20px] text-offwhite font-semibold">
                        Name
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        className={`bg-primary text-lightgrey text-left border rounded-md px-4 py-1.25 h-fit w-full focus:outline-none transition-colors`}
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                {/* Email input */}
                <div className="flex flex-col items-left justify-center w-full gap-1">
                    <label htmlFor="email" className="text-[20px] text-offwhite font-semibold">
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
                    <label htmlFor="password" className="text-[20px] text-offwhite font-semibold">
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

                {/* Confirm Password input */}
                <div className="flex flex-col items-left justify-center w-full gap-1">
                    <label htmlFor="confirmPassword" className="text-[20px] text-offwhite font-semibold">
                        Confirm Password
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="current-password"
                        className={`bg-primary text-lightgrey text-left border rounded-md px-4 py-1.25 h-fit w-full focus:outline-none transition-colors`}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>

                {/* Need help? */}
                <div className="flex flex-row items-center justify-end w-full">
                    <Link href="#" className="text-[16px] text-tertiary font-semibold hover:underline">
                        Need help signing up?
                    </Link>
                </div>

                {/* Sign up button */}
                <div className="flex flex-row items-center justify-center w-full">
                    <button
                        type="submit"
                        className="w-full bg-green text-offwhite text-[20px] font-semibold rounded-md px-4 py-1.25 hover:bg-green/50 transition-colors"
                        disabled={loading}
                    >
                        {loading ? "Signing up..." : "Sign Up"}
                    </button>
                </div>

                {/* Result message */}
                {result && (
                    <div className={`w-full text-center py-2 rounded-md ${result.type === "success" ? "bg-green/20 text-green" : "bg-red/20 text-red"}`}>
                        {result.message}
                    </div>
                )}
            </form>
        </div>
    )

}