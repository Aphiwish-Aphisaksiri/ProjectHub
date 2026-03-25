type NoteContentProps = {
    body: string;
};

export default function NoteContent({ body }: NoteContentProps) {
    return (
        <div className="rounded-4xl border border-white/6 bg-primary-950/50 p-8 shadow-inner shadow-black/10">
            <div className="whitespace-pre-wrap wrap-break-words text-lg leading-8 text-offwhite/90">
                {body}
            </div>
        </div>
    );
}