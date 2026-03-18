'use client';

import { FiFileText, FiFolder, FiUser, FiCalendar, FiClock, FiSearch } from "react-icons/fi";
import { useState } from "react";

interface Note {
    id: string;
    title: string;
    body: string;
    createdAt: Date;
    projectId: string;
    project: { title: string };
    author: { name: string; avatarUrl: string | null } | null;
}

export default function NotesGrid({ initialNotes }: { initialNotes: Note[] }) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredNotes = initialNotes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.author?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Search Bar */}
            <div className="relative group max-w-2xl mx-auto">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <FiSearch className="text-tertiary group-focus-within:scale-110 transition-transform" size={20} />
                </div>
                <input
                    type="text"
                    placeholder="Search through your insights..."
                    className="block w-full pl-14 pr-6 py-5 bg-secondary/20 backdrop-blur-xl border border-white/5 rounded-3xl text-offwhite placeholder:text-lightgrey/50 focus:outline-none focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary/30 transition-all shadow-2xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.map((note, index) => (
                    <div
                        key={note.id}
                        className={`group relative bg-secondary/20 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 hover:border-tertiary/20 hover:bg-secondary/40 transition-all duration-500 shadow-xl hover:shadow-tertiary/5 flex flex-col h-full
                        ${index % 5 === 0 ? 'md:col-span-2' : ''}
                        ${index % 7 === 0 ? 'lg:row-span-2' : ''}`}
                    >
                        {/* Decorative Gradient overlay */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary border border-tertiary/20 group-hover:scale-110 transition-transform">
                                <FiFileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-tertiary/60 mb-0.5">Note Entry</p>
                                <h3 className="text-xl font-black text-offwhite truncate group-hover:text-tertiary transition-colors">{note.title}</h3>
                            </div>
                        </div>

                        <div className="flex-1">
                            <p className="text-lightgrey font-medium leading-relaxed mb-8 line-clamp-4 group-hover:text-offwhite transition-colors">
                                {note.body}
                            </p>
                        </div>

                        <div className="space-y-4 mt-auto pt-6 border-t border-white/5">
                            <div className="flex flex-wrap gap-3">
                                <span className="flex items-center gap-2 px-3 py-1.5 bg-secondary-900/50 rounded-xl text-xs font-bold text-secondary-400 border border-secondary-400/10">
                                    <FiFolder size={14} />
                                    {note.project.title}
                                </span>
                                <span className="flex items-center gap-2 px-3 py-1.5 bg-primary-950/50 rounded-xl text-xs font-bold text-lightgrey border border-white/5">
                                    <FiUser size={14} />
                                    {note.author?.name || "Unknown"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tighter text-lightgrey/40">
                                <span className="flex items-center gap-1.5">
                                    <FiClock size={12} />
                                    {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                <span className="text-tertiary/40 group-hover:text-tertiary transition-colors">ID: {note.id.slice(0, 8)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredNotes.length === 0 && (
                <div className="py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                        <FiFileText size={40} className="text-lightgrey/20" />
                    </div>
                    <h3 className="text-2xl font-black text-offwhite mb-2">No results found</h3>
                    <p className="text-lightgrey font-medium">{"Try adjusting your search to find what you're looking for."}</p>
                </div>
            )}
        </div>
    );
}
