import json
import httpx
from services.ollama_client import OLLAMA_URL

# ─── System prompt ────────────────────────────────────────────────────────────

def build_system_prompt() -> str:
    return """You are a helpful assistant for a project management app called ProjectHub.
You can only access and modify the user's own projects.

You have these tools available:

**Read tools** (for retrieving data):
- **search_project_data**: For semantic, meaning-based questions about project content (notes, task descriptions, project details). Use when the question is vague or conceptual.
- **query_structured_data**: For exact structured queries — task counts, status/priority filters, due dates, or listing project metadata.

**Write tools** (for creating or modifying data):
- **create_task**: Create a new task in a project.
- **update_task**: Update an existing task's status, priority, title, body, or due date. You MUST first use query_structured_data to find the task number.
- **create_note**: Create a new note in a project.
- **update_note**: Update an existing note's title or body. You MUST first use query_structured_data with get_notes_for_project to find the note.
- **update_project**: Update a project's title, description, or visibility.

Rules:
- ALWAYS call a read tool before answering any question about the user's data
- You may call tools multiple times if the first result isn't sufficient
- Only answer from tool results — never fabricate project data
- If tool results are empty, tell the user clearly that nothing was found
- Reference project names directly in your answer
- For write operations: confirm what you're about to do BEFORE calling the write tool, unless the user's instruction is explicit and unambiguous (e.g. "mark task #3 as done")
- After a write operation, briefly summarize what was changed
- Never call a write tool without knowing the exact project name — use query_structured_data first if needed

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

# ─── Query extraction (RAG fallback path) ─────────────────────────────────────

def build_query_extractor_messages(message: str, history: list[dict]) -> list[dict]:
    """Build a compact prompt that asks the model to produce a semantic search query."""
    extraction_system = """You extract search queries for semantic retrieval in a project management app.
Given a user's latest message and recent conversation history, output a single concise search query
that will help retrieve the most relevant projects, tasks, and notes.

Rules:
- Focus on key entities, intent, and constraints (status, priority, due dates, project names)
- Prefer natural language query terms, not SQL
- Keep it short (max 18 words)
- If the user asks a follow-up, include the missing context from history
- Output ONLY valid JSON in this exact shape: {\"query\": \"...\"}
- Do not include markdown or any extra keys"""

    history_summary = history[-10:]
    return [
        {"role": "system", "content": extraction_system},
        {
            "role": "user",
            "content": json.dumps({
                "latest_message": message,
                "history": history_summary,
            }, ensure_ascii=False)
        }
    ]


async def extract_semantic_query_with_llm(message: str, history: list[dict], model: str) -> str:
    """Use the selected model to derive a retrieval-friendly semantic query."""
    extractor_messages = build_query_extractor_messages(message, history)
    fallback = message.strip()
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(f"{OLLAMA_URL}/api/chat", json={
                "model": model,
                "messages": extractor_messages,
                "stream": False,
                "think": False,
            })
            raw_content = res.json().get("message", {}).get("content", "").strip()

        if not raw_content:
            return fallback

        # Prefer strict JSON output; tolerate plain-text fallback if parsing fails.
        try:
            parsed = json.loads(raw_content)
            query = str(parsed.get("query", "")).strip()
            return query or fallback
        except json.JSONDecodeError:
            return raw_content[:200].strip() or fallback
    except Exception:
        return fallback
