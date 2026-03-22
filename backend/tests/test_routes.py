"""
Integration-style route tests using FastAPI's TestClient.

All external dependencies (DB pool, Ollama via httpx) are mocked so tests
run without any running services.

Patching strategy:
- embed routes  → patch `routes.embed.embed_source`
- chat route    → patch `routes.chat.{get_embedding, search_user_projects,
                                      stream_ollama, log_chat}`
- asyncio.create_task is replaced with a no-op that cleanly closes the
  coroutine; this avoids "coroutine never awaited" warnings and event-loop
  teardown races caused by the fire-and-forget log_chat task in the chat route.
"""

import json
import pytest
from unittest.mock import AsyncMock, patch


# ── helpers ──────────────────────────────────────────────────────────────────

_METRICS = json.dumps({
    "prompt_tokens": 10,
    "completion_tokens": 5,
    "total_duration_ms": 100.0,
    "tokens_per_second": 50.0,
})


async def _fake_stream_ok(messages):
    """Minimal happy-path stream: two tokens then the metrics sentinel."""
    yield "Hello"
    yield " world"
    yield f"__METRICS__{_METRICS}"


def _discard_coro(coro):
    """Close a coroutine without running it (suppresses RuntimeWarnings)."""
    coro.close()


# ── /health ──────────────────────────────────────────────────────────────────

def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


# ── /embed/project ───────────────────────────────────────────────────────────

def test_embed_project_success(client):
    with patch("routes.embed.embed_source", new_callable=AsyncMock) as m:
        r = client.post("/embed/project", json={
            "projectId": "p1", "sourceId": "s1",
            "title": "My Project", "description": "A description",
        })
    assert r.status_code == 200
    assert r.json() == {"success": True, "sourceId": "s1"}
    m.assert_awaited_once()


def test_embed_project_title_only_no_description(client):
    with patch("routes.embed.embed_source", new_callable=AsyncMock) as m:
        client.post("/embed/project", json={
            "projectId": "p", "sourceId": "s", "title": "Bare Title",
        })
    assert m.call_args.kwargs["text"] == "Bare Title"


def test_embed_project_combines_title_and_description(client):
    with patch("routes.embed.embed_source", new_callable=AsyncMock) as m:
        client.post("/embed/project", json={
            "projectId": "p", "sourceId": "s", "title": "T", "description": "D",
        })
    assert m.call_args.kwargs["text"] == "T\nD"


def test_embed_project_error_returns_500(client):
    with patch("routes.embed.embed_source", side_effect=Exception("DB down")):
        r = client.post("/embed/project", json={
            "projectId": "p", "sourceId": "s", "title": "T",
        })
    assert r.status_code == 500
    assert "DB down" in r.json()["detail"]


# ── /embed/task ──────────────────────────────────────────────────────────────

def test_embed_task_success(client):
    with patch("routes.embed.embed_source", new_callable=AsyncMock) as m:
        r = client.post("/embed/task", json={
            "projectId": "p1", "sourceId": "t1", "text": "Do the thing",
        })
    assert r.status_code == 200
    assert r.json() == {"success": True, "sourceId": "t1"}
    m.assert_awaited_once_with(
        project_id="p1", source_table="task", source_id="t1", text="Do the thing"
    )


def test_embed_task_error_returns_500(client):
    with patch("routes.embed.embed_source", side_effect=RuntimeError("fail")):
        r = client.post("/embed/task", json={
            "projectId": "p", "sourceId": "s", "text": "t",
        })
    assert r.status_code == 500


# ── /embed/note ──────────────────────────────────────────────────────────────

def test_embed_note_success(client):
    with patch("routes.embed.embed_source", new_callable=AsyncMock) as m:
        r = client.post("/embed/note", json={
            "projectId": "p1", "sourceId": "n1", "text": "Meeting notes",
        })
    assert r.status_code == 200
    assert r.json() == {"success": True, "sourceId": "n1"}
    m.assert_awaited_once_with(
        project_id="p1", source_table="note", source_id="n1", text="Meeting notes"
    )


