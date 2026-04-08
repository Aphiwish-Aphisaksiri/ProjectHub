import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownPreviewProps = {
    body: string;
    compact?: boolean;
};

export default function MarkdownPreview({ body, compact = false }: MarkdownPreviewProps) {
    return (
        <div
            className={
                compact
                    ? "relative overflow-hidden max-h-10 mask-[linear-gradient(to_bottom,black_50%,transparent_100%)]"
                    : "relative overflow-hidden max-h-48 mb-8 mask-[linear-gradient(to_bottom,black_70%,transparent_100%)]"
            }
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p:          ({ children }) => <p className={`last:mb-0 text-lightgrey leading-relaxed group-hover:text-offwhite transition-colors ${compact ? "text-xs" : "mb-1.5 font-medium"}`}>{children}</p>,
                    strong:     ({ children }) => <strong className="font-bold text-offwhite">{children}</strong>,
                    em:         ({ children }) => <em className="italic text-lightgrey">{children}</em>,
                    ul:         ({ children }) => <ul className={`list-disc list-inside pl-1 text-lightgrey group-hover:text-offwhite transition-colors ${compact ? "text-xs space-y-0 my-0" : "space-y-0.5 my-1 font-medium"}`}>{children}</ul>,
                    ol:         ({ children }) => <ol className={`list-decimal list-inside pl-1 text-lightgrey group-hover:text-offwhite transition-colors ${compact ? "text-xs space-y-0 my-0" : "space-y-0.5 my-1 font-medium"}`}>{children}</ol>,
                    li:         ({ children }) => <li className="leading-relaxed">{children}</li>,
                    h1:         ({ children }) => <h1 className={`font-black text-offwhite ${compact ? "text-xs mt-0 mb-0" : "text-base mt-2 mb-0.5"}`}>{children}</h1>,
                    h2:         ({ children }) => <h2 className={`font-bold text-offwhite ${compact ? "text-xs mt-0 mb-0" : "text-sm mt-2 mb-0.5"}`}>{children}</h2>,
                    h3:         ({ children }) => <h3 className={`font-semibold text-offwhite ${compact ? "text-xs mt-0 mb-0" : "text-sm mt-1 mb-0.5"}`}>{children}</h3>,
                    code:       ({ children }) => <code className="px-1 py-0.5 bg-white/10 rounded text-xs font-mono text-tertiary">{children}</code>,
                    pre:        ({ children }) => <pre className={`bg-white/5 border border-white/10 font-mono overflow-hidden ${compact ? "text-xs p-1 my-0 rounded" : "text-xs p-2 my-1 rounded-lg"}`}>{children}</pre>,
                    a:          ({ children }) => <span className="text-tertiary underline underline-offset-2">{children}</span>,
                    hr:         () => <hr className="my-2 border-white/10" />,
                    blockquote: ({ children }) => <blockquote className={`border-l-2 border-tertiary/40 pl-3 text-lightgrey/70 italic ${compact ? "my-0" : "my-1"}`}>{children}</blockquote>,
                }}
            >
                {body}
            </ReactMarkdown>
        </div>
    );
}
