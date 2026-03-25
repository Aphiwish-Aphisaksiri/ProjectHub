export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FiPlus, FiCheckSquare, FiFileText, FiLock, FiGlobe, FiCalendar, FiArrowRight, FiFolder } from "react-icons/fi";

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
        <div className="min-h-full bg-primary text-offwhite pb-20">

            {/* ── Hero Banner ── */}
            <div className="relative min-h-50 bg-linear-to-br from-primary-800 via-secondary-900 to-primary-950 overflow-hidden border-b border-white/5">
                {/* Decorative blur blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-tertiary/10 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 h-full flex items-end pb-8 relative z-10 pt-6">
                    <div className="flex flex-col md:flex-row items-center md:items-end justify-between w-full gap-8">
                        {/* Left: icon + title + meta */}
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl 2xl:text-5xl font-black tracking-tighter text-offwhite flex items-center gap-4 justify-center md:justify-start">
                                <span className="p-3 bg-tertiary/20 rounded-3xl border border-tertiary/30">
                                    <FiFolder className="text-tertiary" size={36} />
                                </span>
                                {project.title}
                            </h1>
                            <div className="mt-3 flex items-center gap-3 justify-center md:justify-start flex-wrap">
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
                                <span className="flex items-center gap-1.5 text-xs text-lightgrey/70 font-medium">
                                    <FiCalendar size={11} />
                                    Created {new Date(project.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                </span>
                            </div>
                            {project.description && (
                                <p className="mt-2 text-lightgrey text-base font-medium max-w-full">
                                    {project.description}
                                </p>
                            )}
                        </div>

                        {/* Right: action buttons */}
                        <div className="flex gap-3 shrink-0">
                            <Link
                                href={`/projects/${slug}/tasks/new`}
                                className="group flex items-center gap-2 px-6 py-3 bg-secondary-400/10 hover:bg-secondary-400/20 border border-secondary-400/20 text-secondary-400 font-black rounded-2xl text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/20"
                            >
                                <FiPlus className="group-hover:rotate-90 transition-transform" size={15} /> New Task
                            </Link>
                            <Link
                                href={`/projects/${slug}/notes/new`}
                                className="group flex items-center gap-2 px-6 py-3 bg-secondary-400/10 hover:bg-secondary-400/20 border border-secondary-400/20 text-secondary-400 font-black rounded-2xl text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/20"
                            >
                                <FiPlus className="group-hover:rotate-90 transition-transform" size={15} /> New Note
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="max-w-7xl mx-auto px-6 mt-6 relative z-20">

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

            </div>{/* end max-w-7xl */}
        </div>
    );
}