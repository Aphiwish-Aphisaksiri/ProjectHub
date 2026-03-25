export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { FiFolder, FiPlus, FiLock, FiGlobe, FiCheckSquare, FiFileText } from "react-icons/fi";

export default async function ProjectsPage() {
    const user = await getCurrentUser();

    const projects = user
        ? await prisma.project.findMany({
              where: { ownerId: user.id },
              orderBy: { createdAt: "desc" },
              include: { _count: { select: { tasks: true, notes: true } } },
          })
        : [];

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
                        {/* Left: icon + title */}
                        <div className="text-center md:text-left">
                            <h1 className="text-6xl font-black tracking-tighter text-offwhite flex items-center gap-4 justify-center md:justify-start">
                                <span className="p-3 bg-tertiary/20 rounded-3xl border border-tertiary/30">
                                    <FiFolder className="text-tertiary" size={40} />
                                </span>
                                Projects
                            </h1>
                            <p className="mt-4 text-lightgrey text-lg font-medium">
                                Your complete body of work, organized and ready for the world
                            </p>
                            <p className="mt-2 text-lightgrey text-md font-medium">
                                {projects.length} project{projects.length !== 1 ? "s" : ""} found, {"let's get back to building!"}
                            </p>
                        </div>

                        {/* Right: CTA */}
                        <Link
                            href="/projects/new"
                            className="group relative px-8 py-4 bg-tertiary text-offblack font-black rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-tertiary/20 flex items-center gap-3"
                        >
                            <FiPlus className="group-hover:rotate-90 transition-transform" />
                            New Project
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="max-w-7xl mx-auto px-6 mt-6 relative z-20">

            {/* Empty state */}
            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-24 gap-6">
                    <div className="bg-tertiary/10 border border-tertiary/20 w-20 h-20 rounded-3xl flex items-center justify-center">
                        <FiFolder size={36} className="text-tertiary" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-black text-offwhite mb-2">No projects yet</h2>
                        <p className="text-lightgrey text-sm">Create your first project to get started.</p>
                    </div>
                    <Link
                        href="/projects/new"
                        className="flex items-center gap-2 px-6 py-3 bg-tertiary hover:opacity-90 text-offblack font-black rounded-2xl text-sm transition-all hover:scale-[1.03]"
                    >
                        <FiPlus size={15} /> Create Your First Project
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {projects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/projects/${project.slug}`}
                            className="group bg-secondary/20 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col gap-4 hover:border-white/15 hover:bg-secondary/40 transition-all duration-300 shadow-xl shadow-black/10"
                        >
                            {/* Card top row */}
                            <div className="flex items-start justify-between">
                                <div className="bg-tertiary/10 border border-tertiary/20 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                                    <FiFolder size={18} className="text-tertiary" />
                                </div>
                                <span
                                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                                        project.visibility === "PUBLIC"
                                            ? "bg-green/10 text-green border-green/20"
                                            : "bg-lightgrey/10 text-lightgrey border-lightgrey/20"
                                    }`}
                                >
                                    {project.visibility === "PUBLIC" ? <FiGlobe size={10} /> : <FiLock size={10} />}
                                    {project.visibility === "PUBLIC" ? "Public" : "Private"}
                                </span>
                            </div>

                            {/* Title + description */}
                            <div>
                                <h3 className="text-offwhite font-black text-lg tracking-tight group-hover:text-tertiary transition-colors">
                                    {project.title}
                                </h3>
                                {project.description && (
                                    <p className="text-lightgrey text-sm mt-1 line-clamp-2 leading-relaxed">
                                        {project.description}
                                    </p>
                                )}
                            </div>

                            {/* Footer stats */}
                            <div className="flex items-center gap-4 mt-auto pt-3 border-t border-white/5 text-sm text-lightgrey">
                                <span className="flex items-center gap-1.5">
                                    <FiCheckSquare size={13} className="text-green" />
                                    {project._count.tasks} task{project._count.tasks !== 1 ? "s" : ""}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <FiFileText size={13} className="text-secondary-400" />
                                    {project._count.notes} note{project._count.notes !== 1 ? "s" : ""}
                                </span>
                                <span className="ml-auto text-xs text-lightgrey/60">
                                    {new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            </div>{/* end max-w-7xl */}
        </div>
    );
}