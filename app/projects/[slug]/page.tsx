// app/projects/[slug]/page.tsx

import { prisma } from "@/lib/prisma";


export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params  // ← await params first
    const project = await prisma.project.findUnique({
        where: { slug }
    })
    return (
        <div>
            <h1>{project?.title}</h1>
            <p>{project?.description}</p>
        </div>
    )
}