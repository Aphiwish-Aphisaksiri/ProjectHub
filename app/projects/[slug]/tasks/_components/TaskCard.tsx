"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { FiCalendar, FiFolder, FiUser } from "react-icons/fi";
import { TaskStatus, Priority } from "@/types";
import Link from "next/link";
import Image from "next/image";

export interface KanbanTask {
    id: string;
    taskNumber: number;
    title: string;
    body: string | null;
    status: TaskStatus;
    priority: Priority;
    dueDate: Date | null;
    createdAt: Date;
    projectId: string;
    assignee?: { name: string; avatarUrl: string | null } | null;
    project?: { title: string; slug: string };
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
    [Priority.HIGH]: { label: "High", className: "bg-red/10 text-red border border-red/20" },
    [Priority.MEDIUM]: { label: "Medium", className: "bg-tertiary/10 text-tertiary border border-tertiary/20" },
    [Priority.LOW]: { label: "Low", className: "bg-lightgrey/10 text-lightgrey border border-lightgrey/20" },
};

function AssigneeAvatar({ assignee }: { assignee: { name: string; avatarUrl: string | null } }) {
    const initials = assignee.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    if (assignee.avatarUrl) {
        return (
            <Image
                src={assignee.avatarUrl}
                alt={assignee.name}
                width={22}
                height={22}
                className="rounded-full border border-white/10 object-cover"
                title={assignee.name}
            />
        );
    }

    return (
        <div
            title={assignee.name}
            className="w-6 h-6 rounded-full bg-tertiary/20 border border-tertiary/30 flex items-center justify-center text-[9px] font-black text-tertiary shrink-0"
        >
            {initials}
        </div>
    );
}

export default function TaskCard({
    task,
    showProject = false,
}: {
    task: KanbanTask;
    showProject?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({ id: task.id });

    const style = { transform: CSS.Translate.toString(transform) };

    const priority = priorityConfig[task.priority];
    const now = new Date();
    const isOverdue =
        task.dueDate &&
        new Date(task.dueDate) < now &&
        task.status !== TaskStatus.DONE &&
        task.status !== TaskStatus.ARCHIVED;

    // Task detail URL — always canonical /tasks/[id], with ?back= when inside a project board
    const taskHref =
        task.project?.slug && !showProject
            ? `/tasks/${task.id}?back=${encodeURIComponent(`/projects/${task.project.slug}/tasks`)}`
            : `/tasks/${task.id}`;

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
            {/* Top row: priority badge + task number */}
            <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${priority.className}`}>
                    {priority.label}
                </span>
                <span className="text-[14px] font-black text-lightgrey/30 tabular-nums mx-1">
                    #{task.taskNumber}
                </span>
            </div>

            {/* Title — clickable, stops drag event propagation */}
            <Link
                href={taskHref}
                onPointerDown={(e) => e.stopPropagation()}
                className={`block text-lg font-bold leading-snug mb-4 transition-colors hover:underline underline-offset-2 ${
                    task.status === TaskStatus.DONE || task.status === TaskStatus.ARCHIVED
                        ? "line-through text-lightgrey/50"
                        : "text-offwhite hover:text-tertiary"
                }`}
            >
                {task.title}
            </Link>

            {/* Footer: assignee left, meta right */}
            <div className="flex items-end justify-between gap-2">
                {/* Assignee */}
                <div className="flex items-center gap-1.5 min-w-0">
                    {task.assignee ? (
                        <>
                            <AssigneeAvatar assignee={task.assignee} />
                            <span className="text-[14px] font-bold text-lightgrey/50 truncate">
                                {task.assignee.name.split(" ")[0]}
                            </span>
                        </>
                    ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-lightgrey/20">
                            <FiUser size={10} />
                            Unassigned
                        </span>
                    )}
                </div>

                {/* Due date + project badge */}
                <div className="flex flex-row items-end gap-1.5 shrink-0">
                    {task.dueDate && (
                        <span className={`flex items-center gap-1 text-[12px] font-bold px-2 py-0.5 rounded-lg ${
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
                        <span className="flex items-center gap-1 text-[12px] font-bold px-2 py-0.5 rounded-lg bg-primary-950/50 text-lightgrey/60 border border-white/5 max-w-28 truncate">
                            <FiFolder size={10} className="shrink-0" />
                            <span className="truncate">{task.project.title}</span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
