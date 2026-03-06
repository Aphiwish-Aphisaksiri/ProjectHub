import Sidebar from "./_components/sidebar";
import NewProjectForm from "./_components/newProjectForm";

export default function ProjectsPage() {

  return (
    <main className="bg-primary flex flex-row h-full">

      {/* Sidebar */}
        <Sidebar />


      {/* Main content */}
      <div className="projects-content h-full w-full flex flex-col gap-2.5 px-16 py-8 items-center justify-start">
        <NewProjectForm />
      </div>
    </main>
    );
}