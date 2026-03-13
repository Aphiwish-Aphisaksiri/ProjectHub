/* ChatBox component for handling user input and displaying chat messages.
- Maintains a list of messages in state, each with a role (user or assistant) and content.
- On sending a message, it optimistically adds the user's message to the chat and then sends the message and chat history to the backend.
- The backend response is expected to be a stream of text tokens, which are appended to the assistant's message in real-time.
- Includes loading state management to disable input while waiting for a response.
*/
"use client"
import { useState } from "react"

export default function ChatBox({ userId }: { userId: string }) {
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSend() {
        if (!input.trim() || loading) return

        const userMessage = { role: "user", content: input }
        const updatedHistory = [...messages, userMessage]
        setMessages(updatedHistory)
        setInput("")
        setLoading(true)

        setMessages(prev => [...prev, { role: "assistant", content: "" }])

        const controller = new AbortController()  // ← add this

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    message: input,
                    history: messages
                }),
                signal: controller.signal  // ← and this
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
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4 p-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`rounded-lg px-4 py-2 max-w-[70%] ${
                            msg.role === "user" ? "bg-secondary text-offwhite" : " text-offwhite"
                        }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-2 p-4 border-t">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    placeholder="Ask about your projects..."
                    className="flex-1 border rounded-lg px-4 py-2"
                    disabled={loading}
                />
                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="px-4 py-2 bg-secondary text-offwhite rounded-lg disabled:opacity-50"
                >
                    {loading ? "..." : "Send"}
                </button>
            </div>
        </div>
    )
}