const BACKEND_URL = process.env.BACKEND_URL;

export async function syncProjectEmbedding(project: {
    id: string;
    title: string;
    description: string | null;
    slug: string;
}) {
    await fetch(`${BACKEND_URL}/embed/project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            projectId: project.id,
            sourceId: project.id,
            title: project.title,
            description: project.description ?? "",
            slug: project.slug,
        }),
    });
}

export async function syncTaskEmbedding(
    task: { id: string; title: string; body: string | null },
    projectId: string,
) {
    const text = task.body ? `${task.title}\n${task.body}` : task.title;

    await fetch(`${BACKEND_URL}/embed/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
            projectId,
            sourceId: task.id,
            text,
        }),
    });
}

export async function syncNoteEmbedding(
    note: { id: string; title: string; body: string },
    projectId: string,
) {
    await fetch(`${BACKEND_URL}/embed/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
            projectId,
            sourceId: note.id,
            text: `${note.title}\n${note.body}`,
        }),
    });
}
