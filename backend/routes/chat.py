from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from embeddings import get_embedding
from db import get_pool, log_chat
import httpx
import json
import os
import asyncio

router = APIRouter(prefix="/chat", tags=["chat"])

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
DEFAULT_MODEL = "qwen3.5:9b"
MAX_TOOL_ITERATIONS = 5
SIMILARITY_THRESHOLD = 0.4

# ─── Model capability cache ───────────────────────────────────────────────────
# Populated on first use per model — Ollama's /api/show returns a "capabilities"
# list that includes "tools" only for models that genuinely support tool calling.
# Caching avoids an extra HTTP round-trip on every chat request.
#
# BLOCKLIST: Some models declare "tools" capability in their Ollama modelfile but
# use a non-standard chat template (e.g. Mistral v0.3 uses its own [TOOL_CALLS]
# tokens). Ollama doesn't fully bridge this format, so tool call responses end up
# in message.content as raw text instead of message.tool_calls — causing the loop
# to exit with zero context and the model to hallucinate. These models are forced
# onto the RAG fallback path regardless of what /api/show reports.

_tools_capable_cache: dict[str, bool] = {}

# Model name prefixes that self-report tools but have unreliable Ollama tool output.
# Match by prefix so "mistral:7b", "mistral:latest", "mistral:v0.3" etc. all match.
_TOOLS_UNRELIABLE_PREFIXES = ("mistral",)

async def model_supports_tools(model: str) -> bool:
    if model in _tools_capable_cache:
        return _tools_capable_cache[model]
    # Check blocklist first — no need to hit the API for known-broken models
    model_base = model.split(":")[0].lower()
    if any(model_base.startswith(prefix) for prefix in _TOOLS_UNRELIABLE_PREFIXES):
        _tools_capable_cache[model] = False
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.post(f"{OLLAMA_URL}/api/show", json={"name": model})
            capable = "tools" in res.json().get("capabilities", [])
    except Exception:
        capable = False
    _tools_capable_cache[model] = capable
    return capable

class ChatRequest(BaseModel):
    userId: str
    message: str
    history: list[dict] = []
    modelName: str = DEFAULT_MODEL
    thinkingEnabled: bool = False

# ─── Tool schemas (sent to Ollama so the LLM can decide when to call them) ────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_project_data",
            "description": (
                "Semantically search through the user's projects, tasks, and notes "
                "using meaning-based similarity. Use this for vague, concept-based, "
                "or natural-language questions about project content."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The natural language search query"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum results to return (default 5, max 10)"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_structured_data",
            "description": (
                "Run a structured query for exact data: task counts, status filters, "
                "priority filters, due dates, or project metadata. Use this when the "
                "question is precise and structured rather than conceptual."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "intent": {
                        "type": "string",
                        "enum": [
                            "list_tasks_by_status",
                            "list_tasks_by_priority",
                            "count_tasks",
                            "get_project_details",
                            "get_notes_for_project"
                        ],
                        "description": "The type of structured query to run"
                    },
                    "project_name": {
                        "type": "string",
                        "description": "Project title to filter by (optional)"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["TODO", "IN_PROGRESS", "DONE", "ARCHIVED"],
                        "description": "Task status filter"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["LOW", "MEDIUM", "HIGH"],
                        "description": "Task priority filter"
                    }
                },
                "required": ["intent"]
            }
        }
    }
]

# ─── System prompt ────────────────────────────────────────────────────────────

