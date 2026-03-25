export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FiPlus, FiCheckSquare, FiFileText, FiLock, FiGlobe, FiCalendar, FiArrowRight } from "react-icons/fi";

const priorityConfig: Record<string, { label: string; color: string }> = {
    HIGH:   { label: "High", color: "bg-red/10 text-red border-red/20" },
    MEDIUM: { label: "Med",  color: "bg-tertiary/10 text-tertiary border-tertiary/20" },
    LOW:    { label: "Low",  color: "bg-lightgrey/10 text-lightgrey border-lightgrey/20" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
    TODO:        { label: "Todo",        color: "text-lightgrey" },
    IN_PROGRESS: { label: "In Progress", color: "text-tertiary" },
    DONE:        { label: "Done",        color: "text-green" },
    ARCHIVED:    { label: "Archived",    color: "text-lightgrey/50" },
};

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const project = await prisma.project.findUnique({
        where: { slug },
        include: {
            tasks: { orderBy: { createdAt: "desc" }, take: 5 },
            notes: { orderBy: { createdAt: "desc" }, take: 5 },
            _count: { select: { tasks: true, notes: true } },
        },
    });

    if (!project) {
        return (
            <div className="min-h-full flex items-center justify-center">
                <p className="text-lightgrey">Project not found.</p>
            </div>
        );
    }

    const [inProgressCount, doneCount] = await Promise.all([
        prisma.task.count({ where: { projectId: project.id, status: "IN_PROGRESS" } }),
        prisma.task.count({ where: { projectId: project.id, status: "DONE" } }),
    ]);

    return (
        <div className="flex flex-col mx-auto min-h-full max-w-7xl text-offwhite p-8 pb-20">

            {/* ── Top Bar ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl font-black tracking-tight text-offwhite">{project.title}</h1>
                        <span
                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                                project.visibility === "PUBLIC"
                                    ? "bg-green/10 text-green border-green/20"
                                    : "bg-lightgrey/10 text-lightgrey border-lightgrey/20"
                            }`}
                        >
                            {project.visibility === "PUBLIC" ? <FiGlobe size={10} /> : <FiLock size={10} />}
                            {project.visibility.charAt(0) + project.visibility.slice(1).toLowerCase()}
                        </span>
                    </div>
                    {project.description && (
                        <p className="text-lightgrey leading-relaxed max-w-xl">{project.description}</p>
                    )}
                    <p className="flex items-center gap-1.5 text-xs text-lightgrey/60">
                        <FiCalendar size={11} />
                        Created{" "}
                        {new Date(project.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                </div>

                <div className="flex gap-3 shrink-0">
                    <Link
                        href={`/projects/${slug}/tasks/new`}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green/10 hover:bg-green/20 border border-green/20 text-green font-bold rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <FiPlus size={14} /> New Task
                    </Link>
                    <Link
                        href={`/projects/${slug}/notes/new`}
                        className="flex items-center gap-2 px-4 py-2.5 bg-secondary-400/10 hover:bg-secondary-400/20 border border-secondary-400/20 text-secondary-400 font-bold rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <FiPlus size={14} /> New Note
                    </Link>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Total Tasks",  value: project._count.tasks, icon: FiCheckSquare, color: "text-tertiary",      bg: "bg-tertiary/10",      border: "border-tertiary/20" },
                    { label: "In Progress",  value: inProgressCount,      icon: FiCheckSquare, color: "text-secondary-400", bg: "bg-secondary-400/10", border: "border-secondary-400/20" },
                    { label: "Completed",    value: doneCount,            icon: FiCheckSquare, color: "text-green",         bg: "bg-green/10",         border: "border-green/20" },
                    { label: "Notes",        value: project._count.notes, icon: FiFileText,    color: "text-lightgrey",     bg: "bg-lightgrey/10",     border: "border-lightgrey/20" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-secondary/20 backdrop-blur-xl border border-white/5 rounded-2xl p-5 flex flex-col gap-3 shadow-lg shadow-black/10"
                    >
                        <div className={`${stat.bg} ${stat.color} w-9 h-9 rounded-xl flex items-center justify-center border ${stat.border}`}>
                            <stat.icon size={16} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-offwhite">{stat.value}</p>
                            <p className="text-xs text-lightgrey font-medium">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Two-column: Tasks + Notes ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent Tasks */}
                <div className="bg-secondary/20 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl shadow-black/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-tertiary/5 blur-3xl rounded-full pointer-events-none" />
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-black text-offwhite flex items-center gap-2">
                            <FiCheckSquare size={16} className="text-tertiary" /> Recent Tasks
                        </h2>
                        <Link
                            href={`/projects/${slug}/tasks`}
                            className="flex items-center gap-1 text-xs text-tertiary hover:text-tertiary/80 font-bold transition-colors"
                        >
                            View all <FiArrowRight size={12} />
                        </Link>
                    </div>
                    {project.tasks.length === 0 ? (
                        <p className="text-lightgrey text-sm py-4 text-center">No tasks yet.</p>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {project.tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between gap-3 p-3 bg-white/5 hover:bg-white/[0.07] rounded-xl border border-white/5 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-offwhite text-sm font-bold truncate">{task.title}</p>
                                        <p className={`text-xs font-medium mt-0.5 ${statusConfig[task.status]?.color ?? "text-lightgrey"}`}>
                                            {statusConfig[task.status]?.label ?? task.status}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                                            priorityConfig[task.priority]?.color ?? "bg-lightgrey/10 text-lightgrey border-lightgrey/20"
                                        }`}
                                    >
                                        {priorityConfig[task.priority]?.label ?? task.priority}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Notes */}
                <div className="bg-secondary/20 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl shadow-black/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-secondary-400/5 blur-3xl rounded-full pointer-events-none" />
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-black text-offwhite flex items-center gap-2">
                            <FiFileText size={16} className="text-secondary-400" /> Recent Notes
                        </h2>
                        <Link
                            href={`/projects/${slug}/notes`}
                            className="flex items-center gap-1 text-xs text-secondary-400 hover:text-secondary-400/80 font-bold transition-colors"
                        >
                            View all <FiArrowRight size={12} />
                        </Link>
                    </div>
                    {project.notes.length === 0 ? (
                        <p className="text-lightgrey text-sm py-4 text-center">No notes yet.</p>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {project.notes.map((note) => (
                                <div
                                    key={note.id}
                                    className="p-3 bg-white/5 hover:bg-white/[0.07] rounded-xl border border-white/5 transition-colors"
                                >
                                    <p className="text-offwhite text-sm font-bold truncate">{note.title}</p>
                                    {note.body && (
                                        <p className="text-lightgrey text-xs mt-1 line-clamp-2 leading-relaxed">{note.body}</p>
                                    )}
                                    <p className="text-lightgrey/50 text-xs mt-2">
                                        {new Date(note.createdAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}