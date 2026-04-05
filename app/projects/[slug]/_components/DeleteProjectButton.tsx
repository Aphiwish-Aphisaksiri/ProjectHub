"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";

export default function DeleteProjectButton({ projectId }: { projectId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        if (!confirm("Delete this project? This cannot be undone.")) return;

        setLoading(true);
        try {
            const res = await fetch("/api/projects", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId }),
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.error ?? "Failed to delete project.");
                return;
            }

            router.push("/projects");
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="group flex items-center gap-2 px-6 py-3 bg-red/10 hover:bg-red/20 border border-red/20 text-red font-black rounded-2xl text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/20 disabled:opacity-50 disabled:pointer-events-none"
        >
            <FiTrash2 className="group-hover:scale-110 transition-transform" size={15} />
            {loading ? "Deleting…" : "Delete Project"}
        </button>
    );
}
