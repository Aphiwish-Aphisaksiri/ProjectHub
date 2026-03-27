import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
    FiArrowLeft,
    FiCalendar,
    FiCheckSquare,
    FiClock,
    FiEdit3,
    FiFolder,
    FiCircle,
    FiUser,
} from "react-icons/fi";
import NoteContent from "@/app/notes/components/NoteContent";
import { getCurrentUser } from "@/lib/auth";
import { getTaskById } from "@/lib/tasks";
import { TaskStatus, Priority } from "@/types";

export const dynamic = "force-dynamic";

const statusConfig: Record<string, { label: string; className: string }> = {
    [TaskStatus.TODO]: {
        label: "To Do",
        className: "bg-lightgrey/10 text-lightgrey border border-lightgrey/20",
    },
    [TaskStatus.IN_PROGRESS]: {
        label: "In Progress",
        className: "bg-tertiary/10 text-tertiary border border-tertiary/20",
    },
    [TaskStatus.DONE]: {
        label: "Done",
        className: "bg-green/10 text-green border border-green/20",
    },
    [TaskStatus.ARCHIVED]: {
        label: "Archived",
        className: "bg-lightgrey/5 text-lightgrey/40 border border-lightgrey/10",
    },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
    [Priority.HIGH]: {
        label: "High Priority",
        className: "bg-red/10 text-red border border-red/20",
    },
    [Priority.MEDIUM]: {
        label: "Medium Priority",
        className: "bg-tertiary/10 text-tertiary border border-tertiary/20",
    },
    [Priority.LOW]: {
        label: "Low Priority",
        className: "bg-lightgrey/10 text-lightgrey border border-lightgrey/20",
    },
};

