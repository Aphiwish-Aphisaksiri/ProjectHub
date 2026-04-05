import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { FiArrowLeft, FiClock, FiEdit3, FiFileText, FiFolder, FiUser } from 'react-icons/fi';
import ContentBox from '@/components/ContentBox';
import { getCurrentUser } from '@/lib/auth';
import { getUserNoteById } from '@/lib/notes';
import DeleteNoteButton from './_components/DeleteNoteButton';

export const dynamic = 'force-dynamic';

export default async function NoteDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ back?: string }>;
}) {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/user/signin');
    }

    const { id } = await params;
    const { back } = await searchParams;
    const note = await getUserNoteById(id);

    if (!note) {
        notFound();
    }

    return (
        <div className="min-h-full overflow-x-hidden bg-primary pb-20 text-offwhite selection:bg-tertiary/30">
            <div className="relative overflow-hidden border-b border-white/5 bg-linear-to-br from-primary-800 via-secondary-900 to-primary-950">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-tertiary/10 blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] h-[50%] w-[50%] rounded-full bg-secondary-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150"></div>
                </div>

                <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-end gap-8 px-6 pb-10 pt-6">
                    <div className="flex flex-col md:flex-row items-center md:items-end justify-between w-full gap-4">
                        <div className="max-w-4xl">
                            <Link href={back ?? "/notes"} className="mb-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-tertiary transition-all hover:gap-4">
                                <FiArrowLeft /> {back ? (back.endsWith("/notes") ? `Back to ${note.project.title} Notes` : "Back to Project Overview") : "Back to Notes"}
                            </Link>

                            <div className="flex items-center gap-4">
                                <span className="rounded-3xl border border-tertiary/30 bg-tertiary/20 p-3">
                                    <FiFileText className="text-tertiary" size={38} />
                                </span>
                                <div>
                                    <h1 className="text-3xl 2xl:text-5xl font-black tracking-tighter text-offwhite">{note.title}</h1>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col shrink-0 gap-2">
                            <Link
                                href={`/notes/${note.id}/edit`}
                                className="group flex items-center gap-2 px-6 py-3 bg-secondary-400/10 hover:bg-secondary-400/20 border border-secondary-400/20 text-secondary-400 font-black rounded-2xl text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/20"
                                >
                                <FiEdit3 className="group-hover:rotate-10 transition-transform" />
                                Edit Note
                            </Link>
                            <DeleteNoteButton noteId={note.id} backHref={back ?? '/notes'} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-20 mx-auto mt-10 max-w-7xl px-6">
                <div className="grid gap-8 xl:grid-cols-[1.5fr_0.9fr]">
                    <section className="rounded-[2.5rem] border border-white/6 bg-secondary/20 p-8 shadow-2xl backdrop-blur-xl md:p-10">
                        <div className="mb-6 flex items-center gap-3 border-b border-white/6 pb-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-tertiary/20 bg-tertiary/10 text-tertiary">
                                <FiFileText size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">Note Content</p>
                                <h2 className="text-2xl font-black tracking-tight text-offwhite">Plain text view</h2>
                            </div>
                        </div>

                        <ContentBox body={note.body} />
                    </section>

                    <aside className="space-y-6">
                        <div className="rounded-[2.5rem] border border-white/6 bg-secondary/20 p-8 shadow-2xl backdrop-blur-xl">
                            <p className="mb-6 text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">Metadata</p>
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-white/6 bg-primary-950/40 p-4">
                                    <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-lightgrey/60">
                                        <FiFolder /> Project
                                    </p>
                                    <p className="text-lg font-bold text-offwhite">{note.project.title}</p>
                                </div>

                                <div className="rounded-2xl border border-white/6 bg-primary-950/40 p-4">
                                    <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-lightgrey/60">
                                        <FiUser /> Author
                                    </p>
                                    <p className="text-lg font-bold text-offwhite">{note.author?.name || user.name}</p>
                                </div>

                                <div className="rounded-2xl border border-white/6 bg-primary-950/40 p-4">
                                    <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-lightgrey/60">
                                        <FiClock /> Created
                                    </p>
                                    <p className="text-lg font-bold text-offwhite">
                                        {new Date(note.createdAt).toLocaleDateString(undefined, {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-white/6 bg-primary-950/40 p-4">
                                    <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-lightgrey/60">
                                        <FiClock /> Updated
                                    </p>
                                    <p className="text-lg font-bold text-offwhite">
                                        {new Date(note.updatedAt).toLocaleDateString(undefined, {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}