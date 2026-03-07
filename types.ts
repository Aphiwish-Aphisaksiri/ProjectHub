// types.ts
/* This file contains TypeScript type definitions for the project. */

export type Project = {
    id: string;
    title: string;
    description?: string;
    createdAt: string;
};

export enum ProjectVisibility {
    PRIVATE = "PRIVATE",
    PUBLIC = "PUBLIC",
}