def test_embed_note_error_returns_500(client):
    with patch("routes.embed.embed_source", side_effect=RuntimeError("fail")):
        r = client.post("/embed/note", json={
            "projectId": "p", "sourceId": "s", "text": "t",
        })
    assert r.status_code == 500


# ── /chat/ ───────────────────────────────────────────────────────────────────

def test_chat_streams_tokens_without_metrics_sentinel(client):
    with (
        patch("routes.chat.get_embedding", new_callable=AsyncMock, return_value=[0.1] * 768),
        patch("routes.chat.search_user_projects", new_callable=AsyncMock, return_value=[]),
        patch("routes.chat.stream_ollama", side_effect=_fake_stream_ok),
        patch("routes.chat.log_chat", new_callable=AsyncMock),
        patch("asyncio.create_task", _discard_coro),
    ):
        r = client.post("/chat/", json={
            "userId": "user1", "message": "hello", "history": [],
        })
    assert r.status_code == 200
    assert "Hello" in r.text
    assert " world" in r.text
    assert "__METRICS__" not in r.text


def test_chat_filters_rows_below_similarity_threshold(client):
    """Rows with similarity < 0.4 must not reach the prompt (threshold = 0.4)."""
    low_sim_rows = [{
        "projectId": "p1", "projectTitle": "Old", "sourceTable": "task",
        "textContent": "Something irrelevant", "similarity": 0.2,
    }]
    captured_messages: list = []

    async def capturing_stream(messages):
        captured_messages.extend(messages)
        yield "ok"
        yield f"__METRICS__{_METRICS}"

    with (
        patch("routes.chat.get_embedding", new_callable=AsyncMock, return_value=[0.0] * 768),
        patch("routes.chat.search_user_projects", new_callable=AsyncMock, return_value=low_sim_rows),
        patch("routes.chat.stream_ollama", side_effect=capturing_stream),
        patch("routes.chat.log_chat", new_callable=AsyncMock),
        patch("asyncio.create_task", _discard_coro),
    ):
        client.post("/chat/", json={"userId": "u1", "message": "q", "history": []})

    assert "No relevant projects found." in captured_messages[0]["content"]


def test_chat_passes_high_similarity_rows_to_prompt(client):
    """Rows at or above the threshold must appear in the prompt."""
    high_sim_rows = [{
        "projectId": "p1", "projectTitle": "Active Project", "sourceTable": "task",
        "textContent": "Build the dashboard", "similarity": 0.75,
    }]
    captured_messages: list = []

    async def capturing_stream(messages):
        captured_messages.extend(messages)
        yield "ok"
        yield f"__METRICS__{_METRICS}"

    with (
        patch("routes.chat.get_embedding", new_callable=AsyncMock, return_value=[0.0] * 768),
        patch("routes.chat.search_user_projects", new_callable=AsyncMock, return_value=high_sim_rows),
        patch("routes.chat.stream_ollama", side_effect=capturing_stream),
        patch("routes.chat.log_chat", new_callable=AsyncMock),
        patch("asyncio.create_task", _discard_coro),
    ):
        client.post("/chat/", json={"userId": "u1", "message": "q", "history": []})

    system_content = captured_messages[0]["content"]
    assert "Active Project" in system_content
    assert "Build the dashboard" in system_content


def test_chat_embedding_error_returns_500(client):
    with patch("routes.chat.get_embedding", side_effect=Exception("Ollama down")):
        r = client.post("/chat/", json={"userId": "u1", "message": "q"})
    assert r.status_code == 500
    assert "Ollama down" in r.json()["detail"]


def test_chat_missing_user_id_returns_422(client):
    r = client.post("/chat/", json={"message": "hello"})
    assert r.status_code == 422


def test_chat_missing_message_returns_422(client):
    r = client.post("/chat/", json={"userId": "u1"})
    assert r.status_code == 422