def build_system_prompt() -> str:
    return """You are a helpful assistant for a project management app called ProjectHub.
You can only access the user's own projects.

You have two tools available:
- **search_project_data**: For semantic, meaning-based questions about project content (notes, task descriptions, project details). Use when the question is vague or conceptual.
- **query_structured_data**: For exact structured queries — task counts, status/priority filters, due dates, or listing project metadata.

Rules:
- ALWAYS call a tool before answering any question about the user's data
- You may call tools multiple times if the first result isn't sufficient
- Only answer from tool results — never fabricate project data
- If tool results are empty, tell the user clearly that nothing was found
- Reference project names directly in your answer

Formatting:
- Responses are rendered with react-markdown (GitHub Flavored Markdown)
- Use **bold** for project names, task names, and key terms
- Use bullet lists (- item) when enumerating tasks, features, or notes
- Use `inline code` for technical terms, slugs, or IDs
- Use ## headings only when the response is long enough to need clear sections
- Use GFM tables for structured comparisons when appropriate
- Do NOT wrap the entire response in a code block
- Do NOT use markdown for short one-liner answers — plain text is fine"""

# ─── RAG fallback prompt (for models without tool-calling capability) ───────────

def build_rag_messages(message: str, context_rows: list[dict], history: list[dict]) -> list[dict]:
    if context_rows:
        parts: list[str] = []
        seen: set = set()
        for row in context_rows:
            if row["projectId"] not in seen:
                seen.add(row["projectId"])
                parts.append(f"Project: {row['projectTitle']}")
            parts.append(f"- ({row['sourceTable']}) {row['textContent']}")
        context = "\n".join(parts)
    else:
        context = "No relevant projects found."

    system_content = f"""You are a helpful assistant for a project management app called ProjectHub.
You can only access the user's own projects.

Rules:
- Answer based ONLY on the context provided below
- If the context doesn't contain enough information, say so honestly
- If no relevant project was found, tell the user clearly
- Reference project names directly in your answer
- Never fabricate project data

Formatting:
- Responses are rendered with react-markdown (GitHub Flavored Markdown)
- Use **bold** for project names, task names, and key terms
- Use bullet lists (- item) when enumerating tasks, features, or notes
- Use `inline code` for technical terms, slugs, or IDs
- Use ## headings only when the response is long enough to need clear sections
- Use GFM tables for structured comparisons when appropriate
- Do NOT wrap the entire response in a code block
- Do NOT use markdown for short one-liner answers — plain text is fine

Context from user's projects:
{context}"""

    msgs = [{"role": "system", "content": system_content}]
    msgs += history[-10:]
    msgs.append({"role": "user", "content": message})
    return msgs

# ─── Vector search (tool executor) ───────────────────────────────────────────

async def search_user_projects(user_id: str, embedding: list[float], limit: int = 5) -> list[dict]:
    pool = await get_pool()
    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
    async with pool.acquire() as conn:
        rows = await conn.fetch(f"""
            SELECT
                v."textContent",
                v."sourceTable",
                v."sourceId",
                v."chunkIndex",
                p.title as "projectTitle",
                p.id as "projectId",
                1 - (v.embedding <=> '{embedding_str}'::vector) as similarity
            FROM "Vector" v
            JOIN "Project" p ON p.id = v."projectId"
            WHERE p."ownerId" = $1
            ORDER BY v.embedding <=> '{embedding_str}'::vector
            LIMIT $2
        """, user_id, limit)
        return [dict(row) for row in rows]

# ─── SQL queries (tool executor) ──────────────────────────────────────────────

