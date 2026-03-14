'use client';

import { useState } from 'react';
import { createNote } from '../action';
import { useRouter } from 'next/navigation';

export default function NewNoteForm({ projectSlug }: { projectSlug: string }) {
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [isExceed, setIsExceed] = useState(false);

    const BODY_LIMIT = 10000;

    type CreateResult = {
        type: 'success' | 'error';
        message: string;
    } | null;

    const [result, setResult] = useState<CreateResult>(null);

    const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setBody(value);
        setIsExceed(value.length > BODY_LIMIT);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isExceed) return;
        setLoading(true);

        try {
            await createNote({ projectSlug, title, body });
            setResult({ type: 'success', message: 'Note created successfully!' });
            setTimeout(() => router.push(`/projects/${projectSlug}/notes`), 1000);
        } catch (err) {
            setResult({
                type: 'error',
                message: err instanceof Error ? err.message : 'Failed to create note.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="new-note h-fit w-4xl flex flex-col items-center justify-center p-8"
        >
            {/* Heading */}
            <div className="flex flex-col gap-4 items-left justify-start w-full">
                <h1 className="text-[32px] text-left text-offwhite font-bold">
                    Create a new note
                </h1>
                <h2 className="text-left text-[16px] text-lightgrey font-bold">
                    Capture ideas, research, or anything relevant to this project
                </h2>
            </div>

            {/* General */}
            <div className="flex flex-col gap-2.5 h-full w-full items-center justify-start">
                <h1 className="w-full text-[24px] text-offwhite text-left font-bold">
                    General
                </h1>

                {/* Title */}
                <div className="flex flex-col gap-2.5 pl-8 w-full">
                    <div className="flex flex-row gap-2.5 items-center justify-start">
                        <label className="text-offwhite text-[20px] font-bold whitespace-nowrap w-fit h-fit">
                            Note title:
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Architecture decisions"
                            maxLength={100}
                            required
                            className="bg-lightgrey/20 text-offwhite placeholder:text-lightgrey/50 text-[16px] rounded-md px-4 py-2 w-full focus:outline-none focus:border-tertiary transition-colors duration-200"
                        />
                    </div>
                    <p className="text-lightgrey text-[14px] font-bold">
                        Give your note a clear, descriptive title
                    </p>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-2.5 pl-8 w-full">
                    <div className="flex flex-row justify-between items-center">
                        <label className="text-offwhite text-[20px] font-bold w-fit h-fit">
                            Content:
                        </label>
                        <span className={`text-[13px] font-bold ${isExceed ? 'text-red' : 'text-lightgrey'}`}>
                            {body.length} / {BODY_LIMIT}
                        </span>
                    </div>
                    <textarea
                        value={body}
                        onChange={handleBodyChange}
                        placeholder="Write your note here... markdown is supported"
                        rows={12}
                        required
                        className={`bg-lightgrey/20 text-offwhite placeholder:text-lightgrey/50 text-[16px] rounded-md px-4 py-2 w-full transition-colors duration-200 focus:outline-none resize-none
                            ${isExceed ? 'border-red focus:border-red' : 'border-lightgrey/20 focus:border-tertiary'}`}
                    />
                    <p className="text-lightgrey text-[14px] font-bold">
                        Markdown supported — this content will be searchable by the chatbot
                    </p>
                </div>
            </div>

            {/* Submit */}
            <div className="w-full flex flex-col items-end justify-center">
                <button
                    type="submit"
                    disabled={loading || isExceed || !title.trim() || !body.trim()}
                    className={`text-offwhite px-6 py-2 rounded-md font-bold transition-colors duration-200 h-fit w-fit
                        ${isExceed
                            ? 'bg-red hover:bg-red/50'
                            : !title.trim() || !body.trim()
                            ? 'bg-lightgrey/20 cursor-not-allowed'
                            : 'bg-green hover:bg-green/50'}`}
                >
                    {isExceed ? 'Content limit exceeded' :
                     loading ? 'Creating Note...' : 'Create New Note'}
                </button>
                {result && (
                    <p className={`mt-2 text-sm font-bold ${result.type === 'success' ? 'text-green' : 'text-red'}`}>
                        {result.message}
                    </p>
                )}
            </div>
        </form>
    );
}