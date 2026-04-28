import { getUserNotes } from "@/components/action";
import { getCurrentUser } from "@/lib/auth";
import NotesGrid from "@/app/notes/components/NotesGrid";
import Link from "next/link";
import { FiFileText, FiPlus } from "react-icons/fi";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
    const user = await getCurrentUser();
    const notes = user ? await getUserNotes() : [];

    return (
        <div className="min-h-full bg-primary text-offwhite pb-20 selection:bg-tertiary/30 overflow-x-hidden">
            {/* Header Hero Section */}
            <div className="relative min-h-50 bg-linear-to-br from-primary-800 via-secondary-900 to-primary-950 overflow-hidden border-b border-white/5">
                {/* Decorative Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-tertiary/10 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 h-full flex items-end relative z-10 py-6">
                    <div className="flex flex-col md:flex-row items-center md:items-end justify-between w-full gap-8">
                        <div className="text-center md:text-left">
                            <h1 className="text-6xl font-black tracking-tighter text-offwhite flex items-center gap-4 justify-center md:justify-start">
                                <span className="p-3 bg-tertiary/20 rounded-3xl border border-tertiary/30">
                                    <FiFileText className="text-tertiary" size={38} />
                                </span>
                                Notes
                            </h1>
                            <p className="mt-4 text-lightgrey text-lg font-medium max-w-xl">
                                {"Everything you've written across your projects, in one place."}
                            </p>
                            <p className="mt-2 text-lightgrey font-medium">
                                {notes.length} note{notes.length !== 1 ? "s" : ""} across all projects, ready to review?
                            </p>
                        </div>
                        <div className="flex shrink-0">
                            {/* Create new note button */}
                            <Link 
                                href="/projects" 
                                className="group flex items-center gap-2 px-6 py-3 bg-secondary-400/10 hover:bg-secondary-400/20 border border-secondary-400/20 text-secondary-400 font-black rounded-2xl text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/20"
                            >
                                <FiPlus className="group-hover:rotate-90 transition-transform" />
                                New Note (via Project)
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 mt-6 relative z-20">
                {!user ? (
                    <div className="bg-secondary/20 backdrop-blur-md p-10 rounded-4xl border border-white/10 max-w-2xl mx-auto text-center mt-20">
                        <div className="bg-red/20 text-red-400 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red/10 border border-red/30">
                            <FiFileText size={40} />
                        </div>
                        <h2 className="text-3xl font-bold text-offwhite mb-3 tracking-tight">Access Restricted</h2>
                        <p className="text-lightgrey mb-8 text-lg">You must be signed in to access and manage your project notes.</p>
                        <Link href="/user/signin" className="inline-block px-8 py-4 bg-tertiary hover:opacity-90 text-offblack font-bold rounded-2xl transition-all shadow-lg shadow-tertiary/20">
                            Sign In Now
                        </Link>
                    </div>
                ) : (
                    <NotesGrid initialNotes={notes} />
                )}
            </div>
        </div>
    );
}