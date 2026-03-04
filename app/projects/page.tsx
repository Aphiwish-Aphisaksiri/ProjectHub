import Sidebar from "./_components/sidebar";
import NewProjectForm from "./_components/newProjectForm";


//TODO: Make sidebar a component and make it collapsible for mobile view. Also, add functionality to the project list and settings button.
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