"use client";

import AppSidebar from "@/components/AppSidebar";
import { FiCheckSquare } from "react-icons/fi";

// Thin wrapper — all sidebar logic lives in the shared AppSidebar component.
// Only the route-specific configuration is defined here.
export default function Sidebar() {
    return (
        <AppSidebar
            projectLinkBuilder={(slug) => `/projects/${slug}/tasks`}
            homeLink={{ href: "/tasks", label: "All Tasks", icon: <FiCheckSquare size={15} className="shrink-0" /> }}
            newItemLink={{ href: "/projects/new", label: "New Project" }}
        />
    );
}
