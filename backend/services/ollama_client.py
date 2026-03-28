from ollama_capabilities import (
    model_supports_tools_by_prefix,
    model_supports_thinking as ollama_model_supports_thinking,
)
import httpx
import json
import os

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
OLLAMA_STREAM_TIMEOUT = httpx.Timeout(45.0, connect=10.0, read=45.0, write=45.0)

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
_thinking_capable_cache: dict[str, bool] = {}


def build_notice_frame(message: str) -> str:
    return f"\x1e__NOTICE__{json.dumps(message)}\x1e"


def thinking_fallback_notice(model: str) -> str:
    return f"Thinking mode is not supported reliably by {model}. Continuing with standard response mode."


def _is_retryable_thinking_error(exc: Exception) -> bool:
    if isinstance(exc, (httpx.ReadTimeout, httpx.RemoteProtocolError, httpx.ConnectError)):
        return True
    message = str(exc).lower()
    return any(token in message for token in (
        "think",
        "thinking",
        "unsupported",
        "unknown field",
        "invalid option",
        "connection reset",
    ))


async def model_supports_tools(model: str) -> bool:
    if model in _tools_capable_cache:
        return _tools_capable_cache[model]
    # Check blocklist first — no need to hit the API for known-broken models
    if not model_supports_tools_by_prefix(model):
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


async def model_supports_thinking(model: str) -> bool:
    if model in _thinking_capable_cache:
        return _thinking_capable_cache[model]

    capable = ollama_model_supports_thinking(model)
    _thinking_capable_cache[model] = capable
    return capable


# ─── Ollama: non-streaming WITH tools (agentic decision loop) ─────────────────

async def _call_ollama_with_tools_once(
    messages: list[dict], model: str, tools: list[dict], thinking_enabled: bool
) -> dict:
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(f"{OLLAMA_URL}/api/chat", json={
            "model": model,
            "messages": messages,
            "tools": tools,
            "stream": False,
            "think": thinking_enabled
        })
        res.raise_for_status()
        return res.json()["message"]


async def call_ollama_with_tools(
    messages: list[dict], model: str, tools: list[dict], thinking_enabled: bool
) -> tuple[dict, bool, str | None]:
    try:
        message = await _call_ollama_with_tools_once(messages, model, tools, thinking_enabled)
        return message, thinking_enabled, None
    except Exception as exc:
        if thinking_enabled and _is_retryable_thinking_error(exc):
            message = await _call_ollama_with_tools_once(messages, model, tools, False)
            return message, False, thinking_fallback_notice(model)
        raise


# ─── Ollama: streaming WITHOUT tools (final answer only) ──────────────────────

async def _stream_ollama_once(messages: list[dict], model: str, thinking_enabled: bool):
    async with httpx.AsyncClient(timeout=OLLAMA_STREAM_TIMEOUT) as client:
        async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json={
            "model": model,
            "messages": messages,
            "stream": True,
            "think": thinking_enabled
        }) as res:
            res.raise_for_status()
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


async def stream_ollama(messages: list[dict], model: str, thinking_enabled: bool):
    emitted_anything = False
    try:
        async for chunk in _stream_ollama_once(messages, model, thinking_enabled):
            emitted_anything = True
            yield chunk
    except Exception as exc:
        if thinking_enabled and not emitted_anything and _is_retryable_thinking_error(exc):
            yield build_notice_frame(thinking_fallback_notice(model))
            async for chunk in _stream_ollama_once(messages, model, False):
                yield chunk
            return
        raise
