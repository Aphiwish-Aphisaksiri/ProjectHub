// types.ts
/* This file contains TypeScript type definitions for the project. */

export type Project = {
    id: string;
    title: string;
    slug: string;
    description?: string;
    createdAt: string;
};

export enum ProjectVisibility {
    PRIVATE = "PRIVATE",
    PUBLIC = "PUBLIC",
}

export type Task = {
    id: string;
    title: string;
    body?: string;
    status: TaskStatus;
    priority: Priority;
    dueDate?: string;
    projectId: string;
};

export enum TaskStatus {
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    DONE = "DONE",
}

export enum Priority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
}