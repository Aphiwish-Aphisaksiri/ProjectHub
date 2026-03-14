// app/projects/[slug]/page.tsx

import { prisma } from "@/lib/prisma";
import Link from "next/link";


export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params  // ← await params first
    const project = await prisma.project.findUnique({
        where: { slug }
    })
    return (
        <div className="bg-primary text-offwhite flex flex-col items-start justify-start h-full max-h-full p-12">
            <div className="topBar flex flex-row items-center justify-between w-full mb-8">
                <div className="projectInfo flex flex-col items-start justify-start gap-2">
                    <h1 className="text-4xl font-bold">{project?.title}</h1>
                    <p className="text-xl font-semibold">{project?.description}</p>
                </div>
                <div className="projectActions flex flex-row items-center justify-start gap-4 w-75">
                    <Link
                        href={`/projects/${slug}/tasks/new`}
                        className="btn-createTask flex flex-row items-center justify-center gap-2.5 px-1.25 py-2 w-full h-full
                        text-offwhite text-[16px] font-bold
                        rounded-md bg-green hover:bg-green/50">
                        Create Task
                    </Link>
                    <Link
                        href={`/projects/${slug}/notes/new`}
                        className="btn-createNote flex flex-row items-center justify-center gap-2.5 px-1.25 py-2 w-full h-full
                        text-offwhite text-[16px] font-bold
                        rounded-md bg-green hover:bg-green/50">
                        Create Note
                    </Link>
                </div>
            </div>

            <div>WIP: This should be a table</div>
        </div>
    )
}