import { GoHome } from "react-icons/go";


export default function Projects() {
  return (
    <main className="bg-primary flex flex-row h-full">
      <div className="Sidebar flex flex-col w-60 h-full px-4 py-8 justify-between bg-secondary">
        <div className="Project-list flex flex-col gap-2.5">
          <div className="btn-home flex flex-row items-center justify-left gap-2.5 px-1.25 text-offwhite text-[20px]">
            <GoHome /> Home
          </div>
        </div>
        <div className="bottom-sidebar text-offwhite text-[18px]">
          Hello
        </div>
      </div>
      <div className="projects-content flex">
        sd
      </div>
    </main>
    );
}