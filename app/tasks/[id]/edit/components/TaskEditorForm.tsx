"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiSave, FiX } from "react-icons/fi";
import { updateTask } from "@/app/tasks/action";
import { TaskStatus, Priority } from "@/types";

type Props = {
    taskId: string;
    initialTitle: string;
    initialBody: string;
    initialStatus: string;
    initialPriority: string;
    initialDueDate: string; // YYYY-MM-DD or ""
    cancelHref: string;
};

type Result = { type: "success" | "error"; message: string } | null;

const statusOptions: { value: TaskStatus; label: string; className: string; activeClass: string }[] = [
    {
        value: TaskStatus.TODO,
        label: "To Do",
        className: "border-lightgrey/20 text-lightgrey/50 hover:border-lightgrey/40",
        activeClass: "border-lightgrey/40 bg-lightgrey/10 text-lightgrey",
    },
    {
        value: TaskStatus.IN_PROGRESS,
        label: "In Progress",
        className: "border-tertiary/20 text-tertiary/50 hover:border-tertiary/40",
        activeClass: "border-tertiary/40 bg-tertiary/10 text-tertiary",
    },
    {
        value: TaskStatus.DONE,
        label: "Done",
        className: "border-green/20 text-green/50 hover:border-green/40",
        activeClass: "border-green/40 bg-green/10 text-green",
    },
    {
        value: TaskStatus.ARCHIVED,
        label: "Archived",
        className: "border-lightgrey/10 text-lightgrey/30 hover:border-lightgrey/20",
        activeClass: "border-lightgrey/20 bg-lightgrey/5 text-lightgrey/50",
    },
];

const priorityOptions: { value: Priority; label: string; className: string; activeClass: string }[] = [
    {
        value: Priority.LOW,
        label: "Low",
        className: "border-lightgrey/20 text-lightgrey/50 hover:border-lightgrey/40",
        activeClass: "border-lightgrey/40 bg-lightgrey/10 text-lightgrey",
    },
    {
        value: Priority.MEDIUM,
        label: "Medium",
        className: "border-tertiary/20 text-tertiary/50 hover:border-tertiary/40",
        activeClass: "border-tertiary/40 bg-tertiary/10 text-tertiary",
    },
    {
        value: Priority.HIGH,
        label: "High",
        className: "border-red/20 text-red/50 hover:border-red/40",
        activeClass: "border-red/40 bg-red/10 text-red",
    },
];

export default function TaskEditorForm({
    taskId,
    initialTitle,
    initialBody,
    initialStatus,
    initialPriority,
    initialDueDate,
    cancelHref,
}: Props) {
    const router = useRouter();
    const [title, setTitle] = useState(initialTitle);
    const [body, setBody] = useState(initialBody);
    const [status, setStatus] = useState(initialStatus);
    const [priority, setPriority] = useState(initialPriority);
    const [dueDate, setDueDate] = useState(initialDueDate);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<Result>(null);

    const isUnchanged =
        title.trim() === initialTitle.trim() &&
        body.trim() === initialBody.trim() &&
        status === initialStatus &&
        priority === initialPriority &&
        dueDate === initialDueDate;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loading || !title.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            await updateTask({
                taskId,
                title,
                body,
                status,
                priority,
                dueDate: dueDate || null,
            });
            router.push(cancelHref);
        } catch (err) {
            setResult({
                type: "error",
                message: err instanceof Error ? err.message : "Failed to update task.",
            });
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-[1.5fr_0.5fr]">
                {/* Left column: Title + Description + Actions */}
                <div className="flex flex-col h-full gap-6">
                    {/* Title */}
                    <div className="rounded-[2.5rem] border border-white/6 bg-secondary/20 p-8 shadow-2xl backdrop-blur-xl">
                        <label className="mb-3 block text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            maxLength={200}
                            placeholder="Task title…"
                            className="w-full rounded-2xl border border-white/8 bg-primary-950/50 px-5 py-4 text-lg font-bold text-offwhite placeholder:text-lightgrey/30 focus:border-tertiary/40 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Description */}
                    <div className="flex flex-col rounded-[2.5rem] border border-white/6 bg-secondary/20 p-8 shadow-2xl backdrop-blur-xl">
                        <label className="mb-3 block text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                            Description
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Add a description…"
                            rows={13}
                            className="w-full rounded-2xl border border-white/8 bg-primary-950/50 px-5 py-4 text-base leading-relaxed text-offwhite placeholder:text-lightgrey/30 focus:border-tertiary/40 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Error feedback */}
                    {result?.type === "error" && (
                        <p className="rounded-2xl border border-red/20 bg-red/10 px-5 py-3 text-sm font-bold text-red">
                            {result.message}
                        </p>
                    )}
                </div>

                {/* Right column: Status + Priority + Due Date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-6">
                    {/* Status */}
                    <div className="rounded-[2.5rem] border border-white/6 bg-secondary/20 p-6 shadow-2xl backdrop-blur-xl">
                        <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                            Status
                        </p>
                        <div className="flex flex-col gap-2">
                            {statusOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStatus(opt.value)}
                                    className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                                        status === opt.value ? opt.activeClass : opt.className
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Priority */}
                    <div className="rounded-[2.5rem] border border-white/6 bg-secondary/20 p-6 shadow-2xl backdrop-blur-xl">
                        <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                            Priority
                        </p>
                        <div className="flex flex-col gap-2">
                            {priorityOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setPriority(opt.value)}
                                    className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                                        priority === opt.value ? opt.activeClass : opt.className
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="rounded-[2.5rem] border border-white/6 bg-secondary/20 p-6 shadow-2xl backdrop-blur-xl">
                        <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                            Due Date
                        </p>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full rounded-2xl border border-white/8 bg-primary-950/50 px-4 py-3 text-sm font-bold text-offwhite focus:border-tertiary/40 focus:outline-none transition-colors scheme-dark"
                        />
                        {dueDate && (
                            <button
                                type="button"
                                onClick={() => setDueDate("")}
                                className="mt-3 flex items-center gap-1.5 text-xs font-black text-lightgrey/40 transition-colors hover:text-red"
                            >
                                <FiX size={12} /> Clear date
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4 mt-6">
                <button
                    type="submit"
                    disabled={loading || isUnchanged || !title.trim()}
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
