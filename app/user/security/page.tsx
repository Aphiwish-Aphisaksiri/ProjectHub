import { redirect } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiShield } from "react-icons/fi";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SecurityForm from "./components/SecurityForm";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/user/signin");

    const profile = await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, email: true },
    });

    if (!profile) redirect("/user/signin");

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
                        href="/user"
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-tertiary transition-all hover:gap-4"
                    >
                        <FiArrowLeft /> Back to Profile
                    </Link>

                    <div className="flex items-start gap-4">
                        <span className="shrink-0 rounded-3xl border border-tertiary/30 bg-tertiary/20 p-3">
                            <FiShield className="text-tertiary" size={36} />
                        </span>
                        <div>
                            <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">
                                Security & Access
                            </p>
                            <h1 className="text-4xl font-black tracking-tighter text-offwhite md:text-5xl">
                                {profile.name}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="relative z-20 mx-auto mt-10 max-w-7xl px-6">
                <div className="mb-6 flex flex-wrap items-center gap-3 text-sm font-bold text-lightgrey">
                    <span className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-secondary/20 px-4 py-2 backdrop-blur-xl">
                        <FiShield className="text-tertiary" />
                        Account Security
                    </span>
                </div>

                <SecurityForm
                    currentEmail={profile.email}
                    cancelHref="/user"
                />
            </div>
        </div>
    );
}
