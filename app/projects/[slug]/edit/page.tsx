import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FiArrowLeft, FiEdit3, FiFolder } from "react-icons/fi";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectVisibility } from "@/types";
import ProjectEditorForm from "./components/ProjectEditorForm";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const user = await getCurrentUser();
    if (!user) redirect("/user/signin");

    const { slug } = await params;

    const project = await prisma.project.findFirst({
        where: { slug, ownerId: user.id },
        select: {
            id: true,
            title: true,
            description: true,
            slug: true,
            visibility: true,
        },
    });

    if (!project) notFound();

    return (
        <div className="min-h-full overflow-x-hidden bg-primary pb-20 text-offwhite selection:bg-tertiary/30">
            {/* Hero Banner */}
            <div className="relative overflow-hidden border-b border-white/5 bg-linear-to-br from-primary-800 via-secondary-900 to-primary-950">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-tertiary/10 blur-[100px] animate-pulse" />
                    <div
                        className="absolute bottom-[-20%] right-[-10%] h-[50%] w-[50%] rounded-full bg-secondary-500/10 blur-[100px] animate-pulse"
                        style={{ animationDelay: "2s" }}
                    />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
                </div>

                <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-end gap-6 px-6 pb-10 pt-6">
                    <Link
                        href={`/projects/${project.slug}`}
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-tertiary transition-all hover:gap-4"
                    >
                        <FiArrowLeft /> Back to Project
                    </Link>

                    <div className="flex items-start gap-4">
                        <span className="shrink-0 rounded-3xl border border-tertiary/30 bg-tertiary/20 p-3">
                            <FiEdit3 className="text-tertiary" size={36} />
                        </span>
                        <div>
                            <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                                Editing Project
                            </p>
                            <h1 className="text-4xl font-black tracking-tighter text-offwhite md:text-5xl">
                                {project.title}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="relative z-20 mx-auto mt-10 max-w-7xl px-6">
                <div className="mb-6 flex flex-wrap items-center gap-3 text-sm font-bold text-lightgrey">
                    <span className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-secondary/20 px-4 py-2 backdrop-blur-xl">
                        <FiFolder className="text-tertiary" />
                        {project.title}
                    </span>
                </div>

                <ProjectEditorForm
                    projectId={project.id}
                    initialTitle={project.title}
                    initialDescription={project.description ?? ""}
                    initialVisibility={project.visibility as ProjectVisibility}
                    cancelHref={`/projects/${project.slug}`}
                />
            </div>
        </div>
    );
}
