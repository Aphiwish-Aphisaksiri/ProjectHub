import NewNoteForm from "./components/newNoteForm";

export default async function NewNotePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return (
        <div className="flex items-start justify-center min-h-screen bg-primary">
            <NewNoteForm projectSlug={slug} />
        </div>
    );
}