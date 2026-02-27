import { GoHome, GoGear } from "react-icons/go";
import NewProjectForm from "./_components/newProjectForm";
import { ProjectVisibility } from '@prisma/client'

export default function ProjectsPage() {

  const visibilityOptions = Object.values(ProjectVisibility);

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
        <NewProjectForm visibilityOptions={visibilityOptions} />
      </div>
    </main>
    );
}