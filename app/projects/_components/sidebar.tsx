"use client";

import { GoHome, GoGear } from "react-icons/go";
import { LuNotebookPen } from "react-icons/lu";
import { FiPlus } from "react-icons/fi";
import { useEffect, useState } from "react";
import { Project } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
    const [projectsList, setProjectsList] = useState<Project[]>([]);
    const pathname = usePathname();

    useEffect(() => {
        const fetchProjects = async () => {
            const res = await fetch("/api/projects");
            if (res.ok) {
                const data = await res.json();
                const list = data.map((project: Project) => ({
                    id: project.id,
                    title: project.title,
                    slug: project.slug,
                }));
                setProjectsList(list);
            } else {
                setProjectsList([]);
            }
        };
        fetchProjects();
    }, []);

    return (
        <aside className="max-md:hidden flex flex-col w-56 h-full px-3 py-6 justify-between bg-white/5 backdrop-blur-xl border-r border-white/10 flex-shrink-0">

            {/* Top section */}
            <div className="flex flex-col gap-1">
                {/* All Projects link */}
                <Link
                    href="/projects"
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        pathname === "/projects"
                            ? "bg-tertiary/20 text-tertiary"
                            : "text-offwhite hover:bg-white/5"
                    }`}
                >
                    <GoHome size={15} /> All Projects
                </Link>

                <div className="border-t border-white/10 my-2" />

                {/* Projects label */}
                <p className="text-xs text-lightgrey/50 font-bold uppercase tracking-widest px-3 mb-1">Projects</p>

                {/* Project list */}
                <div className="flex flex-col gap-0.5">
                    {projectsList.map((project) => (
                        <Link
                            key={project.slug}
                            href={`/projects/${project.slug}`}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                                pathname === `/projects/${project.slug}`
                                    ? "bg-tertiary/20 text-tertiary font-bold"
                                    : "text-lightgrey hover:bg-white/5 hover:text-offwhite"
                            }`}
                        >
                            <LuNotebookPen size={13} className="flex-shrink-0" />
                            <span className="truncate">{project.title}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Bottom section */}
            <div className="flex flex-col gap-1">
                {/* New Project button */}
                <Link
                    href="/projects/new"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-tertiary/10 hover:bg-tertiary/20 border border-tertiary/20 text-tertiary rounded-xl text-sm font-bold transition-all mb-2"
                >
                    <FiPlus size={14} /> New Project
                </Link>

                <div className="border-t border-white/10 my-1" />

                <Link
                    href="/settings"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-lightgrey hover:bg-white/5 hover:text-offwhite transition-all"
                >
                    <GoGear size={15} /> Settings
                </Link>
            </div>

        </aside>
    );
}