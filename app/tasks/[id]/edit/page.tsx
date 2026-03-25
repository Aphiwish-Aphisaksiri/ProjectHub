import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FiArrowLeft, FiEdit3, FiFolder } from "react-icons/fi";
import { getCurrentUser } from "@/lib/auth";
import { getTaskById } from "@/lib/tasks";
import TaskEditorForm from "./components/TaskEditorForm";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ back?: string }>;
}) {
    const user = await getCurrentUser();
    if (!user) redirect("/user/signin");

    const { id } = await params;
    const { back } = await searchParams;
    const task = await getTaskById(id);

    if (!task) notFound();

    // The cancel / post-save destination is the detail page, preserving the back param
    const detailHref = `/tasks/${task.id}${back ? `?back=${encodeURIComponent(back)}` : ""}`;

    // Format dueDate as YYYY-MM-DD for the date input
    const initialDueDate = task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "";

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
                        href={detailHref}
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-tertiary transition-all hover:gap-4"
                    >
                        <FiArrowLeft /> Back to Task
                    </Link>

                    <div className="flex items-start gap-4">
                        <span className="shrink-0 rounded-3xl border border-tertiary/30 bg-tertiary/20 p-3">
                            <FiEdit3 className="text-tertiary" size={36} />
                        </span>
                        <div>
                            <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                                Editing Task
                            </p>
                            <h1 className="text-4xl font-black tracking-tighter text-offwhite md:text-5xl">
                                {task.title}
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
                        {task.project.title}
                    </span>
                </div>

                <TaskEditorForm
                    taskId={task.id}
                    initialTitle={task.title}
                    initialBody={task.body ?? ""}
                    initialStatus={task.status}
                    initialPriority={task.priority}
                    initialDueDate={initialDueDate}
                    cancelHref={detailHref}
                />
            </div>
        </div>
    );
}