export default async function TaskDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ back?: string }>;
}) {
    const user = await getCurrentUser();
    if (!user) redirect("/user/signin");

    const { id } = await params;
    const { back } = await searchParams;
    const task = await getTaskById(id);

    if (!task) notFound();

    const now = new Date();
    const isOverdue =
        task.dueDate &&
        new Date(task.dueDate) < now &&
        task.status !== TaskStatus.DONE &&
        task.status !== TaskStatus.ARCHIVED;

    const status =
        statusConfig[task.status] ?? {
            label: task.status,
            className: "bg-lightgrey/10 text-lightgrey border border-lightgrey/20",
        };
    const priority =
        priorityConfig[task.priority] ?? {
            label: task.priority,
            className: "bg-lightgrey/10 text-lightgrey border border-lightgrey/20",
        };

    const backHref = back ?? "/tasks";
    const backLabel = back ? `Back to ${task.project.title} Tasks` : "All Tasks";
    const editHref = `/tasks/${task.id}/edit${back ? `?back=${encodeURIComponent(back)}` : ""}`;

    return (
        <div className="min-h-full overflow-x-hidden bg-primary pb-20 text-offwhite selection:bg-tertiary/30">
            {/* Hero Banner */}
            <div className="relative overflow-hidden border-b border-white/5 bg-linear-to-br from-primary-800 via-secondary-900 to-primary-950">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-tertiary/10 blur-[100px] animate-pulse" />
                    <div
                        className="absolute bottom-[-20%] right-[-10%] h-[50%] w-[50%] rounded-full bg-secondary-500/10 blur-[100px] animate-pulse"
                        style={{ animationDelay: "2s" }}
                    />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
                </div>

                <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-end gap-8 px-6 pb-10 pt-6">
                    <div className="flex flex-col md:flex-row items-center md:items-end justify-between w-full gap-4">
                        <div className="max-w-4xl">
                            <Link
                                href={backHref}
                                className="mb-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-tertiary transition-all hover:gap-4"
                            >
                                <FiArrowLeft /> {backLabel}
                            </Link>

                            <div className="flex items-start md:items-center gap-4">
                                <span className="shrink-0 rounded-3xl border border-tertiary/30 bg-tertiary/20 p-3">
                                    <FiCheckSquare className="text-tertiary" size={38} />
                                </span>
                                <div>
                                    <h1 className="text-3xl 2xl:text-5xl font-black tracking-tighter text-offwhite">
                                        {task.title}
                                    </h1>

                                    {/* Badge row: task number · priority · due date */}
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className="text-md font-black tabular-nums text-lightgrey/40">
                                            #{task.taskNumber}
                                        </span>
                                        <span
                                            className={`text-sm font-black uppercase tracking-widest px-2 py-1 rounded-lg ${priority.className}`}
                                        >
                                            {priority.label}
                                        </span>
                                        {task.dueDate && (
                                            <span
                                                className={`flex items-center gap-1.5 text-sm font-black px-2.5 py-1 rounded-lg ${
                                                    isOverdue
                                                        ? "bg-red/10 text-red border border-red/20"
                                                        : "bg-primary-950/50 text-lightgrey/60 border border-white/10"
                                                }`}
                                            >
                                                <FiCalendar size={11} />
                                                {isOverdue && "Overdue · "}
                                                {new Date(task.dueDate).toLocaleDateString(
                                                    undefined,
                                                    { month: "long", day: "numeric", year: "numeric" }
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex shrink-0">
                            <Link
                                href={editHref}
                                className="group flex items-center gap-2 px-6 py-3 bg-secondary-400/10 hover:bg-secondary-400/20 border border-secondary-400/20 text-secondary-400 font-black rounded-2xl text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/20"
                                >
                                <FiEdit3 className="group-hover:rotate-10 transition-transform" />
                                Edit Task
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-20 mx-auto mt-10 max-w-7xl px-6">
                <div className="grid gap-8 xl:grid-cols-[1.5fr_0.9fr]">
                    {/* Description */}
                    <section className="rounded-[2.5rem] border border-white/6 bg-secondary/20 p-8 shadow-2xl backdrop-blur-xl md:p-10">
                        <div className="mb-6 flex items-center gap-3 border-b border-white/6 pb-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-tertiary/20 bg-tertiary/10 text-tertiary">
                                <FiCheckSquare size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                                    Task Description
                                </p>
                                <h2 className="text-2xl font-black tracking-tight text-offwhite">
                                    Details
                                </h2>
                            </div>
                        </div>

                        {task.body ? (
                            <NoteContent body={task.body} />
                        ) : (
                            <div className="rounded-4xl border border-dashed border-white/10 p-10 text-center">
                                <p className="text-lg font-bold text-lightgrey/40">No description yet</p>
                                <p className="mt-1 text-sm text-lightgrey/30">
                                    Add one by editing this task.
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Metadata Sidebar */}
                    <aside className="space-y-6">
                        <div className="rounded-[2.5rem] border border-white/6 bg-secondary/20 p-8 shadow-2xl backdrop-blur-xl">
                            <p className="mb-6 text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                                Details
                            </p>
                            <div className="space-y-4">
                                {/* Status */}
                                <div className="rounded-2xl border border-white/6 bg-primary-950/40 p-4">
                                    <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-lightgrey/60">
                                        <FiCircle size={12} /> Status
                                    </p>
                                    <span
                                        className={`inline-block rounded-xl px-3 py-1 text-sm font-black ${status.className}`}
                                    >
                                        {status.label}
                                    </span>
                                </div>

                                {/* Assignee */}
                                <div className="rounded-2xl border border-white/6 bg-primary-950/40 p-4">
                                    <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-lightgrey/60">
                                        <FiUser size={12} /> Assignee
                                    </p>
                                    <p className="text-lg font-bold text-offwhite">
                                        {task.assignee?.name ?? (
                                            <span className="text-lightgrey/40">Unassigned</span>
                                        )}
                                    </p>
                                </div>

                                {/* Project */}
                                <div className="rounded-2xl border border-white/6 bg-primary-950/40 p-4">
                                    <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-lightgrey/60">
                                        <FiFolder size={12} /> Project
                                    </p>
                                    <Link
                                        href={`/projects/${task.project.slug}`}
                                        className="text-lg font-bold text-offwhite transition-colors hover:text-tertiary"
                                    >
                                        {task.project.title}
                                    </Link>
                                </div>

                                {/* Created */}
                                <div className="rounded-2xl border border-white/6 bg-primary-950/40 p-4">
                                    <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-lightgrey/60">
                                        <FiClock size={12} /> Created
                                    </p>
                                    <p className="text-lg font-bold text-offwhite">
                                        {new Date(task.createdAt).toLocaleDateString(undefined, {
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>

                                {/* Updated */}
                                <div className="rounded-2xl border border-white/6 bg-primary-950/40 p-4">
                                    <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-lightgrey/60">
                                        <FiClock size={12} /> Updated
                                    </p>
                                    <p className="text-lg font-bold text-offwhite">
                                        {new Date(task.updatedAt).toLocaleDateString(undefined, {
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
