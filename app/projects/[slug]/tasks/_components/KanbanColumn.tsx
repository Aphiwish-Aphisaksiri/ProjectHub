"use client";

import { useDroppable } from "@dnd-kit/core";
import { TaskStatus } from "@/types";
import TaskCard, { KanbanTask } from "./TaskCard";
import { FiCheckCircle, FiCircle, FiClock, FiArchive } from "react-icons/fi";

const columnConfig: Record<
    TaskStatus,
    { label: string; icon: React.ReactNode; accent: string; headerBg: string }
> = {
    [TaskStatus.TODO]: {
        label: "To Do",
        icon: <FiCircle size={14} />,
        accent: "border-t-lightgrey/40",
        headerBg: "bg-lightgrey/5",
    },
    [TaskStatus.IN_PROGRESS]: {
        label: "In Progress",
        icon: <FiClock size={14} />,
        accent: "border-t-tertiary",
        headerBg: "bg-tertiary/5",
    },
    [TaskStatus.DONE]: {
        label: "Done",
        icon: <FiCheckCircle size={14} />,
        accent: "border-t-green",
        headerBg: "bg-green/5",
    },
    [TaskStatus.ARCHIVED]: {
        label: "Archived",
        icon: <FiArchive size={14} />,
        accent: "border-t-lightgrey/20",
        headerBg: "bg-lightgrey/3",
    },
};

export default function KanbanColumn({
    status,
    tasks,
    showProject,
}: {
    status: TaskStatus;
    tasks: KanbanTask[];
    showProject?: boolean;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: status });
    const config = columnConfig[status];

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col min-h-125 rounded-3xl border transition-all duration-200
                border-t-2 ${config.accent}
                ${isOver
                    ? "border-tertiary/30 bg-secondary/30 shadow-lg shadow-tertiary/5"
                    : "border-white/5 bg-secondary/10"
                }`}
        >
            {/* Column header */}
            <div className={`flex items-center justify-between px-4 py-3 rounded-t-3xl border-b border-white/5 ${config.headerBg}`}>
                <div className="flex items-center gap-2 text-offwhite font-black text-sm">
                    <span className="text-lightgrey/60">{config.icon}</span>
                    {config.label}
                </div>
                <span className="text-xs font-black text-lightgrey/40 bg-primary-950/50 px-2 py-0.5 rounded-full border border-white/5">
                    {tasks.length}
                </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3 p-3 flex-1">
                {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} showProject={showProject} />
                ))}

                {tasks.length === 0 && (
                    <div className={`flex-1 flex items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${
                        isOver ? "border-tertiary/40 bg-tertiary/5" : "border-white/5"
                    }`}>
                        <p className="text-[11px] font-bold text-lightgrey/30 uppercase tracking-widest">
                            Drop here
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
