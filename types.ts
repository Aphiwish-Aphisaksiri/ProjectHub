// types.ts
/* This file contains TypeScript type definitions for the project. */

export type Project = {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    visibility: ProjectVisibility;
    addReadMe: boolean;
    ownerId: string | null;
};

export enum ProjectVisibility {
    PRIVATE = "PRIVATE",
    PUBLIC = "PUBLIC",
}

export type Task = {
    id: string;
    title: string;
    body: string | null;
    status: TaskStatus;
    priority: Priority;
    dueDate: Date | null;
    projectId: string;
    createdAt: Date;
    updatedAt: Date;
};

export enum TaskStatus {
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    DONE = "DONE",
    ARCHIVED = "ARCHIVED",
}

export enum Priority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
}

/**
 * The shape returned by getProjectTasks / getAllUserTasks.
 * Uses string for status/priority to decouple from Prisma's $Enums
 * (local Prisma client may lag behind the running Docker container after migrations).
 * Cast to TaskStatus/Priority at the callsite.
 */
export type TaskRaw = {
    id: string;
    taskNumber: number;
    title: string;
    body: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    projectId: string;
    assignee: { name: string; avatarUrl: string | null } | null;
    project?: { title: string; slug: string } | null;
};