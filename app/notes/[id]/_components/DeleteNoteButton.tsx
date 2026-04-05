"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiTrash2, FiX } from "react-icons/fi";

export default function DeleteNoteButton({
    noteId,
    backHref,
}: {
    noteId: string;
    backHref: string;
}) {
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleConfirm() {
        setLoading(true);
        try {
            const res = await fetch("/api/notes", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ noteId }),
            });

            if (!res.ok) {
                const data = await res.json();
                console.error(data.error ?? "Failed to delete note.");
                setConfirming(false);
                return;
            }

            router.push(backHref);
        } finally {
            setLoading(false);
        }
    }

    if (confirming) {
        return (
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setConfirming(false)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-lightgrey hover:text-offwhite font-black rounded-2xl text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                    <FiX size={14} /> Cancel
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-3 bg-red/20 hover:bg-red/30 border border-red/30 text-red font-black rounded-2xl text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                    <FiTrash2 size={14} />
                    {loading ? "Deleting…" : "Confirm Delete"}
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className="group flex items-center gap-2 px-6 py-3 bg-red/10 hover:bg-red/20 border border-red/20 text-red font-black rounded-2xl text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/20"
        >
            <FiTrash2 className="group-hover:scale-110 transition-transform" size={15} />
            Delete Note
        </button>
    );
}
