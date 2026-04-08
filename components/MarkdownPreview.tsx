import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownPreviewProps = {
    body: string;
};

export default function MarkdownPreview({ body }: MarkdownPreviewProps) {
    return (
        <div
            className="relative overflow-hidden max-h-48 mb-8 mask-[linear-gradient(to_bottom,black_70%,transparent_100%)]"
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p:          ({ children }) => <p className="mb-1.5 last:mb-0 text-lightgrey font-medium leading-relaxed group-hover:text-offwhite transition-colors">{children}</p>,
                    strong:     ({ children }) => <strong className="font-bold text-offwhite">{children}</strong>,
                    em:         ({ children }) => <em className="italic text-lightgrey">{children}</em>,
                    ul:         ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1 pl-1 text-lightgrey font-medium group-hover:text-offwhite transition-colors">{children}</ul>,
                    ol:         ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1 pl-1 text-lightgrey font-medium group-hover:text-offwhite transition-colors">{children}</ol>,
                    li:         ({ children }) => <li className="leading-relaxed">{children}</li>,
                    h1:         ({ children }) => <h1 className="text-base font-black text-offwhite mt-2 mb-0.5">{children}</h1>,
                    h2:         ({ children }) => <h2 className="text-sm font-bold text-offwhite mt-2 mb-0.5">{children}</h2>,
                    h3:         ({ children }) => <h3 className="text-sm font-semibold text-offwhite mt-1 mb-0.5">{children}</h3>,
                    code:       ({ children }) => <code className="px-1 py-0.5 bg-white/10 rounded text-xs font-mono text-tertiary">{children}</code>,
                    pre:        ({ children }) => <pre className="my-1 p-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono overflow-hidden">{children}</pre>,
                    a:          ({ children }) => <span className="text-tertiary underline underline-offset-2">{children}</span>,
                    hr:         () => <hr className="my-2 border-white/10" />,
                    blockquote: ({ children }) => <blockquote className="border-l-2 border-tertiary/40 pl-3 my-1 text-lightgrey/70 italic">{children}</blockquote>,
                }}
            >
                {body}
            </ReactMarkdown>
        </div>
    );
}
