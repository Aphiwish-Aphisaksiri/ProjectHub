"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { FiSave, FiMail, FiLock, FiAlertTriangle } from "react-icons/fi";
import { updateUserSecurity } from "@/app/user/action";

type Props = {
    currentEmail: string;
    cancelHref: string;
};

type Result = { type: "success" | "error"; message: string } | null;

export default function SecurityForm({ currentEmail, cancelHref }: Props) {
    const router = useRouter();
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<Result>(null);

    const hasChanges = newEmail.trim().length > 0 || newPassword.trim().length > 0;
    const passwordMismatch = newPassword && confirmPassword && newPassword !== confirmPassword;
    const canSubmit =
        !loading &&
        hasChanges &&
        currentPassword.length > 0 &&
        !passwordMismatch;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canSubmit) return;

        if (newPassword && newPassword !== confirmPassword) {
            setResult({ type: "error", message: "New passwords do not match." });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const res = await updateUserSecurity({
                currentPassword,
                newEmail,
                newPassword,
            });

            if (res.emailChanged) {
                // Email changed — force sign-out so session refreshes
                setResult({
                    type: "success",
                    message: "Email updated. Signing you out for security…",
                });
                setTimeout(() => signOut({ callbackUrl: "/user/signin" }), 1500);
            } else {
                setResult({ type: "success", message: "Security settings updated." });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setTimeout(() => {
                    router.push("/user");
                    router.refresh();
                }, 1000);
            }
        } catch (err) {
            setResult({
                type: "error",
                message: err instanceof Error ? err.message : "Failed to update security settings.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                {/* Left column: Email + Password */}
                <div className="flex flex-col h-full gap-6">
                    {/* Email */}
                    <div className="rounded-[2.5rem] border border-white/6 bg-secondary/20 p-8 shadow-2xl backdrop-blur-xl">
                        <label className="mb-3 block text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                            <span className="flex items-center gap-2">
                                <FiMail size={12} /> Change Email
                            </span>
                        </label>
                        <p className="mb-4 text-sm text-lightgrey/60 font-medium">
                            Current: <span className="text-lightgrey">{currentEmail}</span>
                        </p>
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            maxLength={200}
                            placeholder="new-email@example.com"
                            autoComplete="email"
                            className="w-full rounded-2xl border border-white/8 bg-primary-950/50 px-5 py-4 text-base text-offwhite placeholder:text-lightgrey/30 focus:border-tertiary/40 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* New Password */}
                    <div className="rounded-[2.5rem] border border-white/6 bg-secondary/20 p-8 shadow-2xl backdrop-blur-xl">
                        <label className="mb-3 block text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                            <span className="flex items-center gap-2">
                                <FiLock size={12} /> Change Password
                            </span>
                        </label>
                        <div className="space-y-4">
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New password"
                                autoComplete="new-password"
                                className="w-full rounded-2xl border border-white/8 bg-primary-950/50 px-5 py-4 text-base text-offwhite placeholder:text-lightgrey/30 focus:border-tertiary/40 focus:outline-none transition-colors"
                            />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                                className={`w-full rounded-2xl border bg-primary-950/50 px-5 py-4 text-base text-offwhite placeholder:text-lightgrey/30 focus:outline-none transition-colors ${
                                    passwordMismatch
                                        ? "border-red/50 focus:border-red"
                                        : "border-white/8 focus:border-tertiary/40"
                                }`}
                            />
                            {passwordMismatch && (
                                <p className="text-sm font-bold text-red">
                                    Passwords do not match.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Feedback */}
                    {result && (
                        <p
                            className={`rounded-2xl border px-5 py-3 text-sm font-bold ${
                                result.type === "success"
                                    ? "border-green/20 bg-green/10 text-green"
                                    : "border-red/20 bg-red/10 text-red"
                            }`}
                        >
                            {result.message}
                        </p>
                    )}
                </div>

                {/* Right column: Confirm Identity */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="rounded-[2.5rem] border border-white/6 bg-secondary/20 p-6 shadow-2xl backdrop-blur-xl">
                        <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                            <span className="flex items-center gap-2">
                                <FiAlertTriangle size={12} /> Confirm Identity
                            </span>
                        </p>
                        <p className="mb-4 text-sm text-lightgrey/60 font-medium leading-relaxed">
                            Enter your current password to authorize these changes.
                        </p>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            placeholder="Current password"
                            autoComplete="current-password"
                            className="w-full rounded-2xl border border-white/8 bg-primary-950/50 px-5 py-4 text-base text-offwhite placeholder:text-lightgrey/30 focus:border-tertiary/40 focus:outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4 mt-6">
                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="inline-flex items-center gap-3 rounded-2xl bg-tertiary px-7 py-4 text-sm font-black text-offblack shadow-xl shadow-tertiary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <FiSave />
                    {loading ? "Saving…" : "Save Changes"}
                </button>
                <Link
                    href={cancelHref}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-secondary/20 px-7 py-4 text-sm font-black text-lightgrey backdrop-blur-xl transition-all hover:border-white/15 hover:text-offwhite"
                >
                    Cancel
                </Link>
            </div>
        </form>
    );
}
