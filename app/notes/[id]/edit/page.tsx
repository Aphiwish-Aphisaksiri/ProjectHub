import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { FiArrowLeft, FiEdit3, FiFileText } from 'react-icons/fi';
import NoteEditorForm from '@/app/notes/components/NoteEditorForm';
import { getCurrentUser } from '@/lib/auth';
import { getUserNoteById } from '@/lib/notes';

export const dynamic = 'force-dynamic';

export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/user/signin');
    }

    const { id } = await params;
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

                <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-end gap-6 px-6 pb-10 pt-6">
                    <Link href={`/notes/${note.id}`} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-tertiary transition-all hover:gap-4">
                        <FiArrowLeft /> Back to Note
                    </Link>

                    <div className="flex items-start gap-4">
                        <span className="rounded-3xl border border-tertiary/30 bg-tertiary/20 p-3">
                            <FiEdit3 className="text-tertiary" size={36} />
                        </span>
                        <div>
                            <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-tertiary/70">Editing Note</p>
                            <h1 className="text-4xl font-black tracking-tighter text-offwhite md:text-5xl">{note.title}</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-20 mx-auto mt-10 max-w-7xl px-6">
                <div className="mb-6 flex flex-wrap items-center gap-3 text-sm font-bold text-lightgrey">
                    <span className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-secondary/20 px-4 py-2 backdrop-blur-xl">
                        <FiFileText className="text-tertiary" />
                        {note.project.title}
                    </span>
                </div>

                <NoteEditorForm
                    noteId={note.id}
                    initialTitle={note.title}
                    initialBody={note.body}
                    cancelHref={`/notes/${note.id}`}
                />
            </div>
        </div>
    );
}