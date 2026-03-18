'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { updateUserNote } from '@/app/notes/actions';
import { NOTE_BODY_LIMIT } from '@/app/notes/constants';

type NoteEditorFormProps = {
    noteId: string;
    initialTitle: string;
    initialBody: string;
    cancelHref: string;
};

type UpdateResult = {
    type: 'success' | 'error';
    message: string;
} | null;

export default function NoteEditorForm({
    noteId,
    initialTitle,
    initialBody,
    cancelHref,
}: NoteEditorFormProps) {
    const router = useRouter();
    const [title, setTitle] = useState(initialTitle);
    const [body, setBody] = useState(initialBody);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<UpdateResult>(null);

    const isExceed = body.length > NOTE_BODY_LIMIT;
    const isUnchanged = title.trim() === initialTitle.trim() && body.trim() === initialBody.trim();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (loading || isExceed || !title.trim() || !body.trim()) {
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            await updateUserNote({ noteId, title, body });
            setResult({ type: 'success', message: 'Note updated successfully.' });
            router.push(`/notes/${noteId}`);
            router.refresh();
        } catch (error) {
            setResult({
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to update note.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="rounded-[2.5rem] border border-white/8 bg-secondary/20 p-8 shadow-2xl backdrop-blur-xl">
                <div className="mb-8 flex flex-col gap-4 border-b border-white/6 pb-8 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-tertiary/80">Note Editor</p>
                        <h2 className="text-3xl font-black tracking-tight text-offwhite">Refine your note</h2>
                    </div>

                    <Link
                        href={cancelHref}
                        className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-lightgrey transition-all hover:border-white/20 hover:bg-white/10 hover:text-offwhite"
                    >
                        <FiArrowLeft />
                        Cancel
                    </Link>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-lg font-bold text-offwhite">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={event => setTitle(event.target.value)}
                            maxLength={100}
                            required
                            className="w-full rounded-2xl border border-white/8 bg-primary-950/60 px-5 py-4 text-base text-offwhite placeholder:text-lightgrey/45 focus:border-tertiary/40 focus:outline-none"
                            placeholder="Give this note a clear title"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                            <label className="block text-lg font-bold text-offwhite">Content</label>
                            <span className={`text-sm font-bold ${isExceed ? 'text-red' : 'text-lightgrey'}`}>
                                {body.length} / {NOTE_BODY_LIMIT}
                            </span>
                        </div>
                        <textarea
                            value={body}
                            onChange={event => setBody(event.target.value)}
                            rows={16}
                            required
                            className={`w-full resize-none rounded-4xl border bg-primary-950/60 px-5 py-4 text-base leading-7 text-offwhite placeholder:text-lightgrey/45 focus:outline-none ${
                                isExceed ? 'border-red/70 focus:border-red' : 'border-white/8 focus:border-tertiary/40'
                            }`}
                            placeholder="Keep writing in plain text for now"
                        />
                        <p className="text-sm font-medium text-lightgrey">
                            Line breaks are preserved on the note page.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end gap-3">
                <button
                    type="submit"
                    disabled={loading || isExceed || !title.trim() || !body.trim() || isUnchanged}
                    className={`inline-flex items-center gap-3 rounded-2xl px-6 py-3 text-sm font-black tracking-wide transition-all ${
                        loading || isExceed || !title.trim() || !body.trim() || isUnchanged
                            ? 'cursor-not-allowed bg-white/10 text-lightgrey/50'
                            : 'bg-tertiary text-offblack shadow-xl shadow-tertiary/20 hover:scale-[1.02] hover:opacity-95 active:scale-[0.98]'
                    }`}
                >
                    <FiSave />
                    {loading ? 'Saving changes...' : isUnchanged ? 'No changes yet' : 'Save changes'}
                </button>

                {result && (
                    <p className={`text-sm font-bold ${result.type === 'success' ? 'text-green' : 'text-red'}`}>
                        {result.message}
                    </p>
                )}
            </div>
        </form>
    );
}