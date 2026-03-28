"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiSave, FiGlobe, FiLock } from "react-icons/fi";
import { updateProject } from "@/app/projects/action";
import { ProjectVisibility } from "@/types";

const DESCRIPTION_LIMIT = 250;

const visibilityOptions: {
    value: ProjectVisibility;
    label: string;
    icon: typeof FiGlobe;
    className: string;
    activeClass: string;
}[] = [
    {
        value: ProjectVisibility.PRIVATE,
        label: "Private",
        icon: FiLock,
        className: "border-lightgrey/20 text-lightgrey/50 hover:border-lightgrey/40",
        activeClass: "border-lightgrey/40 bg-lightgrey/10 text-lightgrey",
    },
    {
        value: ProjectVisibility.PUBLIC,
        label: "Public",
        icon: FiGlobe,
        className: "border-green/20 text-green/50 hover:border-green/40",
        activeClass: "border-green/40 bg-green/10 text-green",
    },
];

type Props = {
    projectId: string;
    initialTitle: string;
    initialDescription: string;
    initialVisibility: ProjectVisibility;
    cancelHref: string;
};

type Result = { type: "success" | "error"; message: string } | null;

export default function ProjectEditorForm({
    projectId,
    initialTitle,
    initialDescription,
    initialVisibility,
    cancelHref,
}: Props) {
    const router = useRouter();
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [visibility, setVisibility] = useState<ProjectVisibility>(initialVisibility);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<Result>(null);
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    const isDescriptionExceed = description.length > DESCRIPTION_LIMIT;

    const isUnchanged =
        title.trim() === initialTitle.trim() &&
        description.trim() === initialDescription.trim() &&
        visibility === initialVisibility;

    // Debounced duplicate title check (excluding this project)
    useEffect(() => {
        if (!title || title.length < 2) {
            setIsDuplicate(false);
            return;
        }

        // Skip check if title hasn't changed from the original
        if (title.trim() === initialTitle.trim()) {
            setIsDuplicate(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsChecking(true);
            try {
                const res = await fetch(
                    `/api/projects/title-exists?title=${encodeURIComponent(title)}&excludeId=${encodeURIComponent(projectId)}`
                );
                if (res.ok) {
                    const data = await res.json();
                    setIsDuplicate(data.exists);
                } else {
                    setIsDuplicate(false);
                }
            } catch {
                setIsDuplicate(false);
            } finally {
                setIsChecking(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [title, projectId, initialTitle]);

    const canSubmit =
        !loading &&
        !isUnchanged &&
        !isDuplicate &&
        !isDescriptionExceed &&
        title.trim().length > 0;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canSubmit) return;

        setLoading(true);
        setResult(null);

        try {
            const updated = await updateProject({
                projectId,
                title,
                description,
                visibility,
            });
            router.push(`/projects/${updated.slug}`);
        } catch (err) {
            setResult({
                type: "error",
                message: err instanceof Error ? err.message : "Failed to update project.",
            });
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-[1.5fr_0.5fr]">
                {/* Left column: Title + Description */}
                <div className="flex flex-col h-full gap-6">
                    {/* Title */}
                    <div className="rounded-[2.5rem] border border-white/6 bg-secondary/20 p-8 shadow-2xl backdrop-blur-xl">
                        <label className="mb-3 block text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                            Title
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                maxLength={100}
                                placeholder="Project title…"
                                className={`w-full rounded-2xl border bg-primary-950/50 px-5 py-4 text-lg font-bold text-offwhite placeholder:text-lightgrey/30 focus:outline-none transition-colors ${
                                    isDuplicate
                                        ? "border-red/50 focus:border-red"
                                        : "border-white/8 focus:border-tertiary/40"
                                }`}
                            />
                            {isChecking && (
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-lightgrey">
                                    Checking…
                                </span>
                            )}
                        </div>
                        {isDuplicate && (
                            <p className="mt-2 text-sm font-bold text-red">
                                A project with this title already exists.
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="flex flex-col rounded-[2.5rem] border border-white/6 bg-secondary/20 p-8 shadow-2xl backdrop-blur-xl">
                        <div className="mb-3 flex items-center justify-between">
                            <label className="block text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                                Description
                            </label>
                            <span
                                className={`text-sm font-bold ${
                                    isDescriptionExceed ? "text-red" : "text-lightgrey"
                                }`}
                            >
                                {description.length} / {DESCRIPTION_LIMIT}
                            </span>
                        </div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="A short description of your project…"
                            rows={6}
                            className={`w-full resize-none rounded-2xl border bg-primary-950/50 px-5 py-4 text-base leading-relaxed text-offwhite placeholder:text-lightgrey/30 focus:outline-none transition-colors ${
                                isDescriptionExceed
                                    ? "border-red/50 focus:border-red"
                                    : "border-white/8 focus:border-tertiary/40"
                            }`}
                        />
                    </div>

                    {/* Error feedback */}
                    {result?.type === "error" && (
                        <p className="rounded-2xl border border-red/20 bg-red/10 px-5 py-3 text-sm font-bold text-red">
                            {result.message}
                        </p>
                    )}
                </div>

                {/* Right column: Visibility */}
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-6">
                    <div className="rounded-[2.5rem] border border-white/6 bg-secondary/20 p-6 shadow-2xl backdrop-blur-xl">
                        <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                            Visibility
                        </p>
                        <div className="flex flex-col gap-2">
                            {visibilityOptions.map((opt) => {
                                const Icon = opt.icon;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setVisibility(opt.value)}
                                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                                            visibility === opt.value
                                                ? opt.activeClass
                                                : opt.className
                                        }`}
                                    >
                                        <Icon size={12} />
                                        {opt.label}
                                    </button>
                                );
                            })}
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
