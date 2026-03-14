/* ChatBox component for handling user input and displaying chat messages.
- Maintains a list of messages in state, each with a role (user or assistant) and content.
- On sending a message, it optimistically adds the user's message to the chat and then sends the message and chat history to the backend.
- The backend response is expected to be a stream of text tokens, which are appended to the assistant's message in real-time.
- Includes loading state management to disable input while waiting for a response.
*/
"use client"
import { useState, useEffect } from "react"

export default function ChatBox({ userId }: { userId: string }) {
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // Clear messages when userId changes (e.g., on logout/login)
        setMessages([])
    }, [userId])

    async function handleSend() {
        if (!input.trim() || loading) return

        const userMessage = { role: "user", content: input }
        const updatedHistory = [...messages, userMessage]
        setMessages(updatedHistory)
        setInput("")
        setLoading(true)

        setMessages(prev => [...prev, { role: "assistant", content: "" }])

        const controller = new AbortController()

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    message: input,
                    history: messages
                }),
                signal: controller.signal
            })

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
                            content: updated[updated.length - 1].content + token
                        }
                        return updated
                    })
                }
            }
        } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
            console.error(err)
        }
        } finally {
            setLoading(false)
        }

        return () => controller.abort()  // ← cleanup aborts the second StrictMode run
    }

    return (
        <div className="flex flex-col h-full justify-between">
            <div className="flex-1 overflow-y-auto space-y-4 p-4 pb-24">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`rounded-lg px-4 py-2 max-w-[90%] ${
                            msg.role === "user" ? "bg-secondary text-offwhite text-semibold" : " text-offwhite text-bold"
                        }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>
            {messages.length <= 0 ? (
                <div className="flex gap-2 p-4 rounded-2xl bg-secondary">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSend()}
                        placeholder="Ask about your projects..."
                        className="flex-1 rounded-lg px-4 py-2"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading}
                        className="px-4 py-2 bg-green text-offwhite rounded-lg disabled:opacity-50"
                    >
                        {loading ? "..." : "Send"}
                    </button>
                </div>
            ) : (
                <div className="fixed left-0 right-0 bottom-0 z-50 flex justify-center h-25 bg-primary">
                    <div className="w-full max-w-3xl bg-primary-800 rounded-2xl flex gap-2 p-4" style={{height: '72px'}}>
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSend()}
                            placeholder="Reply..."
                            className="flex-1 rounded-lg px-4 py-2 resize-none"
                            style={{height: '40px', minHeight: '40px', maxHeight: '80px'}}
                            disabled={loading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading}
                            className="px-4 py-2 bg-green hover:bg-green/50 transition-colors text-offwhite rounded-lg disabled:opacity-50"
                        >
                            {loading ? "..." : "Send"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}