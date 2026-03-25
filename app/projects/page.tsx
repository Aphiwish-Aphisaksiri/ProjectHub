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
        <div className="min-h-full text-offwhite p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-offwhite tracking-tight">Your Projects</h1>
                    <p className="text-lightgrey text-sm mt-1">
                        {projects.length} project{projects.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <Link
                    href="/projects/new"
                    className="flex items-center gap-2 px-5 py-3 bg-tertiary hover:opacity-90 text-offblack font-black rounded-2xl text-sm transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-tertiary/20"
                >
                    <FiPlus size={15} /> New Project
                </Link>
            </div>

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
                                <div className="bg-tertiary/10 border border-tertiary/20 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
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
        </div>
    );
}