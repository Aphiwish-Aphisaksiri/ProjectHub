"use client";

import { useState, useEffect } from "react"; // Added useEffect
import { checkIfProjectTitleExists } from "../action";

export default function ProjectTitleInput({ title, setTitle, isDuplicate, setIsDuplicate}: { title: string; setTitle: (value: string) => void; isDuplicate: boolean; setIsDuplicate: (value: boolean) => void }) {
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        // 1. Don't ping the DB for empty strings or very short names
        if (!title || title.length < 2) {
            setIsDuplicate(false);
            return;
        }

        // 2. Start the timer
        const timer = setTimeout(async () => {
            setIsChecking(true);
            try {
                const exists = await checkIfProjectTitleExists(title);
                setIsDuplicate(exists);
            } catch (error) {
                console.error("Failed to check title:", error);
            } finally {
                setIsChecking(false);
            }
        }, 500); // 500ms delay

        // 3. Cleanup: If the user types again, this "kills" the previous timer
        return () => clearTimeout(timer);
    }, [title]); // This effect runs every time 'title' changes

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value); // Update the title state on every keystroke triggering the dependency array in useEffect ^^^
    };

    return (
        <div className="w-full flex flex-row relative">
            <input
                type="text"
                className={`bg-primary text-lightgrey text-center border ${
                    isDuplicate ? "border-red" : "border-lightgrey"
                } rounded-md px-4 py-1.25 h-fit w-full focus:outline-none transition-colors`}
                placeholder="My-awesome-project"
                value={title}
                onChange={handleChange}
            />
            
            {/* Helpful UI feedback */}
            {isChecking && (
                <p className="text-[10px] text-lightgrey absolute right-2 top-1/2 -translate-y-1/2">
                    Checking...
                </p>
            )}
            
            {isDuplicate && (
                <p className="text-red text-xs mt-1 text-center">
                    This project name is already taken!
                </p>
            )}
        </div>
    );
}