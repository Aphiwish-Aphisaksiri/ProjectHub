"use client";

import { GoHome, GoGear } from "react-icons/go";
import { LuNotebookPen } from "react-icons/lu";
import { useEffect, useState } from "react";
import { Project } from "@/types";
import Link from "next/link";

//TODO: Make sidebar a component and make it collapsible for mobile view. Also, add functionality to the project list and settings button.

export default function Sidebar() {
    const [projectsList, setProjectsList] = useState<Project[]>([]);

    useEffect(() => {
        const fetchProjects = async () => {
            const res = await fetch("/api/projects");
            if (res.ok) {
                const data = await res.json();
                // Map to the expected list format
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
        <div className="Sidebar max-md:hidden flex flex-col w-50 h-full px-4 py-8 justify-between bg-secondary">

            {/* Top sidebar */}
            <div className="Project-list flex flex-col gap-2.5">
                {/* Main button */}
                <div className="btn-main flex flex-row items-center justify-left gap-2.5 px-1.25 text-offwhite text-[20px] font-bold">
                    <GoHome /> Main
                </div>

                <hr className="line-break border-offwhite border" />

                {/* Project list */}
                <div className="projects flex flex-col gap-2.5">
                    {/* TODO: This should be href link */}
                    {projectsList.map((project) => (
                        <Link key={project.slug} href={`/projects/${project.slug}`} className="project-item flex flex-row items-center justify-left gap-4 px-1.25 text-offwhite text-[16px]">
                            <LuNotebookPen /> {project.title}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Bottom sidebar */}
            <div className="bottom-sidebar flex flex-col gap-2.5">
                <hr className="line-break border-offwhite border" />
                <button className="btn-settings flex flex-row items-center justify-left gap-2.5 px-1.25 text-offwhite text-[18px] font-bold">
                    <GoGear /> Settings
                </button>
            </div>

        </div>
    );
}