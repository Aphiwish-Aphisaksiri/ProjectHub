/* This component is a new project form which includes
    - Project name
    - Project description
    - Visibility options (currently PRIVATE and PUBLIC (can be set in db schema))
    - Add README option (boolean toggle)
    - Create project button
*/

import ProjectTitleInput from "./projectTitleInput";
import CreateProjectButton from "./createProjectButton";

export default function NewProjectForm({ visibilityOptions}: { visibilityOptions: string[]}) {
    return (
        <div className="New-project h-fit w-fit flex flex-col gap-11 items-center justify-center">
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
                <ProjectTitleInput />
                </div>
                {/* Project name description line */}
                <p className="text-lightgrey text-[14px] font-bold">
                The project name should be unique and memorable
                </p>
            </div>

            {/* Project description */}
            <div className="Project-description flex flex-col gap-1.25 pl-8 w-full">
                {/* Project description input line */}
                <div className="Project-description-input flex flex-col gap-2.5 items-left justify-center">
                <label className="text-offwhite text-[20px] font-bold whitespace-nowrap w-fit h-fit">
                    Description
                </label>
                <textarea
                    className="bg-primary text-lightgrey text-left border border-lightgrey rounded-md px-2 py-2 min-h-37.5 w-full"
                    placeholder="My awesome project description"
                />
                </div>
                {/* Project description description line */}
                <p className="text-lightgrey text-[14px] font-bold">
                Maximum 250 characters
                </p>
            </div>

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
                <select className="bg-lightgrey/20 text-offwhite hover:bg-lightgrey/10 text-[20px] rounded-md px-4 py-1.25 h-fit w-fit">
                    {visibilityOptions.map((option) => (
                        <option key={option} className="bg-lightgrey/20 text-offblack" value={option}>
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
                <input type="checkbox" className="w-6 h-6 accent-offwhite hover:accent-offwhite/50" />
                </div>
            </div>

            {/* Confirmation button */}
            <div className="confirmation-button w-full flex justify-end mt-4">
                <CreateProjectButton />
            </div>
        </div>
    </div>
    );
}