'use client';

import { useState } from 'react';
import { createTask } from '../action';
import { TaskStatus, Priority } from '@/types';
import { useRouter } from 'next/navigation';

export default function NewTaskForm({ projectSlug }: { projectSlug: string }) {
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
    const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);

    type CreateResult = {
        type: 'success' | 'error';
        message: string;
    } | null;

    const [result, setResult] = useState<CreateResult>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createTask({
                projectSlug,
                title,
                body,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate) : undefined,
            });
            setResult({ type: 'success', message: 'Task created successfully!' });
            setTimeout(() => router.push(`/projects/${projectSlug}/tasks`), 1000);
        } catch (err) {
            setResult({
                type: 'error',
                message: err instanceof Error ? err.message : 'Failed to create task.',
            });
        } finally {
            setLoading(false);
        }
    };

    const selectClass = "bg-lightgrey/20 text-offwhite hover:bg-lightgrey/10 text-[16px] rounded-md px-4 py-2 h-fit w-fit border border-lightgrey/20 focus:outline-none focus:border-tertiary transition-colors duration-200";

    return (
        <form
            onSubmit={handleSubmit}
            className="new-task flex flex-col items-center justify-center bg-primary w-200 h-full"
        >
            {/* Heading */}
            <div className="flex flex-col gap-4 items-left justify-start w-full">
                <h1 className="text-[32px] text-left text-offwhite font-bold">
                    Create a new task
                </h1>
                <h2 className="text-left text-[16px] text-lightgrey font-bold">
                    Break down your project into actionable steps
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
                            Task title:
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Set up authentication"
                            maxLength={100}
                            required
                            className="bg-lightgrey/20 text-offwhite placeholder:text-lightgrey/50 text-[16px] rounded-md px-4 py-2 w-full border border-lightgrey/20 focus:outline-none focus:border-tertiary transition-colors duration-200"
                        />
                    </div>
                    <p className="text-lightgrey text-[14px] font-bold">
                        Keep it short and actionable
                    </p>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-2.5 pl-8 w-full">
                    <label className="text-offwhite text-[20px] font-bold w-fit h-fit">
                        Description:
                    </label>
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        placeholder="Add more details about this task..."
                        rows={5}
                        className="bg-lightgrey/20 text-offwhite placeholder:text-lightgrey/50 text-[16px] rounded-md px-4 py-2 w-full border border-lightgrey/20 focus:outline-none focus:border-tertiary transition-colors duration-200 resize-none"
                    />
                    <p className="text-lightgrey text-[14px] font-bold">
                        Optional — markdown supported
                    </p>
                </div>
            </div>

            {/* Configuration */}
            <div className="flex flex-col gap-2.5 h-full w-full items-center justify-start">
                <h1 className="w-full text-[24px] text-offwhite text-left font-bold">
                    Configuration
                </h1>

                {/* Status */}
                <div className="flex flex-row justify-between w-full pl-8">
                    <div className="flex flex-col">
                        <label className="text-offwhite text-[20px] font-bold w-fit h-fit">
                            Status
                        </label>
                        <p className="text-lightgrey text-[14px] font-bold">
                            Current state of this task
                        </p>
                    </div>
                    <div className="flex flex-col justify-center">
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value as TaskStatus)}
                            className={selectClass}
                        >
                            {Object.values(TaskStatus).map(s => (
                                <option key={s} value={s} className="bg-lightgrey/20 text-offblack">
                                    {s.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Priority */}
                <div className="flex flex-row justify-between w-full pl-8">
                    <div className="flex flex-col">
                        <label className="text-offwhite text-[20px] font-bold w-fit h-fit">
                            Priority
                        </label>
                        <p className="text-lightgrey text-[14px] font-bold">
                            How urgent is this task?
                        </p>
                    </div>
                    <div className="flex flex-col justify-center">
                        <select
                            value={priority}
                            onChange={e => setPriority(e.target.value as Priority)}
                            className={selectClass}
                        >
                            {Object.values(Priority).map(p => (
                                <option key={p} value={p} className="bg-lightgrey/20 text-offblack">
                                    {p.charAt(0) + p.slice(1).toLowerCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Due date */}
                <div className="flex flex-row justify-between w-full pl-8">
                    <div className="flex flex-col">
                        <label className="text-offwhite text-[20px] font-bold w-fit h-fit">
                            Due date
                        </label>
                        <p className="text-lightgrey text-[14px] font-bold">
                            Optional deadline for this task
                        </p>
                    </div>
                    <div className="flex flex-col justify-center">
                        <input
                            type="date"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            className={selectClass}
                        />
                    </div>
                </div>

                {/* Submit */}
                <div className="w-full flex flex-col items-end justify-center mt-4">
                    <button
                        type="submit"
                        disabled={loading || !title.trim()}
                        className={`text-offwhite px-6 py-2 rounded-md font-bold transition-colors duration-200 h-fit w-fit
                            ${!title.trim() ? 'bg-lightgrey/20 cursor-not-allowed' : 'bg-green hover:bg-green/50'}`}
                    >
                        {loading ? 'Creating Task...' : 'Create New Task'}
                    </button>
                    {result && (
                        <p className={`mt-2 text-sm font-bold ${result.type === 'success' ? 'text-green' : 'text-red'}`}>
                            {result.message}
                        </p>
                    )}
                </div>
            </div>
        </form>
    );
}