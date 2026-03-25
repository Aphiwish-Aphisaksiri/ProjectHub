import Link from "next/link";
import { redirect } from "next/navigation";
import { FiCheckSquare, FiPlus } from "react-icons/fi";
import { getCurrentUser } from "@/lib/auth";
import { getAllUserTasks } from "./action";
import KanbanBoard from "@/app/projects/[slug]/tasks/_components/KanbanBoard";
import { KanbanTask } from "@/app/projects/[slug]/tasks/_components/TaskCard";
import { TaskStatus, Priority } from "@/types";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/user/signin");

    const rawTasks = await getAllUserTasks();
    const tasks: KanbanTask[] = rawTasks.map((t) => ({
        ...t,
        status: t.status as TaskStatus,
        priority: t.priority as Priority,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        assignee: t.assignee ?? undefined,
        project: t.project ?? undefined,
    }));

    return (
        <div className="min-h-full overflow-x-hidden bg-primary pb-20 text-offwhite selection:bg-tertiary/30">
            {/* Hero Banner */}
            <div className="relative min-h-50 overflow-hidden border-b border-white/5 bg-linear-to-br from-primary-800 via-secondary-900 to-primary-950">
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
                            <div className="flex flex-col items-start">
                                <div className="flex flex-row items-center gap-4 text-6xl font-black tracking-tighter text-offwhite">
                                  <span className="rounded-3xl border border-tertiary/30 bg-tertiary/20 p-3">
                                      <FiCheckSquare className="text-tertiary" size={38} />
                                  </span>
                                    <h1 className="text-4xl font-black tracking-tighter text-offwhite md:text-6xl">
                                        Tasks
                                    </h1>
                                </div>
                                <p className="mt-4 text-lightgrey text-lg font-medium">
                                    Every next step for every project, unified in one place
                                </p>
                                <p className="mt-2 text-lightgrey font-medium">
                                    {tasks.length} task{tasks.length !== 1 ? "s" : ""} across all projects, ready to start?
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-3 self-end rounded-2xl bg-secondary/20 backdrop-blur-xl border border-white/5 px-6 py-4 text-sm font-black text-offwhite shadow-xl transition-all hover:scale-[1.02] hover:border-tertiary/20 active:scale-[0.98]"
                        >
                            <FiPlus />
                            New Task (via Project)
                        </Link>
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="relative z-20 mx-auto mt-10 max-w-7xl px-6">
                {tasks.length > 0 ? (
                    <KanbanBoard initialTasks={tasks} showProject />
                ) : (
                    <div className="py-20 text-center">
                        <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                            <FiCheckSquare size={40} className="text-lightgrey/20" />
                        </div>
                        <h3 className="text-2xl font-black text-offwhite mb-2">No tasks yet</h3>
                        <p className="text-lightgrey font-medium mb-6">
                            Create tasks inside a project to see them here.
                        </p>
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-2 rounded-2xl bg-tertiary px-6 py-3 text-sm font-black text-offblack shadow-xl shadow-tertiary/20 transition-all hover:scale-[1.02]"
                        >
                            Go to Projects
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}