async def run_structured_query(
    user_id: str,
    intent: str,
    project_name: str | None,
    status: str | None,
    priority: str | None
) -> str:
    pool = await get_pool()
    async with pool.acquire() as conn:
        if intent == "get_project_details":
            if project_name:
                rows = await conn.fetch("""
                    SELECT p.title, p.description, p.visibility, p."createdAt",
                           COUNT(DISTINCT t.id) as task_count,
                           COUNT(DISTINCT n.id) as note_count
                    FROM "Project" p
                    LEFT JOIN "Task" t ON t."projectId" = p.id
                    LEFT JOIN "Note" n ON n."projectId" = p.id
                    WHERE p."ownerId" = $1 AND LOWER(p.title) LIKE LOWER($2)
                    GROUP BY p.id, p.title, p.description, p.visibility, p."createdAt"
                """, user_id, f"%{project_name}%")
            else:
                rows = await conn.fetch("""
                    SELECT p.title, p.description, p.visibility, p."createdAt",
                           COUNT(DISTINCT t.id) as task_count,
                           COUNT(DISTINCT n.id) as note_count
                    FROM "Project" p
                    LEFT JOIN "Task" t ON t."projectId" = p.id
                    LEFT JOIN "Note" n ON n."projectId" = p.id
                    WHERE p."ownerId" = $1
                    GROUP BY p.id, p.title, p.description, p.visibility, p."createdAt"
                    ORDER BY p."createdAt" DESC
                """, user_id)
            if not rows:
                return "No projects found."
            parts = []
            for r in rows:
                parts.append(
                    f"Project: {r['title']} | {r['task_count']} tasks, {r['note_count']} notes"
                    f" | Visibility: {r['visibility']} | Created: {r['createdAt'].date()}"
                )
                if r["description"]:
                    parts.append(f"  Description: {r['description']}")
            return "\n".join(parts)

        elif intent in ("list_tasks_by_status", "list_tasks_by_priority"):
            params = [user_id]
            filters = ['p."ownerId" = $1']
            if status:
                params.append(status)
                filters.append(f't.status = ${len(params)}')
            if priority:
                params.append(priority)
                filters.append(f't.priority = ${len(params)}')
            if project_name:
                params.append(f"%{project_name}%")
                filters.append(f'LOWER(p.title) LIKE LOWER(${len(params)})')
            where = " AND ".join(filters)
            rows = await conn.fetch(f"""
                SELECT t."taskNumber", t.title, t.status, t.priority, t."dueDate", p.title as project
                FROM "Task" t
                JOIN "Project" p ON p.id = t."projectId"
                WHERE {where}
                ORDER BY t."taskNumber" DESC
                LIMIT 20
            """, *params)
            if not rows:
                return "No tasks found matching those filters."
            return "\n".join(
                f"[{r['project']}] #{r['taskNumber']} {r['title']} — {r['status']} / {r['priority']}"
                + (f" (due {r['dueDate'].date()})" if r["dueDate"] else "")
                for r in rows
            )

        elif intent == "count_tasks":
            params = [user_id]
            filters = ['p."ownerId" = $1']
            if status:
                params.append(status)
                filters.append(f't.status = ${len(params)}')
            if priority:
                params.append(priority)
                filters.append(f't.priority = ${len(params)}')
            if project_name:
                params.append(f"%{project_name}%")
                filters.append(f'LOWER(p.title) LIKE LOWER(${len(params)})')
            where = " AND ".join(filters)
            row = await conn.fetchrow(f"""
                SELECT COUNT(*) as total
                FROM "Task" t
                JOIN "Project" p ON p.id = t."projectId"
                WHERE {where}
            """, *params)
            label_parts = []
            if status: label_parts.append(status)
            if priority: label_parts.append(priority)
            if project_name: label_parts.append(f"in {project_name}")
            label = " ".join(label_parts) if label_parts else "total"
            return f"{row['total']} {label} task(s) found."

        elif intent == "get_notes_for_project":
            params = [user_id]
            filters = ['p."ownerId" = $1']
            if project_name:
                params.append(f"%{project_name}%")
                filters.append(f'LOWER(p.title) LIKE LOWER(${len(params)})')
            where = " AND ".join(filters)
            rows = await conn.fetch(f"""
                SELECT n.title, n."createdAt", p.title as project
                FROM "Note" n
                JOIN "Project" p ON p.id = n."projectId"
                WHERE {where}
                ORDER BY n."createdAt" DESC
                LIMIT 20
            """, *params)
            if not rows:
                return "No notes found."
            return "\n".join(
                f"[{r['project']}] {r['title']} (created {r['createdAt'].date()})"
                for r in rows
            )

    return "Unknown query intent."

