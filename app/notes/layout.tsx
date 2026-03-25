import Sidebar from "./_components/sidebar";
import type { ReactNode } from "react";

export default function NotesLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-row h-full bg-primary">
            <Sidebar />
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}
