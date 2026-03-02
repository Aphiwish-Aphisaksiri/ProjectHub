"use client";

import { useEffect } from 'react';

export default function ProjectDescription({ isExceed, setIsExceed, description, setDescription }: { isExceed: boolean; setIsExceed: (value: boolean) => void; description: string; setDescription: (value: string) => void }) {
    const maxCharacters: number = 250;

    useEffect(() => {
        if (description.length > maxCharacters) {
            setIsExceed(true);
        } else {
            setIsExceed(false);
        }
    }, [description, isExceed, setIsExceed]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDescription(e.target.value);
    }

    return (
        <div className="Project-description flex flex-col gap-1.25 pl-8 w-full items-left justify-center">
            <label className="text-offwhite text-[20px] font-bold whitespace-nowrap w-fit h-fit">
                Description
            </label>
            {/* Project description input line */}
            <textarea
                className={`text-lightgrey text-left border rounded-md px-2 py-2 min-h-37.5 w-full
                    ${isExceed ? "border-red" : "border-lightgrey"}`}
                placeholder="My awesome project description"
                onChange={handleChange}
                value={description}
            />
            {/* Project description description line */}
            <p className={`text-lightgrey text-[14px] font-bold ${isExceed ? "text-red" : ""}`}>
            {description.length}/{maxCharacters} characters
            </p>
        </div>
    );
}