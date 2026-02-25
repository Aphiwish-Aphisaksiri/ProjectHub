"use client";
import { GoHome, GoGear } from "react-icons/go";

export default function Projects() {
  return (
    <main className="bg-primary flex flex-row h-full">

      {/* Sidebar */}
      <div className="Sidebar flex flex-col w-50 h-full px-4 py-8 justify-between bg-secondary">

        {/* Project list */}
        <div className="Project-list flex flex-col gap-2.5">
          <div className="btn-main flex flex-row items-center justify-left gap-2.5 px-1.25 text-offwhite text-[20px] font-bold">
            <GoHome /> Main
          </div>
          {/* TODO: Projects list should go here */}
        </div>

        {/* Bottom sidebar */}
        <div className="bottom-sidebar flex flex-col gap-2.5">
          <hr className="line-break border-offwhite border" />
          <button className="btn-settings flex flex-row items-center justify-left gap-2.5 px-1.25 text-offwhite text-[18px] font-bold">
            <GoGear /> Settings
          </button>
        </div>

      </div>


      {/* Main content */}
      <div className="projects-content h-full w-full flex flex-col gap-2.5 px-16 py-8 items-center justify-start">
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
                <input
                  type="text"
                  className="bg-primary text-lightgrey text-center border border-lightgrey rounded-md px-4 py-1.25 h-fit w-full"
                  placeholder="My-awesome-project"
                />
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
        </div>
      </div>
    </main>
    );
}