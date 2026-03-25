"use client";

import { GoHome, GoGear } from "react-icons/go";
import { FiPlus, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useEffect, useState } from "react";
import { Project } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCurrentUserName } from "@/components/action";

export default function Sidebar() {
    const [projectsList, setProjectsList] = useState<Project[]>([]);
    const [collapsed, setCollapsed] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const fetchProjects = async () => {
            const res = await fetch("/api/projects");
            if (res.ok) {
                const data = await res.json();
                setProjectsList(data.map((p: Project) => ({ id: p.id, title: p.title, slug: p.slug })));
            } else {
                setProjectsList([]);
            }
        };
        const fetchUser = async () => {
            const name = await getCurrentUserName();
            setUserName(name);
        };
        fetchProjects();
        fetchUser();
    }, []);

    const initials = userName
        ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "??";

    return (
        <aside
            className={`max-md:hidden flex flex-col h-full py-4 justify-between bg-white/3 backdrop-blur-xl border-r border-white/10 shrink-0 transition-all duration-300 overflow-hidden ${
                collapsed ? "w-14 px-2" : "w-56 px-3"
            }`}
        >
            {/* ── Top section ── */}
            <div className="flex flex-col gap-1">

                {/* Workspace header */}
                <div className={`flex items-center mb-3 min-w-0 ${collapsed ? "flex-col gap-2" : "gap-2.5 px-1"}`}>
                    {/* Avatar / initials */}
                    <div className="w-8 h-8 rounded-xl bg-tertiary/20 border border-tertiary/30 flex items-center justify-center text-tertiary text-xs font-black shrink-0">
                        {initials}
                    </div>

                    {/* Name — visible only when expanded */}
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-offwhite text-sm font-black truncate leading-tight">
                                {userName ?? "Loading…"}
                            </p>
                            <p className="text-lightgrey/40 text-xs leading-tight">Workspace</p>
                        </div>
                    )}

                    {/* Collapse toggle */}
                    <button
                        onClick={() => setCollapsed((c) => !c)}
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className="p-1 rounded-lg text-lightgrey/40 hover:text-offwhite hover:bg-white/5 transition-all shrink-0"
                    >
                        {collapsed
                            ? <FiChevronRight size={13} />
                            : <FiChevronLeft size={13} />
                        }
                    </button>
                </div>

                <div className="border-t border-white/10 mb-2" />

                {/* All Projects link */}
                <Link
                    href="/projects"
                    title="All Projects"
                    className={`flex items-center gap-2.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        collapsed ? "justify-center px-2" : "px-2"
                    } ${
                        pathname === "/projects"
                            ? "border-l-2 border-tertiary bg-tertiary/10 text-tertiary"
                            : "border-l-2 border-transparent text-offwhite hover:bg-white/5"
                    }`}
                >
                    <GoHome size={15} className="shrink-0" />
                    {!collapsed && <span>All Projects</span>}
                </Link>

                <div className="border-t border-white/10 my-2" />

                {/* Projects section label */}
                {!collapsed && (
                    <p className="text-xs text-lightgrey/40 font-bold uppercase tracking-widest px-2 mb-1">
                        Projects
                    </p>
                )}

                {/* Project list */}
                <div className="flex flex-col gap-0.5">
                    {projectsList.map((project) => {
                        const isActive = pathname === `/projects/${project.slug}` ||
                            pathname.startsWith(`/projects/${project.slug}/`);
                        return (
                            <Link
                                key={project.slug}
                                href={`/projects/${project.slug}`}
                                title={project.title}
                                className={`flex items-center gap-2.5 py-2 rounded-xl text-sm transition-all ${
                                    collapsed ? "justify-center px-2" : "px-2"
                                } ${
                                    isActive
                                        ? "border-l-2 border-tertiary bg-tertiary/10 text-tertiary font-black"
                                        : "border-l-2 border-transparent text-lightgrey hover:bg-white/5 hover:text-offwhite"
                                }`}
                            >
                                {/* Color dot replacing the old notebook icon */}
                                <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                                    isActive ? "bg-tertiary" : "bg-tertiary/30"
                                }`} />
                                {!collapsed && <span className="truncate">{project.title}</span>}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* ── Bottom section ── */}
            <div className="flex flex-col gap-1">
                {/* New Project */}
                <Link
                    href="/projects/new"
                    title="New Project"
                    className={`flex items-center gap-2 py-2.5 bg-tertiary/10 hover:bg-tertiary/20 border border-tertiary/20 text-tertiary rounded-xl text-sm font-bold transition-all mb-2 ${
                        collapsed ? "justify-center px-2" : "justify-center px-3"
                    }`}
                >
                    <FiPlus size={14} className="shrink-0" />
                    {!collapsed && <span>New Project</span>}
                </Link>

                <div className="border-t border-white/10 my-1" />

                {/* Settings */}
                <Link
                    href="/settings"
                    title="Settings"
                    className={`flex items-center gap-2.5 py-2.5 rounded-xl text-sm font-bold text-lightgrey hover:bg-white/5 hover:text-offwhite transition-all border-l-2 border-transparent ${
                        collapsed ? "justify-center px-2" : "px-2"
                    }`}
                >
                    <GoGear size={15} className="shrink-0" />
                    {!collapsed && <span>Settings</span>}
                </Link>
            </div>

        </aside>
    );
}