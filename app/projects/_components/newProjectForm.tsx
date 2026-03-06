/* This component is a new project form which includes
    - Project name
    - Project description
    - Visibility options (currently PRIVATE and PUBLIC (can be set in db schema))
    - Add README option (boolean toggle)
    - Create project button

    TODO: Check for the user that logged in, if the user is not logged in, show a button to redirect to the login page.
    If the user is logged in, show the form and create the project with the current user's ID as the ownerId.
*/
'use client';

import ProjectTitleInput from "./projectTitleInput";
import ProjectDescription from "./projectDescription";
import { useState } from 'react';
import { createProject, getCurrentUserId } from "../action";
import { ProjectVisibility } from '@prisma/client'

export default function NewProjectForm() {
    const visibilityOptions = Object.values(ProjectVisibility);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState<ProjectVisibility>(visibilityOptions[0]);
    const [addReadMe, setAddReadMe] = useState(false);
    const [loading, setLoading] = useState(false);

    const [isDuplicate, setIsDuplicate] = useState(false);
    const [isExceed, setIsExceed] = useState(false);

    type CreateResult = {
        type: "success" | "error";
        message: string;
    } | null;

    const [result, setResult] = useState<CreateResult>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Check if the user logged on
        const userId = await getCurrentUserId();
        if (!userId) {
            setResult({
                type: "error",
                message: "You must be logged in to create a project."
            });
            setLoading(false);
            return;
        }

        try {
            await createProject({
                title,
                description,
                visibility,
                addReadMe,
                setResult
            });
            setResult({
                type: "success",
                message: "Project created successfully!"
            });
        // Handle error
        }
        catch (err) {
            console.error("Failed to create project:", err);
            setResult({
                type: "error",
                message: err instanceof Error ? err.message : 'Failed to create project.'
            });
        }
        finally {
        setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="New-project h-fit w-fit flex flex-col gap-11 items-center justify-center">
            {/* Heading */}
            <div className="Heading h-fit w-fit flex flex-col gap-4 items-left justify-start">
                <h1 className="Header h-fit w-fit text-[32px] text-left text-offwhite font-bold">
                    Create a new project
                </h1>
                <h2 className="Subheader h-fit w-fit text-left text-[16px] text-lightgrey font-bold">
                    The project can contain plans, notes, tasks. Have a friends to work on this project? you can add them too
                </h2>
            </div>


            {/* General */}
            <div className="general flex flex-col gap-2.5 h-full w-full items-center justify-start">
                <h1 className="txt-general w-full text-[24px] text-offwhite text-left font-bold">
                    General
                </h1>

                {/* Project name */}
                <div className="Project-name flex flex-col gap-2.5 pl-8 w-full">
                    {/* Project name input line */}
                    <div className="Project-name-input flex flex-row gap-2.5 items-center justify-center">
                        <label className="text-offwhite text-[20px] font-bold whitespace-nowrap w-fit h-fit">
                            Project name:
                        </label>
                        <ProjectTitleInput title={title} setTitle={setTitle} isDuplicate={isDuplicate} setIsDuplicate={setIsDuplicate} />
                    </div>
                    {/* Project name description line */}
                    <p className="text-lightgrey text-[14px] font-bold">
                    The project name should be unique and memorable
                    </p>
                </div>

                {/* Project description */}
                <ProjectDescription isExceed={isExceed} setIsExceed={setIsExceed} description={description} setDescription={setDescription} />

            </div>




            {/* Configuration */}
            <div className="configuration flex flex-col gap-2.5 h-full w-full items-center justify-start">
                <h1 className="txt-configuration w-full text-[24px] text-offwhite text-left font-bold">
                    Configuration
                </h1>

                {/* Visibility */}
                <div className="visibility flex flex-row justify-between w-full pl-8">
                    {/* Visibility text and description */}
                    <div className="visibility-text flex flex-col">
                        <label className="text-offwhite text-[20px] font-bold w-fit h-fit">
                            Visibility
                        </label>
                        <p className="text-lightgrey text-[14px] font-bold">
                            Choose who can see and work on this project
                        </p>
                    </div>

                    {/* Visibility options (dropdown) */}
                    <div className="visibility-options flex flex-col justify-center">
                        <select
                            value={visibility}
                            className="bg-lightgrey/20 text-offwhite hover:bg-lightgrey/10 text-[20px] rounded-md px-4 py-1.25 h-fit w-fit"
                            onChange={e => setVisibility(e.target.value as ProjectVisibility)}
                        >
                            {visibilityOptions.map((option) => (
                                <option
                                    key={option}
                                    className="bg-lightgrey/20 text-offblack"
                                    value={option}
                                >
                                    {option.charAt(0) + option.slice(1).toLowerCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                </div>

                {/* Add README option */}
                <div className="add-readme flex flex-row justify-between w-full pl-8">
                    {/* Add README text and description */}
                    <div className="add-readme-text flex flex-col justify-center">
                        <label className="text-offwhite text-[20px] font-bold w-fit h-fit">
                            Add README
                        </label>
                        <p className="text-lightgrey text-[14px] font-bold">
                            Create a README file for detailed description
                        </p>
                    </div>
                    {/* Add README toggle */}
                    <div className="add-readme-toggle flex flex-col justify-center">
                        <input type="checkbox" className="w-6 h-6 accent-offwhite hover:accent-offwhite/50" onBlur={e => setAddReadMe(e.target.checked)} />
                    </div>
                </div>

                {/* Confirmation button */}
                <div className="confirmation-button w-full flex flex-col items-end justify-center mt-4 ">
                    <button type="submit"
                            className={`text-offwhite px-6 py-2 rounded-md font-bold transition-colors duration-200 h-fit w-fit
                                ${isDuplicate ? "bg-red hover:bg-red/50" : isExceed ? "bg-red hover:bg-red/50" : "bg-green hover:bg-green/50"}`}
                            disabled={loading || isDuplicate || isExceed}
                    >
                        {isDuplicate ? "Project name taken" :
                        isExceed ? "Description length limit exceeded" :
                        loading ? "Creating Project..." : "Create New Project"}
                    </button>
                    {/* Result message */}
                    {result && (
                        <p
                            className={`mt-2 text-sm font-bold
                            ${result.type === "success" ? "text-green" : "text-red"}`}
                        >
                            {result.message}
                        </p>
                    )}
                </div>
            </div>
        </form>
    );
}