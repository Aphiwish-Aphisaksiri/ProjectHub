import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ContentBoxProps = {
    body: string;
};

export default function ContentBox({ body }: ContentBoxProps) {
    return (
        <div className="rounded-4xl border border-white/6 bg-primary-950/50 p-8 shadow-inner shadow-black/10">
            <div className="prose-custom text-lg leading-8 text-offwhite/90">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        p:      ({ children }) => <p className="mb-3 last:mb-0 leading-8">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold text-offwhite">{children}</strong>,
                        em:     ({ children }) => <em className="italic text-lightgrey">{children}</em>,
                        ul:     ({ children }) => <ul className="list-disc list-inside space-y-1.5 my-3 pl-1">{children}</ul>,
                        ol:     ({ children }) => <ol className="list-decimal list-inside space-y-1.5 my-3 pl-1">{children}</ol>,
                        li:     ({ children }) => <li className="leading-8">{children}</li>,
                        h1:     ({ children }) => <h1 className="text-2xl font-black text-offwhite mt-6 mb-2">{children}</h1>,
                        h2:     ({ children }) => <h2 className="text-xl font-bold text-offwhite mt-5 mb-2">{children}</h2>,
                        h3:     ({ children }) => <h3 className="text-lg font-semibold text-offwhite mt-4 mb-1">{children}</h3>,
                        code:   ({ children }) => <code className="px-1.5 py-0.5 bg-white/10 rounded text-sm font-mono text-tertiary">{children}</code>,
                        pre:    ({ children }) => <pre className="my-3 p-4 bg-white/5 border border-white/10 rounded-xl text-sm font-mono overflow-x-auto">{children}</pre>,
                        a:      ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-tertiary underline underline-offset-2 hover:text-tertiary/80">{children}</a>,
                        hr:     () => <hr className="my-4 border-white/10" />,
                        blockquote: ({ children }) => <blockquote className="border-l-2 border-tertiary/40 pl-4 my-3 text-lightgrey/70 italic">{children}</blockquote>,
                    }}
                >
                    {body}
                </ReactMarkdown>
            </div>
        </div>
    );
}
