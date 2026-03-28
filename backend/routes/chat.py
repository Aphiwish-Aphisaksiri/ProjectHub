from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from embeddings import get_embedding
from db import log_chat
import json
import asyncio
from services.ollama_client import (
    model_supports_tools,
    model_supports_thinking,
    call_ollama_with_tools,
    stream_ollama,
    build_notice_frame,
    thinking_fallback_notice,
)
from services.tool_executor import execute_tool, TOOLS
from services.search import (
    detect_project_scope,
    search_user_projects_scoped,
    SIMILARITY_THRESHOLD,
)
from services.prompts import (
    build_system_prompt,
    build_rag_messages,
    extract_semantic_query_with_llm,
)

router = APIRouter(prefix="/chat", tags=["chat"])

DEFAULT_MODEL = "qwen3.5:9b"
MAX_TOOL_ITERATIONS = 5


class ChatRequest(BaseModel):
    userId: str
    message: str
    history: list[dict] = []
    modelName: str = DEFAULT_MODEL
    thinkingEnabled: bool = False


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
            effective_thinking_enabled = req.thinkingEnabled

            if effective_thinking_enabled and not await model_supports_thinking(req.modelName):
                effective_thinking_enabled = False
                yield build_notice_frame(thinking_fallback_notice(req.modelName))

            uses_tools = await model_supports_tools(req.modelName)

            if uses_tools:
                # ── Agentic tool-calling loop (tool-capable models) ────────────
                messages: list[dict] = [{"role": "system", "content": build_system_prompt()}]
                messages += req.history[-10:]
                messages.append({"role": "user", "content": req.message})

                for _ in range(MAX_TOOL_ITERATIONS):
                    response_msg, effective_thinking_enabled, notice = await call_ollama_with_tools(
                        messages, req.modelName, TOOLS, effective_thinking_enabled
                    )

                    if notice:
                        yield build_notice_frame(notice)

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
                extracted_query = await extract_semantic_query_with_llm(
                    req.message,
                    req.history,
                    req.modelName
                )

                # Emit the indicator immediately so the frontend shows "Searching..."
                # while the embedding + vector search runs — same UX as tools path.
                yield f"\x1e__TOOLCALL__{json.dumps({'name': 'search_project_data', 'args': {'query': extracted_query}})}\x1e"

                query_embedding = await get_embedding(extracted_query)
                scoped_project = await detect_project_scope(req.userId, extracted_query)
                context_rows = await search_user_projects_scoped(
                    req.userId,
                    query_embedding,
                    project_id=scoped_project["project_id"] if scoped_project else None,
                )
                relevant = [r for r in context_rows if r["similarity"] >= SIMILARITY_THRESHOLD]

                all_sources = list({r["sourceTable"] for r in relevant})
                all_scores = [round(r["similarity"], 4) for r in relevant]
                total_result_count = len(relevant)
                tool_calls_summary = [f"rag_fallback(extracted_query={extracted_query[:60]})"]

                final_messages = build_rag_messages(req.message, relevant, req.history)

            # ── Both paths converge: stream the final answer ───────────────────
            async for chunk in stream_ollama(final_messages, req.modelName, effective_thinking_enabled):
                if chunk.startswith("\x1e__THINKING__"):
                    inner = chunk.strip("\x1e").replace("__THINKING__", "")
                    thinking_buffer += json.loads(inner)
                    yield chunk
                elif chunk.startswith("\x1e__NOTICE__"):
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
                        thinking_enabled=effective_thinking_enabled
                    ))
                    yield chunk
                else:
                    yield chunk

        return StreamingResponse(response_stream(), media_type="text/plain")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))