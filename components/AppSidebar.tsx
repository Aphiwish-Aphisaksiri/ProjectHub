"use client";

import { GoGear } from "react-icons/go";
import { FiPlus, FiChevronLeft, FiChevronRight, FiChevronDown, FiMenu, FiX } from "react-icons/fi";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { Project } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCurrentUserName } from "@/components/action";

export interface AppSidebarProps {
    /**
     * Builds the href for each project entry in the list.
     * @deprecated Each project now exposes Overview / Tasks / Notes sub-links via an
     *             accordion, so this builder is no longer used for project list items.
     *             Kept for backward compatibility with existing callers.
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

/** Sub-pages shown under each project in the accordion. */
const PROJECT_SUB_PAGES = [
    { key: "overview" as const, label: "Overview" },
    { key: "tasks"    as const, label: "Tasks"    },
    { key: "notes"    as const, label: "Notes"    },
] as const;

/**
 * Parse a JSON array stored in localStorage, returning an empty array on any
 * error so callers don't need scattered try/catch blocks.
 */
function parseStoredArray(key: string): string[] {
    try {
        const raw = localStorage.getItem(key);
        const parsed = JSON.parse(raw ?? "[]");
        return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
        return [];
    }
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
    homeLink,
    newItemLink,
    expanded,
    toggleExpanded,
}: {
    collapsed: boolean;
    setCollapsed: (fn: (c: boolean) => boolean) => void;
    onNavigate?: () => void;
    userName: string | null;
    initials: string;
    projectsList: Project[];
    pathname: string;
    homeLink: { href: string; label: string; icon: ReactNode };
    newItemLink?: { href: string; label: string };
    /** Set of project slugs whose accordion is currently open. */
    expanded: Set<string>;
    toggleExpanded: (slug: string) => void;
}) {
    return (
        <>
            {/* ── Top section (flex-1 so the project list can scroll independently) ── */}
            <div className="flex flex-col flex-1 min-h-0 gap-1">
                {/* Workspace header */}
                <div className={`flex items-center mb-3 min-w-0 shrink-0 ${collapsed ? "flex-col gap-2" : "gap-2.5 px-1"}`}>
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

                <div className="border-t border-white/10 mb-2 shrink-0" />

                {/* Home link — "All Projects" / "All Notes" / "All Tasks" */}
                <Link
                    href={homeLink.href}
                    title={homeLink.label}
                    onClick={onNavigate}
                    className={`flex items-center gap-2.5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${collapsed ? "justify-center px-2" : "px-2"} ${
                        pathname === homeLink.href
                            ? "border-l-2 border-tertiary bg-tertiary/10 text-tertiary"
                            : "border-l-2 border-transparent text-offwhite hover:bg-white/5"
                    }`}
                >
                    {homeLink.icon}
                    {!collapsed && <span>{homeLink.label}</span>}
                </Link>

                <div className="border-t border-white/10 my-2 shrink-0" />

                {!collapsed && (
                    <p className="text-xs text-lightgrey/40 font-bold uppercase tracking-widest px-2 mb-1 shrink-0">Projects</p>
                )}

                {/* Project list — accordion, scrolls independently when list overflows */}
                <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 min-h-0">
                    {projectsList.map((project) => {
                        const overviewHref = `/projects/${project.slug}`;
                        const tasksHref = `/projects/${project.slug}/tasks`;
                        const notesHref = `/projects/${project.slug}/notes`;
                        const isProjectActive =
                            pathname === overviewHref ||
                            pathname.startsWith(`/projects/${project.slug}/`);
                        const isExpanded = expanded.has(project.slug);

                        if (collapsed) {
                            // Collapsed mode — show only the dot icon; navigate to overview
                            return (
                                <Link
                                    key={project.slug}
                                    href={overviewHref}
                                    title={project.title}
                                    onClick={onNavigate}
                                    className={`flex items-center justify-center px-2 py-2 rounded-xl text-sm transition-all ${
                                        isProjectActive
                                            ? "border-l-2 border-tertiary bg-tertiary/10 text-tertiary font-black"
                                            : "border-l-2 border-transparent text-lightgrey hover:bg-white/5 hover:text-offwhite"
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${isProjectActive ? "bg-tertiary" : "bg-tertiary/30"}`} />
                                </Link>
                            );
                        }

                        return (
                            <div key={project.slug}>
                                {/* Accordion toggle button */}
                                <button
                                    onClick={() => toggleExpanded(project.slug)}
                                    title={project.title}
                                    className={`w-full flex items-center gap-2.5 py-2 px-2 rounded-xl text-sm transition-all ${
                                        isProjectActive
                                            ? "border-l-2 border-tertiary bg-tertiary/10 text-tertiary font-black"
                                            : "border-l-2 border-transparent text-lightgrey hover:bg-white/5 hover:text-offwhite"
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${isProjectActive ? "bg-tertiary" : "bg-tertiary/30"}`} />
                                    <span className="truncate flex-1 text-left">{project.title}</span>
                                    <FiChevronDown
                                        size={12}
                                        className={`shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                    />
                                </button>

                                {/* Sub-navigation — smooth height transition via max-h.
                                    max-h-40 (10 rem) comfortably fits 3 fixed items.
                                    Animating height: auto is not CSS-transition-able;
                                    a bounded max-h is the standard workaround. */}
                                <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? "max-h-40" : "max-h-0"}`}>
                                    <div className="flex flex-col gap-0.5 pl-5 pb-1 pt-0.5">
                                        {PROJECT_SUB_PAGES.map(({ key, label }) => {
                                            const href =
                                                key === "overview"
                                                    ? overviewHref
                                                    : key === "tasks"
                                                    ? tasksHref
                                                    : notesHref;
                                            const isSubActive =
                                                key === "overview"
                                                    ? pathname === href
                                                    : pathname.startsWith(href);
                                            return (
                                                <Link
                                                    key={key}
                                                    href={href}
                                                    onClick={onNavigate}
                                                    className={`py-1.5 px-2 rounded-lg text-xs transition-all ${
                                                        isSubActive
                                                            ? "text-tertiary font-bold bg-tertiary/5"
                                                            : "text-lightgrey/70 hover:text-offwhite hover:bg-white/5"
                                                    }`}
                                                >
                                                    {label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Bottom section ── */}
            <div className="flex flex-col gap-1 shrink-0">
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
//
// Accordion expanded state is stored under "sidebar-expanded" (a JSON array of
// slugs) so the open/closed state of each project survives page navigation.
// ─────────────────────────────────────────────────────────────────────────────
export default function AppSidebar({ homeLink, newItemLink }: AppSidebarProps) {
    const [projectsList, setProjectsList] = useState<Project[]>([]);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const pathname = usePathname();

    // Extract the active project slug from the current URL.
    // e.g. '/projects/fitflow/tasks' → 'fitflow'
    const activeSlug = pathname.startsWith("/projects/") ? (pathname.split("/")[2] ?? "") : "";

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

    // Read the set of expanded project slugs from localStorage.
    // Server snapshot is '[]' (all collapsed) to avoid hydration mismatches.
    const expandedJson = useSyncExternalStore(
        (onStoreChange) => {
            window.addEventListener("sidebar-expanded-change", onStoreChange);
            return () => window.removeEventListener("sidebar-expanded-change", onStoreChange);
        },
        () => localStorage.getItem("sidebar-expanded") ?? "[]", // client snapshot
        () => "[]",                                              // server snapshot
    );

    // Derive a Set from the JSON string so components can do O(1) lookups.
    const expandedArray: string[] = (() => {
        try { return JSON.parse(expandedJson) as string[]; } catch { return []; }
    })();
    const expanded = new Set<string>(expandedArray);

    // Auto-expand the active project whenever the URL changes.
    useEffect(() => {
        if (!activeSlug) return;
        const current = parseStoredArray("sidebar-expanded");
        if (current.includes(activeSlug)) return;
        localStorage.setItem("sidebar-expanded", JSON.stringify([...current, activeSlug]));
        window.dispatchEvent(new Event("sidebar-expanded-change"));
    }, [activeSlug]);

    // Toggle a project's accordion open/closed and persist the change.
    const toggleExpanded = (slug: string) => {
        const current = parseStoredArray("sidebar-expanded");
        const updated = current.includes(slug)
            ? current.filter((s) => s !== slug)
            : [...current, slug];
        localStorage.setItem("sidebar-expanded", JSON.stringify(updated));
        window.dispatchEvent(new Event("sidebar-expanded-change"));
    };

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
        homeLink,
        newItemLink,
        expanded,
        toggleExpanded,
    };

    return (
        <>
            {/* ── Desktop sidebar ── */}
            <aside className={`hidden md:flex flex-col h-full py-4 bg-white/3 backdrop-blur-xl border-r border-white/10 shrink-0 transition-all duration-300 overflow-hidden ${
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
