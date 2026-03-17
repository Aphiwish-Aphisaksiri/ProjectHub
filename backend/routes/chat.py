# This file defines the chat API route for the backend.
# It handles
# - incoming chat messages
# - embedding user messages for context-based search
# - searching the user's projects for relevant context
# - building a prompt for the LLM based on search results and conversation history
# - forwarding the prompt to the Ollama LLM server
# - streaming responses from Ollama back to the client in real-time

# TODO: Future improvement
# - implement query extraction to pull out specific entities or intents from the user message for more targeted search and response generation
#   This can be done by calling LLM to extract search query, then do a similarity search, which can be more accurate than embedding the whole message and doing a signle search.

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
CHAT_MODEL = "mistral:7b"

class ChatRequest(BaseModel):
    userId: str
    message: str
    history: list[dict] = []  # [{"role": "user", "content": "..."}, ...]

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
    # Build context string from search results
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
You can only access the user's own projects. Answer based on the context below.
If the context doesn't contain enough information, say so honestly.
If no relevant project was found, tell the user you couldn't find a matching project.

Context from user's projects:
{context}"""

    messages = [{"role": "system", "content": system_prompt}]
    # Add conversation history (last 10 messages to avoid token overflow)
    messages += history[-10:]
    messages.append({"role": "user", "content": message})
    return messages

async def stream_ollama(messages: list[dict]):
    metrics = {}
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json={
            "model": CHAT_MODEL,
            "messages": messages,
            "stream": True
        }) as res:
            async for line in res.aiter_lines():
                if line:
                    data = json.loads(line)
                    if token := data.get("message", {}).get("content"):
                        yield token
                    if data.get("done"):
                        eval_duration = data.get("eval_duration", 1)
                        eval_count = data.get("eval_count", 0)
                        metrics["prompt_tokens"] = data.get("prompt_eval_count", 0)
                        metrics["completion_tokens"] = eval_count
                        metrics["total_duration_ms"] = data.get("total_duration", 0) / 1_000_000
                        metrics["tokens_per_second"] = round(
                            eval_count / (eval_duration / 1_000_000_000), 2
                        ) if eval_duration > 0 else 0
                        yield f"__METRICS__{json.dumps(metrics)}"  # sentinel value
                        break

@router.post("/")
async def chat(req: ChatRequest):
    try:
        # 1. Extract core search query from the message
        # search_query = await extract_search_query(req.message)
        search_query = req.message
        # For now, just use the full message as the search query.
        # TODO: Future improvement: call LLM to extract a more concise search query.

        # 2. Embed the extracted query (cleaner signal than full message)
        query_embedding = await get_embedding(search_query)

        # 3. Search across user's projects
        context_rows = await search_user_projects(req.userId, query_embedding)

        # 4. Check if we found anything above a confidence threshold
        SIMILARITY_THRESHOLD = 0.4
        relevant_rows = [r for r in context_rows if r["similarity"] >= SIMILARITY_THRESHOLD]

        # 5. Build prompt with context
        messages = build_prompt(req.message, relevant_rows, req.history)

        # Collect metadata for logging
        context_sources = list({r["sourceTable"] for r in relevant_rows})
        similarity_scores = [round(r["similarity"], 4) for r in relevant_rows]

        # 6. Stream response, intercept metrics sentinel at the end
        async def response_stream():
            async for chunk in stream_ollama(messages):
                if chunk.startswith("__METRICS__"):
                    metrics_data = json.loads(chunk.replace("__METRICS__", ""))
                    asyncio.create_task(log_chat(
                        user_id=req.userId,
                        query=req.message,
                        extracted_query=search_query,
                        context_sources=context_sources,
                        similarity_scores=similarity_scores,
                        result_count=len(relevant_rows),
                        prompt_tokens=metrics_data.get("prompt_tokens", 0),
                        completion_tokens=metrics_data.get("completion_tokens", 0),
                        total_duration_ms=metrics_data.get("total_duration_ms", 0),
                        tokens_per_second=metrics_data.get("tokens_per_second", 0),
                        threshold=SIMILARITY_THRESHOLD
                    ))
                else:
                    yield chunk

        return StreamingResponse(response_stream(), media_type="text/plain")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))