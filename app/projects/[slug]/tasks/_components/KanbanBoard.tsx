"use client";

import { useState, useCallback } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { TaskStatus } from "@/types";
import { updateTaskStatus } from "../action";
import KanbanColumn from "./KanbanColumn";
import TaskCard, { KanbanTask } from "./TaskCard";

const COLUMN_ORDER: TaskStatus[] = [
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.DONE,
    TaskStatus.ARCHIVED,
];

export default function KanbanBoard({
    initialTasks,
    showProject = false,
}: {
    initialTasks: KanbanTask[];
    showProject?: boolean;
}) {
    const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
    const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);

    // Use PointerSensor with a small distance threshold to prevent accidental drags on click
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const task = tasks.find((t) => t.id === event.active.id);
        setActiveTask(task ?? null);
    }, [tasks]);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        setActiveTask(null);
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id as string;
        const newStatus = over.id as TaskStatus;

        const task = tasks.find((t) => t.id === taskId);
        if (!task || task.status === newStatus) return;

        // Optimistic update
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );

        try {
            await updateTaskStatus(taskId, newStatus);
        } catch {
            // Rollback on failure
            setTasks((prev) =>
                prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
            );
        }
    }, [tasks]);

    const tasksByStatus = COLUMN_ORDER.reduce<Record<TaskStatus, KanbanTask[]>>(
        (acc, status) => {
            acc[status] = tasks.filter((t) => t.status === status);
            return acc;
        },
        {} as Record<TaskStatus, KanbanTask[]>
    );

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {COLUMN_ORDER.map((status) => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        tasks={tasksByStatus[status]}
                        showProject={showProject}
                    />
                ))}
            </div>

            {/* Drag overlay — renders the card under the cursor while dragging */}
            <DragOverlay dropAnimation={null}>
                {activeTask ? (
                    <div className="rotate-2 scale-105 opacity-95 pointer-events-none">
                        <TaskCard task={activeTask} showProject={showProject} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