# ─── Tool dispatcher ──────────────────────────────────────────────────────────

async def execute_tool(name: str, args: dict, user_id: str) -> tuple[str, dict]:
    """Execute a named tool. Returns (result_string, log_info)."""
    if name == "search_project_data":
        query = args.get("query", "")
        limit = min(int(args.get("limit", 5)), 10)
        embedding = await get_embedding(query)
        rows = await search_user_projects(user_id, embedding, limit)
        relevant = [r for r in rows if r["similarity"] >= SIMILARITY_THRESHOLD]
        if not relevant:
            return "No relevant results found for that query.", {"sources": [], "scores": [], "count": 0}
        parts = []
        seen: set = set()
        for r in relevant:
            if r["projectId"] not in seen:
                seen.add(r["projectId"])
                parts.append(f"Project: {r['projectTitle']}")
            parts.append(f"- ({r['sourceTable']}) {r['textContent']}")
        log_info = {
            "sources": list({r["sourceTable"] for r in relevant}),
            "scores": [round(r["similarity"], 4) for r in relevant],
            "count": len(relevant)
        }
        return "\n".join(parts), log_info

    elif name == "query_structured_data":
        result = await run_structured_query(
            user_id=user_id,
            intent=args.get("intent", ""),
            project_name=args.get("project_name"),
            status=args.get("status"),
            priority=args.get("priority")
        )
        return result, {"sources": ["structured_query"], "scores": [], "count": 0}

    return f"Unknown tool: {name}", {}

# ─── Ollama: non-streaming WITH tools (agentic decision loop) ─────────────────

async def call_ollama_with_tools(messages: list[dict], model: str, thinking_enabled: bool) -> dict:
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(f"{OLLAMA_URL}/api/chat", json={
            "model": model,
            "messages": messages,
            "tools": TOOLS,
            "stream": False,
            "think": thinking_enabled
        })
        return res.json()["message"]

# ─── Ollama: streaming WITHOUT tools (final answer only) ──────────────────────

async def stream_ollama(messages: list[dict], model: str, thinking_enabled: bool):
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json={
            "model": model,
            "messages": messages,
            "stream": True,
            "think": thinking_enabled
        }) as res:
            async for line in res.aiter_lines():
                if line:
                    data = json.loads(line)
                    msg = data.get("message", {})

                    # Thinking tokens — wrapped in \x1e so they're always isolated
                    if thinking := msg.get("thinking"):
                        yield f"\x1e__THINKING__{json.dumps(thinking)}\x1e"
                        continue

                    # Content tokens — yielded verbatim to preserve embedded newlines
                    if token := msg.get("content"):
                        yield token

                    # Final chunk — capture and emit metrics
                    if data.get("done"):
                        eval_duration = data.get("eval_duration", 1)
                        eval_count = data.get("eval_count", 0)
                        metrics = {
                            "prompt_tokens": data.get("prompt_eval_count", 0),
                            "completion_tokens": eval_count,
                            "total_duration_ms": data.get("total_duration", 0) / 1_000_000,
                            "tokens_per_second": round(
                                eval_count / (eval_duration / 1_000_000_000), 2
                            ) if eval_duration > 0 else 0
                        }
                        yield f"\x1e__METRICS__{json.dumps(metrics)}\x1e"
                        break

# ─── Chat route ───────────────────────────────────────────────────────────────

