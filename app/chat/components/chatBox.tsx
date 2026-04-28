"use client"
import React, { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type ToolCall = {
    name: string
    args: Record<string, unknown>
    done: boolean
}

type ConfirmData =
    | { type: "delete_task";    taskId: string; taskNumber: number; taskTitle: string; projectTitle: string }
    | { type: "delete_note";    noteId: string; noteTitle: string; projectTitle: string }
    | { type: "delete_project"; projectId: string; projectTitle: string; taskCount: number; noteCount: number }

type Message = {
    role: "user" | "assistant" | "error"
    content: string
    thinkingContent?: string
    modelName?: string
    thinkingEnabled?: boolean
    toolCalls?: ToolCall[]
    notices?: string[]
    pendingActions?: ConfirmData[]
}

type OllamaModel = {
    name: string
    sizeGb: number
    thinkingSupported?: boolean
}

function getToolLabel(name: string, args: Record<string, unknown>): string {
    const suffix =
        typeof args.query === "string" ? ` — "${args.query}"`
        : typeof args.intent === "string" ? ` — ${args.intent.replace(/_/g, " ")}`
        : ""
    if (name === "search_project_data") return `Searching your projects${suffix}`
    if (name === "query_structured_data") return `Querying project data${suffix}`
    if (name === "create_task") return `Creating task "${args.title ?? ""}"`
    if (name === "update_task") return `Updating task #${args.task_number ?? ""}`
    if (name === "delete_task") return `Staging deletion of task #${args.task_number ?? ""}`
    if (name === "delete_note") return `Staging deletion of note "${args.note_title ?? ""}"`
    if (name === "delete_project") return `Staging deletion of project "${args.project_name ?? ""}"`
    if (name === "create_note") return `Creating note "${args.title ?? ""}"`
    if (name === "update_note") return `Updating note "${args.note_title ?? ""}"`
    if (name === "update_project") return `Updating project "${args.project_name ?? ""}"`
    return name
}

function ToolCallBlock({ toolCalls }: { toolCalls: ToolCall[] }) {
    return (
        <div className="mb-2 space-y-1.5">
            {toolCalls.map((call, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                    {call.done
                        ? <span className="text-tertiary text-[10px] leading-none">✓</span>
                        : <span className="inline-block w-2.5 h-2.5 border border-tertiary/70 border-t-transparent rounded-full animate-spin shrink-0" />
                    }
                    <span className={call.done ? "text-lightgrey/40" : "text-lightgrey/60"}>
                        {getToolLabel(call.name, call.args)}{call.done ? "" : "..."}
                    </span>
                </div>
            ))}
        </div>
    )
}

function ThinkingIndicator() {
    return (
        <div className="flex items-center gap-1.5 py-1">
            <span className="w-2 h-2 bg-offwhite/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-offwhite/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-offwhite/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
    )
}

function ThinkingBlock({ content }: { content: string }) {
    const [expanded, setExpanded] = useState(false)
    return (
        <div className="mb-2">
            <button
                onClick={() => setExpanded(prev => !prev)}
                className="flex items-center gap-1.5 text-xs text-lightgrey/60 hover:text-lightgrey transition-colors"
            >
                <span className="text-tertiary/80">✦</span>
                <span>{expanded ? "Hide" : "Show"} thinking</span>
                <span className="text-[10px]">{expanded ? "▲" : "▼"}</span>
            </button>
            {expanded && (
                <div className="mt-2 px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-lightgrey/70 leading-relaxed font-mono whitespace-pre-wrap">
                    {content}
                </div>
            )}
        </div>
    )
}

function ConfirmActionCard({ data, onResolved }: { data: ConfirmData; onResolved: () => void }) {
    const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")
    const [errorMsg, setErrorMsg] = useState("")

    async function handleConfirm() {
        setState("loading")
        try {
            let url = ""
            let body: Record<string, unknown> = {}
            if (data.type === "delete_task") {
                url = "/api/tasks"
                body = { taskId: data.taskId }
            } else if (data.type === "delete_note") {
                url = "/api/notes"
                body = { noteId: data.noteId }
            } else {
                url = "/api/projects"
                body = { projectId: data.projectId }
            }

            const res = await fetch(url, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            if (!res.ok) {
                const resBody = await res.json().catch(() => ({}))
                setErrorMsg(resBody.error ?? "Delete failed.")
                setState("error")
                return
            }
            setState("done")
            setTimeout(onResolved, 2000)
        } catch {
            setErrorMsg("Network error. Please try again.")
            setState("error")
        }
    }

    // ── Resolved label ────────────────────────────────────────────────────
    if (state === "done") {
        const label =
            data.type === "delete_task"    ? `Task #${data.taskNumber} \u201c${data.taskTitle}\u201d deleted.`
            : data.type === "delete_note"   ? `Note \u201c${data.noteTitle}\u201d deleted.`
            : `Project \u201c${data.projectTitle}\u201d and all its contents deleted.`
        return (
            <div className="my-2 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-xs text-green-300">
                {label}
            </div>
        )
    }

    // ── Warning body ──────────────────────────────────────────────────────
    const isProject = data.type === "delete_project"
    const header = isProject ? "\u26a0 Permanent Deletion — Cannot Be Undone" : "\u26a0 Confirm Deletion"

    let description: React.ReactNode
    if (data.type === "delete_task") {
        description = (
            <p className="text-lightgrey/80 leading-relaxed">
                Task #{data.taskNumber} &mdash; &ldquo;{data.taskTitle}&rdquo;
                <br /><span className="text-lightgrey/50">Project: {data.projectTitle}</span>
            </p>
        )
    } else if (data.type === "delete_note") {
        description = (
            <p className="text-lightgrey/80 leading-relaxed">
                Note &ldquo;{data.noteTitle}&rdquo;
                <br /><span className="text-lightgrey/50">Project: {data.projectTitle}</span>
            </p>
        )
    } else {
        description = (
            <p className="text-lightgrey/80 leading-relaxed">
                Project &ldquo;{data.projectTitle}&rdquo;
                <br />
                <span className="text-red-300/80">
                    {data.taskCount} task{data.taskCount !== 1 ? "s" : ""} and {data.noteCount} note{data.noteCount !== 1 ? "s" : ""} will also be permanently deleted.
                </span>
            </p>
        )
    }

    return (
        <div className={`my-2 rounded-2xl border px-4 py-3 text-xs space-y-2 ${
            isProject ? "border-red-500/50 bg-red-500/15" : "border-red-500/30 bg-red-500/10"
        }`}>
            <div className="flex items-center gap-1.5 text-red-300 font-semibold">
                <span>&#9888;</span> {header}
            </div>
            {description}
            {state === "error" && <p className="text-red-400">{errorMsg}</p>}
            <div className="flex gap-2 pt-1">
                <button
                    onClick={onResolved}
                    disabled={state === "loading"}
                    className="px-3 py-1.5 rounded-xl border border-white/10 text-lightgrey hover:bg-white/10 transition-colors disabled:opacity-40"
                >
                    Cancel
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={state === "loading"}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors disabled:opacity-40"
                >
                    {state === "loading" ? "Deleting..." : isProject ? "Delete Project" : data.type === "delete_note" ? "Delete Note" : "Delete Task"}
                </button>
            </div>
        </div>
    )
}

function NoticeBlock({ notices }: { notices: string[] }) {
    return (
        <div className="mb-2 space-y-1.5">
            {notices.map((notice, index) => (
                <div
                    key={`${notice}-${index}`}
                    className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100/90"
                >
                    {notice}
                </div>
            ))}
        </div>
    )
}

function ModelBadge({ modelName }: { modelName: string }) {
    // Show just the model name without the tag e.g. "qwen3.5:9b" → "qwen3.5 9b"
    const display = modelName.replace(":", " ")
    return (
        <span className="inline-block text-[10px] text-lightgrey/40 font-mono mb-1">
            {display}
        </span>
    )
}

export default function ChatBox({ userId }: { userId: string | null }) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [models, setModels] = useState<OllamaModel[]>([])
    const [selectedModel, setSelectedModel] = useState("qwen3.5:9b")
    const [thinkingEnabled, setThinkingEnabled] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const selectedModelMeta = models.find(model => model.name === selectedModel)

    // Clear messages when userId changes
    useEffect(() => {
        setMessages([])
    }, [userId])

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Abort in-flight request on unmount
    useEffect(() => {
        return () => { abortControllerRef.current?.abort() }
    }, [])

    useEffect(() => {
        if (selectedModelMeta?.thinkingSupported === false && thinkingEnabled) {
            setThinkingEnabled(false)
        }
    }, [selectedModelMeta, thinkingEnabled])

    // Fetch available models from backend
    useEffect(() => {
        fetch("/api/models")
            .then(res => res.json())
            .then(data => {
                // Filter out embedding models
                const chatModels = data.models.filter(
                    (m: OllamaModel) => !m.name.includes("embed")
                )
                setModels(chatModels)
                if (chatModels.length > 0) setSelectedModel(chatModels[0].name)
            })
            .catch(() => {}) // silently fail, default model still works
    }, [])

    async function handleSend() {
        if (!input.trim() || loading || !userId) return

        abortControllerRef.current?.abort()
        const controller = new AbortController()
        abortControllerRef.current = controller

        const userMessage: Message = { role: "user", content: input }
        setMessages(prev => [...prev, userMessage, {
            role: "assistant",
            content: "",
            thinkingContent: "",
            modelName: selectedModel,
            thinkingEnabled,
        }])
        setInput("")
        // Reset textarea height after clearing
        const textarea = document.querySelector<HTMLTextAreaElement>(".chatInputTextarea")
        if (textarea) { textarea.style.height = "auto" }
        setLoading(true)

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    message: input,
                    history: messages,
                    modelName: selectedModel,
                    thinkingEnabled,
                }),
                signal: controller.signal,
                cache: "no-store",
            })

            if (!res.ok) {
                let errorMsg = res.status === 401
                    ? "Please sign in to use the chat."
                    : "Something went wrong. Please try again."

                try {
                    const errorBody = await res.json()
                    if (typeof errorBody?.detail === "string" && errorBody.detail.trim()) {
                        errorMsg = errorBody.detail
                    }
                } catch {}

                setMessages(prev => {
                    const updated = [...prev]
                    updated[updated.length - 1] = { role: "error", content: errorMsg }
                    return updated
                })
                return
            }

            const reader = res.body?.getReader()
            const decoder = new TextDecoder()
            let done = false
            let buffer = ""

            while (reader && !done) {
                const result = await reader.read()
                done = result.done
                if (result.value) {
                    buffer += decoder.decode(result.value, { stream: true })

                    // Split on \x1e (ASCII Record Separator) — sentinels are framed
                    // with \x1e...\x1e so content (including real \n) passes through intact
                    const frames = buffer.split("\x1e")
                    buffer = frames.pop() ?? ""

                    for (const chunk of frames) {
                        if (!chunk) continue
                        processChunk(chunk)
                    }
                }
            }

            // Process any remaining buffer content
            if (buffer) processChunk(buffer)

        } catch (err: unknown) {
            if (err instanceof Error && err.name === "AbortError") return
            setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                    role: "error",
                    content: "Connection lost. Please try again.",
                }
                return updated
            })
        } finally {
            setLoading(false)
        }
    }

    function processChunk(chunk: string) {
        if (chunk.startsWith("__THINKING__")) {
            const thought = JSON.parse(chunk.replace("__THINKING__", ""))
            setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                updated[updated.length - 1] = {
                    ...last,
                    thinkingContent: (last.thinkingContent ?? "") + thought,
                }
                return updated
            })
        } else if (chunk.startsWith("__NOTICE__")) {
            const notice = JSON.parse(chunk.replace("__NOTICE__", "")) as string
            setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                updated[updated.length - 1] = {
                    ...last,
                    notices: [...(last.notices ?? []), notice],
                }
                return updated
            })
        } else if (chunk.startsWith("__TOOLCALL__")) {
            // Emitted BEFORE the tool executes — show indicator immediately
            const call = JSON.parse(chunk.replace("__TOOLCALL__", "")) as { name: string; args: Record<string, unknown> }
            setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                updated[updated.length - 1] = {
                    ...last,
                    toolCalls: [...(last.toolCalls ?? []), { name: call.name, args: call.args, done: false }],
                }
                return updated
            })
        } else if (chunk.startsWith("__METRICS__")) {
            // Metrics handled server-side, ignore on frontend
        } else if (chunk.startsWith("__CONFIRM_REQUIRED__")) {
            const confirmData = JSON.parse(chunk.replace("__CONFIRM_REQUIRED__", "")) as ConfirmData
            setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                updated[updated.length - 1] = {
                    ...last,
                    pendingActions: [...(last.pendingActions ?? []), confirmData],
                }
                return updated
            })
        } else {
            // First content token — mark all in-flight tool calls as done
            setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                updated[updated.length - 1] = {
                    ...last,
                    toolCalls: last.toolCalls?.map(tc => ({ ...tc, done: true })),
                    content: last.content + chunk,
                }
                return updated
            })
        }
    }

    return (
        <div className="flex flex-col min-h-full">
            {/* Messages area */}
            <div className="messageArea flex-1 overflow-y-auto space-y-3 px-6 pb-6 flex flex-col">
                {messages.length === 0 && (
                    <div className="guidePlaceholder flex flex-col flex-1 items-center justify-center gap-5 text-center px-4">
                        {!userId ? (
                            <>
                                {/* Access Restricted */}
                                <div className="bg-secondary/20 backdrop-blur-md p-10 rounded-4xl border border-white/10 max-w-2xl w-full text-center">
                                    <div className="bg-red/20 text-red-400 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red/10 border border-red/30">
                                        <span className="text-4xl leading-none">✦</span>
                                    </div>
                                    <h2 className="text-3xl font-bold text-offwhite mb-3 tracking-tight">Access Restricted</h2>
                                    <p className="text-lightgrey mb-8 text-lg">You must be signed in to use the AI assistant.</p>
                                    <a href="/user/signin" className="inline-block px-8 py-4 bg-tertiary hover:opacity-90 text-offblack font-bold rounded-2xl transition-all shadow-lg shadow-tertiary/20">
                                        Sign In Now
                                    </a>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Icon */}
                                <div className="w-16 h-16 rounded-2xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center">
                                    <span className="text-2xl">✦</span>
                                </div>
                                {/* Intro message */}
                                <p className="text-offwhite font-medium text-sm max-w-md leading-relaxed">
                                    Hi, I&apos;m <strong>Hubboi</strong> — your ProjectHub assistant. I can search, query, create, and edit anything in your workspace. Just tell me what to do.
                                </p>
                                {/* Suggested prompt chips */}
                                <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                                    {[
                                        "What are the tasks in my FitFlow project?",
                                        "Which project was about carbon emissions?",
                                        "Create a new task in ProjectHub called Set up CI pipeline",
                                        "Show me all high priority tasks across my projects",
                                    ].map((prompt) => (
                                        <button
                                            key={prompt}
                                            type="button"
                                            onClick={() => setInput(prompt)}
                                            className="bg-secondary/30 border border-white/10 hover:bg-secondary/50 hover:border-tertiary/30 text-lightgrey text-xs rounded-xl px-3 py-2 transition-colors cursor-pointer"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                        {/* Model badge — only on assistant messages */}
                        {msg.role === "assistant" && msg.modelName && (
                            <ModelBadge modelName={msg.modelName} />
                        )}
                        <div className={`px-5 py-3 max-w-[85%] text-sm font-medium leading-relaxed ${
                            msg.role === "user"
                                ? "bg-tertiary/20 text-offwhite border border-tertiary/20 rounded-3xl rounded-br-md backdrop-blur-sm whitespace-pre-wrap"
                                : msg.role === "error"
                                ? "bg-red/10 text-red-400 border border-red/20 rounded-3xl rounded-bl-md"
                                : "bg-secondary/40 text-offwhite border border-white/5 rounded-3xl rounded-bl-md backdrop-blur-xl"
                        }`}>
                            {/* Thinking block — collapsed by default */}
                            {msg.role === "assistant" && msg.thinkingContent && (
                                <ThinkingBlock content={msg.thinkingContent} />
                            )}
                            {msg.role === "assistant" && msg.notices && msg.notices.length > 0 && (
                                <NoticeBlock notices={msg.notices} />
                            )}
                            {/* Tool call indicators — show as soon as LLM decides to search */}
                            {msg.role === "assistant" && msg.toolCalls && msg.toolCalls.length > 0 && (
                                <ToolCallBlock toolCalls={msg.toolCalls} />
                            )}
                            {/* Confirmation cards for destructive actions — one per staged deletion */}
                            {msg.role === "assistant" && msg.pendingActions?.map((action, actionIdx) => (
                                <ConfirmActionCard
                                    key={actionIdx}
                                    data={action}
                                    onResolved={() => {
                                        setMessages(prev => prev.map((m, idx) =>
                                            idx === i
                                                ? { ...m, pendingActions: m.pendingActions?.filter((_, j) => j !== actionIdx) }
                                                : m
                                        ))
                                    }}
                                />
                            ))}
                            {/* Message content */}
                            {msg.role === "assistant" && msg.content === "" && loading && !msg.toolCalls?.length
                                ? <ThinkingIndicator />
                                : msg.role === "assistant"
                                ? <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        p:      ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                        strong: ({ children }) => <strong className="font-bold text-offwhite">{children}</strong>,
                                        em:     ({ children }) => <em className="italic text-lightgrey">{children}</em>,
                                        ul:     ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 pl-1">{children}</ul>,
                                        ol:     ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 pl-1">{children}</ol>,
                                        li:     ({ children }) => <li className="leading-relaxed">{children}</li>,
                                        h1:     ({ children }) => <h1 className="text-base font-bold text-offwhite mt-3 mb-1">{children}</h1>,
                                        h2:     ({ children }) => <h2 className="text-sm font-bold text-offwhite mt-3 mb-1">{children}</h2>,
                                        h3:     ({ children }) => <h3 className="text-sm font-semibold text-offwhite mt-2 mb-1">{children}</h3>,
                                        code:   ({ children }) => <code className="px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono text-tertiary">{children}</code>,
                                        pre:    ({ children }) => <pre className="my-2 p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-mono overflow-x-auto">{children}</pre>,
                                        a:      ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-tertiary underline underline-offset-2 hover:text-tertiary/80">{children}</a>,
                                        hr:     () => <hr className="my-3 border-white/10" />,
                                        blockquote: ({ children }) => <blockquote className="border-l-2 border-tertiary/40 pl-3 my-2 text-lightgrey/70 italic">{children}</blockquote>,
                                    }}
                                  >{msg.content}</ReactMarkdown>
                                : msg.content
                            }
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="w-full max-w-3xl mx-auto mt-0 mb-4">
                <div className="flex flex-col bg-secondary/40 backdrop-blur-xl border border-white/10 rounded-3xl p-2 shadow-2xl shadow-black/30">
                    {/* Textarea */}
                    <textarea
                        value={input}
                        onChange={e => {
                            setInput(e.target.value)
                            e.target.style.height = "auto"
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 320)}px`
                        }}
                        onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        placeholder={!userId ? "Sign in to chat..." : messages.length === 0 ? "Ask about your projects..." : "Reply..."}
                        rows={1}
                        className="chatInputTextarea flex rounded-2xl px-4 pt-3 pb-2 mx-2 mt-2 bg-transparent text-offwhite placeholder:text-lightgrey/50 focus:outline-none text-sm font-medium resize-none overflow-y-auto leading-relaxed"
                        style={{ maxHeight: "320px" }}
                        disabled={loading || !userId}
                    />

                    {/* Right column: model selector, thinking toggle, send button */}
                    <div className="flex flex-row items-center justify-end gap-1.5 shrink-0">
                        {/* Thinking toggle */}
                        <button
                            onClick={() => {
                                if (selectedModelMeta?.thinkingSupported === false) return
                                setThinkingEnabled(prev => !prev)
                            }}
                            disabled={loading || selectedModelMeta?.thinkingSupported === false}
                            title={selectedModelMeta?.thinkingSupported === false ? "This model does not support thinking mode reliably." : undefined}
                            className={`flex items-center gap-1.5 text-xs px-2 py-2 rounded-xl transition-all disabled:opacity-50 ${
                                thinkingEnabled
                                    ? "bg-green/20 text-offwhite/50 hover:bg-green/10"
                                    : "border-white/10 text-lightgrey hover:bg-offwhite/10"
                            }`}
                        >
                            <span className="text-[12px]">✦</span>
                            Thinking {selectedModelMeta?.thinkingSupported === false ? "unsupported" : thinkingEnabled ? "on" : "off"}
                        </button>

                        {/* Model selector */}
                        <select
                            value={selectedModel}
                            onChange={e => setSelectedModel(e.target.value)}
                            disabled={loading}
                            className="text-lightgrey text-xs rounded-xl px-2 py-2 focus:outline-none focus:border-tertiary/40 transition-colors disabled:opacity-50 max-w-36 hover:bg-offwhite/10"
                        >
                            {models.length > 0 ? (
                                models.map(m => (
                                    <option key={m.name} value={m.name} className="bg-secondary/80 text-offwhite">
                                        {m.name} ({m.sizeGb}GB)
                                    </option>
                                ))
                            ) : (
                                <option value={selectedModel} className="bg-primary text-offwhite">
                                    {selectedModel}
                                </option>
                            )}
                        </select>

                        {/* Send button */}
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim() || !userId}
                            className="px-6 py-3 bg-tertiary hover:opacity-90 text-offblack font-black rounded-2xl transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-40 disabled:scale-100 shadow-lg shadow-tertiary/20 text-sm"
                        >
                            {loading ? "..." : "Send"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}