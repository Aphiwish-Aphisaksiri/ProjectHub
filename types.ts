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