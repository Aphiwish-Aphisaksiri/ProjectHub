"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiSave } from "react-icons/fi";
import { updateUserProfile } from "@/app/user/action";

type Props = {
    initialName: string;
    initialAvatarUrl: string;
    cancelHref: string;
};

type Result = { type: "success" | "error"; message: string } | null;

export default function ProfileEditorForm({
    initialName,
    initialAvatarUrl,
    cancelHref,
}: Props) {
    const router = useRouter();
    const [name, setName] = useState(initialName);
    const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<Result>(null);

    const isUnchanged =
        name.trim() === initialName.trim() &&
        avatarUrl.trim() === (initialAvatarUrl ?? "").trim();

    const canSubmit = !loading && !isUnchanged && name.trim().length > 0;

    const initials = name
        ? name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : "??";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canSubmit) return;

        setLoading(true);
        setResult(null);

        try {
            await updateUserProfile({ name, avatarUrl });
            setResult({ type: "success", message: "Profile updated successfully." });
            window.dispatchEvent(new Event("userSessionChanged"));
            router.push("/user");
            router.refresh();
        } catch (err) {
            setResult({
                type: "error",
                message: err instanceof Error ? err.message : "Failed to update profile.",
            });
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-[1.5fr_0.5fr]">
                {/* Left column: Name + Avatar URL */}
                <div className="flex flex-col h-full gap-6">
                    {/* Name */}
                    <div className="rounded-[2.5rem] border border-white/6 bg-secondary/20 p-8 shadow-2xl backdrop-blur-xl">
                        <label className="mb-3 block text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            maxLength={100}
                            placeholder="Your name…"
                            className="w-full rounded-2xl border border-white/8 bg-primary-950/50 px-5 py-4 text-lg font-bold text-offwhite placeholder:text-lightgrey/30 focus:border-tertiary/40 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Avatar URL */}
                    <div className="rounded-[2.5rem] border border-white/6 bg-secondary/20 p-8 shadow-2xl backdrop-blur-xl">
                        <label className="mb-3 block text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                            Avatar URL
                        </label>
                        <input
                            type="url"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            maxLength={500}
                            placeholder="https://example.com/avatar.jpg"
                            className="w-full rounded-2xl border border-white/8 bg-primary-950/50 px-5 py-4 text-base text-offwhite placeholder:text-lightgrey/30 focus:border-tertiary/40 focus:outline-none transition-colors"
                        />
                        <p className="mt-2 text-sm font-medium text-lightgrey/60">
                            Paste a link to an image. Leave empty to use your initials.
                        </p>
                    </div>

                    {/* Error feedback */}
                    {result?.type === "error" && (
                        <p className="rounded-2xl border border-red/20 bg-red/10 px-5 py-3 text-sm font-bold text-red">
                            {result.message}
                        </p>
                    )}
                </div>

                {/* Right column: Avatar Preview */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="rounded-[2.5rem] border border-white/6 bg-secondary/20 p-6 shadow-2xl backdrop-blur-xl">
                        <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                            Preview
                        </p>
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-28 h-28 rounded-3xl bg-secondary/30 border-2 border-white/10 shadow-xl flex items-center justify-center text-3xl font-black overflow-hidden">
                                {avatarUrl.trim() ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={avatarUrl.trim()}
                                        alt="Avatar preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = "none";
                                        }}
                                    />
                                ) : (
                                    <span className="text-tertiary">{initials}</span>
                                )}
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-black text-offwhite">
                                    {name.trim() || "Your Name"}
                                </p>
                            </div>
                        </div>
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
