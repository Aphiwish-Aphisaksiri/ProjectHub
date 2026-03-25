"use client";

import { GoGear } from "react-icons/go";
import { FiPlus, FiChevronLeft, FiChevronRight, FiMenu, FiX } from "react-icons/fi";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { Project } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCurrentUserName } from "@/components/action";

export interface AppSidebarProps {
    /**
     * Builds the href for each project entry in the list.
     * - Projects sidebar: (slug) => `/projects/${slug}`
     * - Notes sidebar:    (slug) => `/projects/${slug}/notes`
     * - Tasks sidebar:    (slug) => `/projects/${slug}/tasks`
     */
    projectLinkBuilder: (slug: string) => string;

    /** The top navigation item: "All Projects", "All Notes", "All Tasks", etc. */
    homeLink: { href: string; label: string; icon: ReactNode };

    /**
     * Optional bottom CTA button (e.g. "New Project").
     * Omit prop entirely to hide the button.
     */
    newItemLink?: { href: string; label: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// SidebarContent is the visual tree shared between the desktop <aside> and the
// mobile slide-in drawer. Keeping it as a separate component avoids duplicating
// markup and makes it easy to add new nav items in one place.
// ─────────────────────────────────────────────────────────────────────────────
function SidebarContent({
    collapsed,
    setCollapsed,
    onNavigate,
    userName,
    initials,
    projectsList,
    pathname,
    projectLinkBuilder,
    homeLink,
    newItemLink,
}: {
    collapsed: boolean;
    setCollapsed: (fn: (c: boolean) => boolean) => void;
    onNavigate?: () => void;
    userName: string | null;
    initials: string;
    projectsList: Project[];
    pathname: string;
    projectLinkBuilder: (slug: string) => string;
    homeLink: { href: string; label: string; icon: ReactNode };
    newItemLink?: { href: string; label: string };
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
                            <p className="text-offwhite text-sm font-black truncate leading-tight">{userName ?? "Loading…"}</p>
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

                {/* Home link — "All Projects" / "All Notes" / "All Tasks" */}
                <Link
                    href={homeLink.href}
                    title={homeLink.label}
                    onClick={onNavigate}
                    className={`flex items-center gap-2.5 py-2.5 rounded-xl text-sm font-bold transition-all ${collapsed ? "justify-center px-2" : "px-2"} ${
                        pathname === homeLink.href
                            ? "border-l-2 border-tertiary bg-tertiary/10 text-tertiary"
                            : "border-l-2 border-transparent text-offwhite hover:bg-white/5"
                    }`}
                >
                    {homeLink.icon}
                    {!collapsed && <span>{homeLink.label}</span>}
                </Link>

                <div className="border-t border-white/10 my-2" />

                {!collapsed && (
                    <p className="text-xs text-lightgrey/40 font-bold uppercase tracking-widest px-2 mb-1">Projects</p>
                )}

                {/* Project list — each link destination is controlled by projectLinkBuilder */}
                <div className="flex flex-col gap-0.5">
                    {projectsList.map((project) => {
                        const targetLink = projectLinkBuilder(project.slug);
                        // isActive must use the exact built link so that notes/tasks
                        // active state doesn't bleed across routes.
                        const isActive = pathname === targetLink || pathname.startsWith(targetLink + "/");
                        return (
                            <Link
                                key={project.slug}
                                href={targetLink}
                                title={project.title}
                                onClick={onNavigate}
                                className={`flex items-center gap-2.5 py-2 rounded-xl text-sm transition-all ${collapsed ? "justify-center px-2" : "px-2"} ${
                                    isActive
                                        ? "border-l-2 border-tertiary bg-tertiary/10 text-tertiary font-black"
                                        : "border-l-2 border-transparent text-lightgrey hover:bg-white/5 hover:text-offwhite"
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${isActive ? "bg-tertiary" : "bg-tertiary/30"}`} />
                                {!collapsed && <span className="truncate">{project.title}</span>}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* ── Bottom section ── */}
            <div className="flex flex-col gap-1">
                {newItemLink && (
                    <Link
                        href={newItemLink.href}
                        title={newItemLink.label}
                        onClick={onNavigate}
                        className={`flex items-center gap-2 py-2.5 bg-tertiary/10 hover:bg-tertiary/20 border border-tertiary/20 text-tertiary rounded-xl text-sm font-bold transition-all mb-2 ${
                            collapsed ? "justify-center px-2" : "justify-center px-3"
                        }`}
                    >
                        <FiPlus size={14} className="shrink-0" />
                        {!collapsed && <span>{newItemLink.label}</span>}
                    </Link>
                )}
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

// ─────────────────────────────────────────────────────────────────────────────
// AppSidebar — generic sidebar used by projects, notes, and tasks layouts.
//
// Collapse state is intentionally stored under a single shared localStorage key
// ("sidebar-collapsed") so the preference is consistent across all routes.
// The user collapses once — it stays collapsed everywhere.
// ─────────────────────────────────────────────────────────────────────────────
export default function AppSidebar({ projectLinkBuilder, homeLink, newItemLink }: AppSidebarProps) {
    const [projectsList, setProjectsList] = useState<Project[]>([]);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const pathname = usePathname();

    // useSyncExternalStore is the correct React API for reading external stores
    // across SSR and hydration. The server snapshot always returns false (sidebar
    // starts expanded), while the client snapshot reads the persisted preference
    // from localStorage — eliminating the hydration mismatch entirely.
    const collapsed = useSyncExternalStore(
        (onStoreChange) => {
            // Wire up a custom event so any tab that writes the key will
            // cause all subscribed components to re-read and re-render.
            window.addEventListener("sidebar-collapsed-change", onStoreChange);
            return () => window.removeEventListener("sidebar-collapsed-change", onStoreChange);
        },
        () => localStorage.getItem("sidebar-collapsed") === "true", // client snapshot
        () => false,                                                 // server snapshot
    );

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

    // Write to localStorage and dispatch an event so useSyncExternalStore
    // re-reads the new value and triggers a re-render.
    const handleSetCollapsed = (fn: (c: boolean) => boolean) => {
        const next = fn(collapsed);
        localStorage.setItem("sidebar-collapsed", String(next));
        window.dispatchEvent(new Event("sidebar-collapsed-change"));
    };

    const sharedProps = {
        collapsed,
        setCollapsed: handleSetCollapsed,
        userName,
        initials,
        projectsList,
        pathname,
        projectLinkBuilder,
        homeLink,
        newItemLink,
    };

    return (
        <>
            {/* ── Desktop sidebar ── */}
            <aside className={`hidden md:flex flex-col h-full py-4 justify-between bg-white/3 backdrop-blur-xl border-r border-white/10 shrink-0 transition-all duration-300 overflow-hidden ${
                collapsed ? "w-14 px-2" : "w-56 px-3"
            }`}>
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
            <div className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 px-4 py-6 flex flex-col bg-primary/95 backdrop-blur-xl border-r border-white/10 shadow-2xl shadow-black/40 transition-transform duration-300 ${
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}>
                <div className="flex justify-end mb-2">
                    <button
                        onClick={() => setMobileOpen(false)}
                        title="Close menu"
                        className="p-1.5 rounded-lg text-lightgrey/60 hover:text-offwhite hover:bg-white/5 transition-all"
                    >
                        <FiX size={18} />
                    </button>
                </div>
                <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                    {/* Mobile drawer always shows expanded layout (collapsed=false) */}
                    <SidebarContent {...sharedProps} collapsed={false} onNavigate={() => setMobileOpen(false)} />
                </div>
            </div>
        </>
    );
}
