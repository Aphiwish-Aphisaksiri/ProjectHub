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
}

export enum Priority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
}