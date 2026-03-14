import NewTaskForm from "./components/newTaskForm";

export default async function NewTaskPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return (
        <div className="flex items-center justify-center min-h-screen bg-primary text-offwhite">
            <NewTaskForm projectSlug={slug} />
        </div>
    );
}