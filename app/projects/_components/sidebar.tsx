"use client";

import { GoHome, GoGear } from "react-icons/go";
import { FiPlus, FiChevronLeft, FiChevronRight, FiMenu, FiX } from "react-icons/fi";
import { useEffect, useState } from "react";
import { Project } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCurrentUserName } from "@/components/action";

// Shared inner content — rendered both in the desktop aside and the mobile drawer
function SidebarContent({
    collapsed,
    setCollapsed,
    onNavigate,
    userName,
    initials,
    projectsList,
    pathname,
}: {
    collapsed: boolean;
    setCollapsed: (fn: (c: boolean) => boolean) => void;
    onNavigate?: () => void;
    userName: string | null;
    initials: string;
    projectsList: Project[];
    pathname: string;
}) {
    return (
        <>
            {/* ── Top section ── */}
            <div className="flex flex-col gap-1">

                {/* Workspace header */}
                <div className={`flex items-center mb-3 min-w-0 ${collapsed ? "flex-col gap-2" : "gap-2.5 px-1"}`}>
                    <div className="w-8 h-8 rounded-xl bg-tertiary/20 border border-tertiary/30 flex items-center justify-center text-tertiary text-xs font-black shrink-0">
                        {initials}
                    </div>

                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-offwhite text-sm font-black truncate leading-tight">
                                {userName ?? "Loading…"}
                            </p>
                            <p className="text-lightgrey/40 text-xs leading-tight">Workspace</p>
                        </div>
                    )}

                    {/* Collapse toggle — desktop only */}
                    <button
                        onClick={() => setCollapsed((c) => !c)}
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className="p-1 rounded-lg text-lightgrey/40 hover:text-offwhite hover:bg-white/5 transition-all shrink-0 hidden md:flex"
                    >
                        {collapsed ? <FiChevronRight size={13} /> : <FiChevronLeft size={13} />}
                    </button>
                </div>

                <div className="border-t border-white/10 mb-2" />

                {/* All Projects */}
                <Link
                    href="/projects"
                    title="All Projects"
                    onClick={onNavigate}
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

                {!collapsed && (
                    <p className="text-xs text-lightgrey/40 font-bold uppercase tracking-widest px-2 mb-1">
                        Projects
                    </p>
                )}

                {/* Project list */}
                <div className="flex flex-col gap-0.5">
                    {projectsList.map((project) => {
                        const isActive =
                            pathname === `/projects/${project.slug}` ||
                            pathname.startsWith(`/projects/${project.slug}/`);
                        return (
                            <Link
                                key={project.slug}
                                href={`/projects/${project.slug}`}
                                title={project.title}
                                onClick={onNavigate}
                                className={`flex items-center gap-2.5 py-2 rounded-xl text-sm transition-all ${
                                    collapsed ? "justify-center px-2" : "px-2"
                                } ${
                                    isActive
                                        ? "border-l-2 border-tertiary bg-tertiary/10 text-tertiary font-black"
                                        : "border-l-2 border-transparent text-lightgrey hover:bg-white/5 hover:text-offwhite"
                                }`}
                            >
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
                <Link
                    href="/projects/new"
                    title="New Project"
                    onClick={onNavigate}
                    className={`flex items-center gap-2 py-2.5 bg-tertiary/10 hover:bg-tertiary/20 border border-tertiary/20 text-tertiary rounded-xl text-sm font-bold transition-all mb-2 ${
                        collapsed ? "justify-center px-2" : "justify-center px-3"
                    }`}
                >
                    <FiPlus size={14} className="shrink-0" />
                    {!collapsed && <span>New Project</span>}
                </Link>

                <div className="border-t border-white/10 my-1" />

                <Link
                    href="/settings"
                    title="Settings"
                    onClick={onNavigate}
                    className={`flex items-center gap-2.5 py-2.5 rounded-xl text-sm font-bold text-lightgrey hover:bg-white/5 hover:text-offwhite transition-all border-l-2 border-transparent ${
                        collapsed ? "justify-center px-2" : "px-2"
                    }`}
                >
                    <GoGear size={15} className="shrink-0" />
                    {!collapsed && <span>Settings</span>}
                </Link>
            </div>
        </>
    );
}

export default function Sidebar() {
    const [projectsList, setProjectsList] = useState<Project[]>([]);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
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

    const sharedProps = { collapsed, setCollapsed, userName, initials, projectsList, pathname };

    return (
        <>
            {/* ── Desktop sidebar ── */}
            <aside
                className={`hidden md:flex flex-col h-full py-4 justify-between bg-white/3 backdrop-blur-xl border-r border-white/10 shrink-0 transition-all duration-300 overflow-hidden ${
                    collapsed ? "w-14 px-2" : "w-56 px-3"
                }`}
            >
                <SidebarContent {...sharedProps} />
            </aside>

            {/* ── Mobile: fixed hamburger button ── */}
            <button
                onClick={() => setMobileOpen(true)}
                title="Open menu"
                className="md:hidden fixed bottom-6 left-4 z-50 w-12 h-12 bg-secondary/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-offwhite shadow-xl shadow-black/30 hover:bg-secondary transition-all active:scale-95"
            >
                <FiMenu size={20} />
            </button>

            {/* ── Mobile: backdrop ── */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ── Mobile: slide-in drawer ── */}
            <div
                className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 px-4 py-6 flex flex-col bg-primary/95 backdrop-blur-xl border-r border-white/10 shadow-2xl shadow-black/40 transition-transform duration-300 ${
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Close button */}
                <div className="flex justify-end mb-2">
                    <button
                        onClick={() => setMobileOpen(false)}
                        title="Close menu"
                        className="p-1.5 rounded-lg text-lightgrey/60 hover:text-offwhite hover:bg-white/5 transition-all"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Reuse the same content, always expanded in drawer */}
                <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                    <SidebarContent
                        {...sharedProps}
                        collapsed={false}
                        onNavigate={() => setMobileOpen(false)}
                    />
                </div>
            </div>
        </>
    );
}