"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { FiCalendar, FiFolder } from "react-icons/fi";
import { TaskStatus, Priority } from "@/types";

export interface KanbanTask {
    id: string;
    title: string;
    body: string | null;
    status: TaskStatus;
    priority: Priority;
    dueDate: Date | null;
    createdAt: Date;
    projectId: string;
    project?: { title: string; slug: string };
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
    [Priority.HIGH]: { label: "High", className: "bg-red/10 text-red border border-red/20" },
    [Priority.MEDIUM]: { label: "Medium", className: "bg-tertiary/10 text-tertiary border border-tertiary/20" },
    [Priority.LOW]: { label: "Low", className: "bg-lightgrey/10 text-lightgrey border border-lightgrey/20" },
};

export default function TaskCard({
    task,
    showProject = false,
}: {
    task: KanbanTask;
    showProject?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({ id: task.id });

    const style = {
        transform: CSS.Translate.toString(transform),
    };

    const priority = priorityConfig[task.priority];
    const now = new Date();
    const isOverdue =
        task.dueDate &&
        new Date(task.dueDate) < now &&
        task.status !== TaskStatus.DONE &&
        task.status !== TaskStatus.ARCHIVED;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`group relative bg-secondary/20 backdrop-blur-xl border rounded-2xl p-4 cursor-grab active:cursor-grabbing transition-all duration-200 select-none
                ${isDragging
                    ? "opacity-50 rotate-2 scale-105 shadow-2xl shadow-tertiary/20 border-tertiary/30"
                    : "border-white/5 hover:border-tertiary/20 hover:bg-secondary/40 hover:shadow-xl hover:shadow-tertiary/5"
                }`}
        >
            {/* Priority badge */}
            <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${priority.className}`}>
                    {priority.label}
                </span>
            </div>

            {/* Title */}
            <h3 className={`text-sm font-bold leading-snug mb-3 transition-colors ${
                task.status === TaskStatus.DONE || task.status === TaskStatus.ARCHIVED
                    ? "line-through text-lightgrey/50"
                    : "text-offwhite group-hover:text-tertiary"
            }`}>
                {task.title}
            </h3>

            {/* Footer meta */}
            <div className="flex flex-wrap gap-2 mt-auto">
                {task.dueDate && (
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${
                        isOverdue
                            ? "bg-red/10 text-red border border-red/20"
                            : "bg-primary-950/50 text-lightgrey/60 border border-white/5"
                    }`}>
                        <FiCalendar size={10} />
                        {new Date(task.dueDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                        })}
                    </span>
                )}
                {showProject && task.project && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-primary-950/50 text-lightgrey/60 border border-white/5 truncate max-w-30">
                        <FiFolder size={10} />
                        {task.project.title}
                    </span>
                )}
            </div>
        </div>
    );
}
