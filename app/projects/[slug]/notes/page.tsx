import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FiArrowLeft, FiFileText, FiPlus } from "react-icons/fi";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectNotes } from "./action";
import ProjectNotesGrid from "./components/ProjectNotesGrid";

export const dynamic = "force-dynamic";

export default async function ProjectNotesPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const user = await getCurrentUser();
    if (!user) redirect("/user/signin");

    const { slug } = await params;

    const project = await prisma.project.findUnique({
        where: { slug },
        select: { title: true, ownerId: true },
    });

    if (!project || project.ownerId !== user.id) notFound();

    const notes = await getProjectNotes(slug);

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

                <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-end gap-8 px-6 pb-10 pt-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-4xl">
                            <Link
                                href={`/projects/${slug}`}
                                className="mb-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-tertiary transition-all hover:gap-4"
                            >
                                <FiArrowLeft /> Back to {project.title}
                            </Link>

                            <div className="flex items-start gap-4">
                                <span className="rounded-3xl border border-tertiary/30 bg-tertiary/20 p-3">
                                    <FiFileText className="text-tertiary" size={38} />
                                </span>
                                <div>
                                    <h1 className="text-4xl font-black tracking-tighter text-offwhite md:text-6xl">
                                        Notes
                                    </h1>
                                    <p className="mt-2 text-lightgrey font-medium">
                                        {notes.length} note{notes.length !== 1 ? "s" : ""} in this project
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Link
                            href={`/projects/${slug}/notes/new`}
                            className="inline-flex items-center gap-3 self-end rounded-2xl bg-tertiary px-6 py-4 text-sm font-black text-offblack shadow-xl shadow-tertiary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <FiPlus />
                            Create Note
                        </Link>
                    </div>
                </div>
            </div>

            {/* Notes Grid */}
            <div className="relative z-20 mx-auto mt-10 max-w-7xl px-6">
                <ProjectNotesGrid notes={notes} slug={slug} />
            </div>
        </div>
    );
}