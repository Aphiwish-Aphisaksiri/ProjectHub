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

class ChatRequest(BaseModel):
    userId: str
    message: str
    history: list[dict] = []
    modelName: str = DEFAULT_MODEL      # ← new
    thinkingEnabled: bool = False       # ← new

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

def build_prompt(message: str, context_rows: list[dict], history: list[dict]) -> list[dict]:
    if context_rows:
        context_parts = []
        seen_projects = set()
        for row in context_rows:
            if row["projectId"] not in seen_projects:
                seen_projects.add(row["projectId"])
                context_parts.append(f"Project: {row['projectTitle']}")
            context_parts.append(f"- ({row['sourceTable']}) {row['textContent']}")
        context = "\n".join(context_parts)
    else:
        context = "No relevant projects found."

    system_prompt = f"""You are a helpful assistant for a project management app called ProjectHub.
You can only access the user's own projects.

Rules:
- Answer based ONLY on the context provided below
- If the context doesn't contain enough information, say so honestly
- If no relevant project was found, tell the user clearly
- Reference project names directly in your answer
- Be concise and specific

Context from user's projects:
{context}"""

    messages = [{"role": "system", "content": system_prompt}]
    messages += history[-10:]
    messages.append({"role": "user", "content": message})
    return messages

async def extract_search_query(message: str, model: str) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(f"{OLLAMA_URL}/api/chat", json={
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": """Extract the core search intent from the user message for a project management app.

Rules:
- Return ONLY the search terms, nothing else
- Remove all greetings, filler words, and pleasantries
- Keep project names, technical terms, and specific nouns
- If asking about tasks/notes/status, include those keywords
- If no clear project intent, return the core topic only

Examples:
"Hello! Can you tell me about FitFlow?" → "FitFlow project"
"What high priority tasks do I have in ProjectHub?" → "ProjectHub high priority tasks"
"How are you? Tell me about my machine learning project" → "machine learning project"
"What did I write in my notes about authentication?" → "authentication notes"
"Give me a summary of everything in EcoTrack" → "EcoTrack project tasks notes summary"
"""
                },
                {"role": "user", "content": message}
            ],
            "stream": False,
            "think": False      # ← no thinking needed for extraction, saves time
        })
        return res.json()["message"]["content"].strip()

async def stream_ollama(messages: list[dict], model: str, thinking_enabled: bool):
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json={
            "model": model,
            "messages": messages,
            "stream": True,
            "think": thinking_enabled       # ← dynamic based on request
        }) as res:
            async for line in res.aiter_lines():
                if line:
                    data = json.loads(line)
                    msg = data.get("message", {})

                    # Sentinel lines are wrapped in \n so they're always isolated
                    # even if batched with adjacent content in the same TCP packet.
                    # Content tokens are yielded as-is — adding \n would strip
                    # leading newlines from tokens like "\n1." causing "12" corruption.
                    if thinking := msg.get("thinking"):
                        yield f"\x1e__THINKING__{json.dumps(thinking)}\x1e"
                        continue

                    # Yield content tokens verbatim — preserve embedded newlines
                    if token := msg.get("content"):
                        yield token

                    # Final chunk — capture metrics
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

@router.post("/")
async def chat(req: ChatRequest):
    try:
        # 1. Extract core search query
        search_query = await extract_search_query(req.message, req.modelName)

        # 2. Embed the extracted query
        query_embedding = await get_embedding(search_query)

        # 3. Search across user's projects
        context_rows = await search_user_projects(req.userId, query_embedding)

        # 4. Filter by similarity threshold
        SIMILARITY_THRESHOLD = 0.4
        relevant_rows = [r for r in context_rows if r["similarity"] >= SIMILARITY_THRESHOLD]

        # 5. Build prompt
        messages = build_prompt(req.message, relevant_rows, req.history)

        context_sources = list({r["sourceTable"] for r in relevant_rows})
        similarity_scores = [round(r["similarity"], 4) for r in relevant_rows]

        # 6. Stream response, intercept sentinels
        async def response_stream():
            thinking_buffer = ""
            async for chunk in stream_ollama(messages, req.modelName, req.thinkingEnabled):
                if chunk.startswith("__THINKING__"):
                    thinking_buffer += chunk.replace("__THINKING__", "")
                    yield chunk     # still forward to frontend for collapsed display
                elif chunk.startswith("__METRICS__"):
                    metrics_data = json.loads(chunk.replace("__METRICS__", ""))
                    # Estimate thinking tokens from buffer length
                    thinking_tokens = len(thinking_buffer.split()) if thinking_buffer else 0
                    asyncio.create_task(log_chat(
                        user_id=req.userId,
                        query=req.message,
                        extracted_query=search_query,
                        context_sources=context_sources,
                        similarity_scores=similarity_scores,
                        result_count=len(relevant_rows),
                        prompt_tokens=metrics_data.get("prompt_tokens", 0),
                        completion_tokens=metrics_data.get("completion_tokens", 0),
                        thinking_tokens=thinking_tokens,
                        total_duration_ms=metrics_data.get("total_duration_ms", 0),
                        tokens_per_second=metrics_data.get("tokens_per_second", 0),
                        threshold=SIMILARITY_THRESHOLD,
                        model_name=req.modelName,
                        thinking_enabled=req.thinkingEnabled
                    ))
                else:
                    yield chunk

        return StreamingResponse(response_stream(), media_type="text/plain")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))