import { prisma } from "@/lib/prisma"
import { formatDistanceToNow } from "date-fns"

export default async function ChatLogPage() {
    const logs = await prisma.chatLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
    })

    const avgTokensPerSecond = logs.length
        ? (logs.reduce((sum, l) => sum + l.tokensPerSecond, 0) / logs.length).toFixed(1)
        : "—"

    const avgDuration = logs.length
        ? (logs.reduce((sum, l) => sum + l.totalDurationMs, 0) / logs.length / 1000).toFixed(2)
        : "—"

    const totalTokens = logs.reduce((sum, l) => sum + l.promptTokens + l.completionTokens, 0)

    const avgResultCount = logs.length
        ? (logs.reduce((sum, l) => sum + l.resultCount, 0) / logs.length).toFixed(1)
        : "—"

    return (
        <div className="min-h-screen bg-primary text-offwhite p-8 flex flex-col gap-8">

            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-offwhite">Chat log monitor</h1>
                <p className="text-lightgrey text-sm">{logs.length} most recent requests</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Avg tokens / sec" value={avgTokensPerSecond} />
                <StatCard label="Avg response time" value={`${avgDuration}s`} />
                <StatCard label="Total tokens used" value={totalTokens.toLocaleString()} />
                <StatCard label="Avg context hits" value={avgResultCount} />
            </div>

            {/* Log table */}
            <div className="flex flex-col gap-3">
                {logs.length === 0 ? (
                    <p className="text-lightgrey text-sm">No chat logs yet — send a message to the chatbot first.</p>
                ) : (
                    logs.map((log) => (
                        <div
                            key={log.id}
                            className="bg-secondary/20 border border-lightgrey/10 rounded-lg p-4 flex flex-col gap-3"
                        >
                            {/* Query row */}
                            <div className="flex flex-col gap-1">
                                <div className="flex flex-row items-center justify-between gap-4">
                                    <p className="text-offwhite text-sm font-bold truncate max-w-[60%]">
                                        {log.query}
                                    </p>
                                    <p className="text-lightgrey text-xs whitespace-nowrap">
                                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                                {log.extractedQuery !== log.query && (
                                    <p className="text-tertiary text-xs">
                                        Extracted: <span className="text-lightgrey">{log.extractedQuery}</span>
                                    </p>
                                )}
                            </div>

                            {/* Metrics row */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <Metric label="Duration" value={`${(log.totalDurationMs / 1000).toFixed(2)}s`} />
                                <Metric label="Tokens/sec" value={log.tokensPerSecond.toFixed(1)} />
                                <Metric label="Prompt tokens" value={log.promptTokens} />
                                <Metric label="Completion tokens" value={log.completionTokens} />
                                <Metric label="Context hits" value={`${log.resultCount} / threshold ${log.threshold}`} />
                            </div>

                            {/* Sources + scores row */}
                            {log.contextSources.length > 0 && (
                                <div className="flex flex-row items-center gap-3 flex-wrap">
                                    <p className="text-lightgrey text-xs">Sources:</p>
                                    {log.contextSources.map((source, i) => (
                                        <SourceBadge key={i} source={source} />
                                    ))}
                                    {log.similarityScores.length > 0 && (
                                        <p className="text-lightgrey text-xs ml-2">
                                            Scores: {log.similarityScores.map(s => s.toFixed(2)).join(", ")}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="bg-secondary/20 border border-lightgrey/10 rounded-lg p-4 flex flex-col gap-1">
            <p className="text-lightgrey text-xs font-bold uppercase tracking-wide">{label}</p>
            <p className="text-offwhite text-2xl font-bold">{value}</p>
        </div>
    )
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex flex-col gap-0.5">
            <p className="text-lightgrey text-[11px] uppercase tracking-wide">{label}</p>
            <p className="text-offwhite text-sm font-bold">{value}</p>
        </div>
    )
}

function SourceBadge({ source }: { source: string }) {
    const colors: Record<string, string> = {
        project: "bg-secondary/40 text-tertiary",
        task: "bg-green/20 text-green",
        note: "bg-lightgrey/10 text-lightgrey",
    }
    return (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${colors[source] ?? "bg-lightgrey/10 text-lightgrey"}`}>
            {source}
        </span>
    )
}