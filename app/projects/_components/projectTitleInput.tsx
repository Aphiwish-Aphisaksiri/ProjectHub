"use client";

import { useState } from "react";
import { checkIfProjectTitleExists } from "../action";

export default function ProjectTitleInput() {
    const [title, setTitle] = useState("");
    const [isDuplicate, setIsDuplicate] = useState(false);

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);

        // Call server action
        const exists = await checkIfProjectTitleExists(newTitle);
        setIsDuplicate(exists);
    };
    return (
        <input
            type="text"
            className={`bg-primary text-lightgrey text-center border ${isDuplicate ? "border-red-500" : "border-lightgrey"} rounded-md px-4 py-1.25 h-fit w-full`}
            placeholder="My-awesome-project"
            value={title}
            onChange={handleChange}
        />
    );
}