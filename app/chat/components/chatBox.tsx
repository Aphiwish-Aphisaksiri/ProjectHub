/* ChatBox component for handling user input and displaying chat messages.
- Maintains a list of messages in state, each with a role (user or assistant) and content.
- On sending a message, it optimistically adds the user's message to the chat and then sends the message and chat history to the backend.
- The backend response is expected to be a stream of text tokens, which are appended to the assistant's message in real-time.
- Includes loading state management to disable input while waiting for a response.
- Auto-scrolls to the latest message as tokens stream in.
- Displays a thinking indicator while waiting for the first token from the AI.
*/
"use client"
import { useState, useEffect, useRef } from "react"

type Message = { role: "user" | "assistant" | "error"; content: string }

function ThinkingIndicator() {
    return (
        <div className="flex items-center gap-1.5 py-1">
            <span className="w-2 h-2 bg-offwhite/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-offwhite/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-offwhite/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
    )
}

export default function ChatBox({ userId }: { userId: string }) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    // Clear messages when userId changes (e.g., on logout/login)
    useEffect(() => {
        setMessages([])
    }, [userId])

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Abort in-flight request on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort()
        }
    }, [])

    async function handleSend() {
        if (!input.trim() || loading) return

        // Abort any previous in-flight request
        abortControllerRef.current?.abort()
        const controller = new AbortController()
        abortControllerRef.current = controller

        const userMessage: Message = { role: "user", content: input }
        setMessages(prev => [...prev, userMessage, { role: "assistant", content: "" }])
        setInput("")
        setLoading(true)

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    message: input,
                    history: messages,
                }),
                signal: controller.signal,
            })

            if (!res.ok) {
                const errorMsg = res.status === 401
                    ? "Please sign in to use the chat."
                    : "Something went wrong. Please try again."
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

            while (reader && !done) {
                const result = await reader.read()
                done = result.done
                if (result.value) {
                    const token = decoder.decode(result.value, { stream: true })
                    setMessages(prev => {
                        const updated = [...prev]
                        updated[updated.length - 1] = {
                            ...updated[updated.length - 1],
                            content: updated[updated.length - 1].content + token,
                        }
                        return updated
                    })
                }
            }
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

    return (
        <div className="flex flex-col h-full justify-between">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 pb-28">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`rounded-lg px-4 py-2 max-w-[90%] ${
                            msg.role === "user"
                                ? "bg-secondary text-offwhite font-semibold"
                                : msg.role === "error"
                                ? "bg-red/20 text-red font-medium"
                                : "text-offwhite font-bold"
                        }`}>
                            {/* Show thinking indicator for empty assistant messages while loading */}
                            {msg.role === "assistant" && msg.content === "" && loading
                                ? <ThinkingIndicator />
                                : msg.content
                            }
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Unified input bar — always visible at the bottom */}
            <div className="fixed left-0 right-0 bottom-0 z-50 flex justify-center bg-primary px-4 py-3">
                <div className="w-full max-w-3xl bg-secondary rounded-2xl flex gap-2 p-3">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                        placeholder={messages.length === 0 ? "Ask about your projects..." : "Reply..."}
                        className="flex-1 rounded-lg px-4 py-2 bg-transparent text-offwhite placeholder:text-lightgrey/60 focus:outline-none"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="px-4 py-2 bg-green hover:bg-green/50 transition-colors text-offwhite rounded-lg disabled:opacity-50"
                    >
                        {loading ? "..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    )
}