@router.post("/")
async def chat(req: ChatRequest):
    try:
        # Accumulated log data — populated by whichever path runs
        all_sources: list[str] = []
        all_scores: list[float] = []
        total_result_count = 0
        tool_calls_summary: list[str] = []

        async def response_stream():
            nonlocal all_sources, all_scores, total_result_count, tool_calls_summary
            thinking_buffer = ""

            uses_tools = await model_supports_tools(req.modelName)
            print(f"Model '{req.modelName}' tool-calling capability: {uses_tools}")

            if uses_tools:
                # ── Agentic tool-calling loop (tool-capable models) ────────────
                messages: list[dict] = [{"role": "system", "content": build_system_prompt()}]
                messages += req.history[-10:]
                messages.append({"role": "user", "content": req.message})

                for _ in range(MAX_TOOL_ITERATIONS):
                    response_msg = await call_ollama_with_tools(
                        messages, req.modelName, req.thinkingEnabled
                    )

                    # Thinking during the decision phase — yield immediately
                    if thinking := response_msg.get("thinking"):
                        thinking_buffer += thinking
                        yield f"\x1e__THINKING__{json.dumps(thinking)}\x1e"

                    tool_calls = response_msg.get("tool_calls")
                    if not tool_calls:
                        # LLM has enough context — exit loop and stream answer
                        break

                    messages.append(response_msg)

                    for call in tool_calls:
                        fn = call.get("function", {})
                        name = fn.get("name", "")
                        args = fn.get("arguments", {})
                        if isinstance(args, str):
                            args = json.loads(args)

                        # Emit BEFORE executing — frontend shows indicator immediately
                        yield f"\x1e__TOOLCALL__{json.dumps({'name': name, 'args': args})}\x1e"

                        result, log_info = await execute_tool(name, args, req.userId)

                        all_sources.extend(log_info.get("sources", []))
                        all_scores.extend(log_info.get("scores", []))
                        total_result_count += log_info.get("count", 0)
                        tool_calls_summary.append(f"{name}({json.dumps(args)})")

                        messages.append({"role": "tool", "name": name, "content": result})

                final_messages = messages

            else:
                # ── RAG fallback (models without tool-calling capability) ───────
                # Emit the indicator immediately so the frontend shows "Searching..."
                # while the embedding + vector search runs — same UX as tools path.
                yield f"\x1e__TOOLCALL__{json.dumps({'name': 'search_project_data', 'args': {'query': req.message}})}\x1e"

                query_embedding = await get_embedding(req.message)
                context_rows = await search_user_projects(req.userId, query_embedding)
                relevant = [r for r in context_rows if r["similarity"] >= SIMILARITY_THRESHOLD]

                all_sources = list({r["sourceTable"] for r in relevant})
                all_scores = [round(r["similarity"], 4) for r in relevant]
                total_result_count = len(relevant)
                tool_calls_summary = [f"rag_fallback(query={req.message[:60]})"]

                final_messages = build_rag_messages(req.message, relevant, req.history)

            # ── Both paths converge: stream the final answer ───────────────────
            async for chunk in stream_ollama(final_messages, req.modelName, req.thinkingEnabled):
                if chunk.startswith("\x1e__THINKING__"):
                    inner = chunk.strip("\x1e").replace("__THINKING__", "")
                    thinking_buffer += json.loads(inner)
                    yield chunk
                elif chunk.startswith("\x1e__METRICS__"):
                    metrics_data = json.loads(chunk.strip("\x1e").replace("__METRICS__", ""))
                    thinking_tokens = len(thinking_buffer.split()) if thinking_buffer else 0
                    asyncio.create_task(log_chat(
                        user_id=req.userId,
                        query=req.message,
                        extracted_query="; ".join(tool_calls_summary) or req.message,
                        context_sources=list(set(all_sources)),
                        similarity_scores=all_scores,
                        result_count=total_result_count,
                        prompt_tokens=metrics_data.get("prompt_tokens", 0),
                        completion_tokens=metrics_data.get("completion_tokens", 0),
                        thinking_tokens=thinking_tokens,
                        total_duration_ms=metrics_data.get("total_duration_ms", 0),
                        tokens_per_second=metrics_data.get("tokens_per_second", 0),
                        threshold=SIMILARITY_THRESHOLD,
                        model_name=req.modelName,
                        thinking_enabled=req.thinkingEnabled
                    ))
                    yield chunk
                else:
                    yield chunk

        return StreamingResponse(response_stream(), media_type="text/plain")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))