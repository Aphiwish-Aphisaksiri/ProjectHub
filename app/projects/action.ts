"use server";
import { prisma } from "@/lib/prisma";

export async function checkIfProjectTitleExists(title: string) {
    const project = await prisma.project.findFirst({
        where: { title: title }
    });
    return !!project;
}