"""
Unit tests for the write-tool helpers in services/tool_executor.py.

Every external dependency (DB pool, httpx, embeddings, search) is mocked so
that tests run without any running services.
"""

import pytest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
import httpx

from services.tool_executor import (
    TOOLS,
    execute_tool,
    _resolve_project_slug,
    _resolve_task_id,
    _resolve_note_id,
    _internal_headers,
    _execute_create_task,
    _execute_update_task,
    _execute_create_note,
    _execute_update_note,
    _execute_update_project,
    _execute_delete_task,
    _execute_delete_note,
    _execute_delete_project,
)


# ─── TOOLS schema sanity checks ─────────────────────────────────────────────

class TestToolSchemas:
    """Guard-rails: the TOOLS list exposes the expected tools to the LLM."""

    _tool_names = {t["function"]["name"] for t in TOOLS}

    @pytest.mark.parametrize("name", [
        "search_project_data",
        "query_structured_data",
        "create_task",
        "update_task",
        "create_note",
        "update_note",
        "update_project",
        "delete_task",
        "delete_note",
        "delete_project",
    ])
    def test_tool_is_registered(self, name):
        assert name in self._tool_names

    def test_total_tool_count(self):
        assert len(TOOLS) == 10

    @pytest.mark.parametrize("name,expected_required", [
        ("create_task", ["project_name", "title"]),
        ("update_task", ["task_number", "project_name"]),
        ("delete_task", ["task_number", "project_name"]),
        ("create_note", ["project_name", "title", "body"]),
        ("update_note", ["note_title", "project_name"]),
        ("update_project", ["project_name"]),
        ("delete_note", ["note_title", "project_name"]),
        ("delete_project", ["project_name"]),
    ])
    def test_required_params(self, name, expected_required):
        tool = next(t for t in TOOLS if t["function"]["name"] == name)
        assert tool["function"]["parameters"]["required"] == expected_required


# ─── _internal_headers ───────────────────────────────────────────────────────

class TestInternalHeaders:
    def test_contains_secret(self):
        with patch("services.tool_executor.INTERNAL_API_SECRET", "my-secret"):
            h = _internal_headers()
        assert h["x-internal-secret"] == "my-secret"
        assert h["Content-Type"] == "application/json"


# ─── _resolve_project_slug ──────────────────────────────────────────────────

def _make_conn(rows):
    """Build a mock async connection that returns rows in order."""
    conn = AsyncMock()
    conn.fetchrow = AsyncMock(side_effect=rows)
    return conn


def _pool_with_conn(conn):
    """Build a mock pool whose .acquire() returns an async context manager."""
    pool = MagicMock()
    ctx = MagicMock()
    ctx.__aenter__ = AsyncMock(return_value=conn)
    ctx.__aexit__ = AsyncMock(return_value=False)
    pool.acquire.return_value = ctx
    return pool


class TestResolveProjectSlug:
    @pytest.fixture(autouse=True)
    def _patch_pool(self):
        self.conn = _make_conn([])
        self.pool = _pool_with_conn(self.conn)
        with patch("db.get_pool", new_callable=AsyncMock, return_value=self.pool):
            yield

    async def test_exact_match(self):
        row = {"slug": "my-proj", "title": "My Proj"}
        self.conn.fetchrow = AsyncMock(return_value=row)
        slug, title = await _resolve_project_slug("u1", "My Proj")
        assert slug == "my-proj"
        assert title == "My Proj"

    async def test_partial_fallback(self):
        # First call (exact) returns None, second call (LIKE) returns a match
        self.conn.fetchrow = AsyncMock(side_effect=[None, {"slug": "proj-a", "title": "Project Alpha"}])
        slug, title = await _resolve_project_slug("u1", "Alpha")
        assert slug == "proj-a"

    async def test_not_found(self):
        self.conn.fetchrow = AsyncMock(side_effect=[None, None])
        slug, title = await _resolve_project_slug("u1", "Nonexistent")
        assert slug is None
        assert title is None


# ─── _resolve_task_id ────────────────────────────────────────────────────────

class TestResolveTaskId:
    @pytest.fixture(autouse=True)
    def _patch_pool(self):
        self.conn = _make_conn([])
        self.pool = _pool_with_conn(self.conn)
        with patch("db.get_pool", new_callable=AsyncMock, return_value=self.pool):
            yield

    async def test_found(self):
        row = {"id": "t1", "title": "Fix bug", "body": "", "status": "TODO",
               "priority": "HIGH", "dueDate": None, "projectSlug": "alpha"}
        self.conn.fetchrow = AsyncMock(return_value=row)
        result = await _resolve_task_id("u1", 1, "Alpha")
        assert result is not None
        assert result["id"] == "t1"

    async def test_not_found(self):
        self.conn.fetchrow = AsyncMock(return_value=None)
        result = await _resolve_task_id("u1", 999, "Alpha")
        assert result is None


# ─── _resolve_note_id ────────────────────────────────────────────────────────

class TestResolveNoteId:
    @pytest.fixture(autouse=True)
    def _patch_pool(self):
        self.conn = _make_conn([])
        self.pool = _pool_with_conn(self.conn)
        with patch("db.get_pool", new_callable=AsyncMock, return_value=self.pool):
            yield

    async def test_exact_match(self):
        row = {"id": "n1", "title": "Meeting Notes", "body": "stuff", "projectSlug": "alpha"}
        self.conn.fetchrow = AsyncMock(return_value=row)
        result = await _resolve_note_id("u1", "Meeting Notes", "Alpha")
        assert result is not None
        assert result["id"] == "n1"

    async def test_partial_fallback(self):
        self.conn.fetchrow = AsyncMock(side_effect=[None, {"id": "n2", "title": "Design Notes", "body": "x", "projectSlug": "beta"}])
        result = await _resolve_note_id("u1", "Design", "Beta")
        assert result["id"] == "n2"

    async def test_not_found(self):
        self.conn.fetchrow = AsyncMock(side_effect=[None, None])
        result = await _resolve_note_id("u1", "Nope", "Alpha")
        assert result is None


# ─── execute_tool dispatcher ─────────────────────────────────────────────────

class TestExecuteToolDispatcher:
    async def test_unknown_tool(self):
        result, info = await execute_tool("nonexistent_tool", {}, "u1")
        assert "Unknown tool" in result
        assert info == {}

    async def test_dispatches_create_task(self):
        with patch("services.tool_executor._execute_create_task", new_callable=AsyncMock, return_value=("ok", {})) as m:
            await execute_tool("create_task", {"project_name": "P", "title": "T"}, "u1")
        m.assert_awaited_once_with({"project_name": "P", "title": "T"}, "u1")

    async def test_dispatches_update_task(self):
        with patch("services.tool_executor._execute_update_task", new_callable=AsyncMock, return_value=("ok", {})) as m:
            await execute_tool("update_task", {"task_number": 1, "project_name": "P"}, "u1")
        m.assert_awaited_once()

    async def test_dispatches_create_note(self):
        with patch("services.tool_executor._execute_create_note", new_callable=AsyncMock, return_value=("ok", {})) as m:
            await execute_tool("create_note", {"project_name": "P", "title": "T", "body": "B"}, "u1")
        m.assert_awaited_once()

    async def test_dispatches_update_note(self):
        with patch("services.tool_executor._execute_update_note", new_callable=AsyncMock, return_value=("ok", {})) as m:
            await execute_tool("update_note", {"note_title": "N", "project_name": "P"}, "u1")
        m.assert_awaited_once()

    async def test_dispatches_update_project(self):
        with patch("services.tool_executor._execute_update_project", new_callable=AsyncMock, return_value=("ok", {})) as m:
            await execute_tool("update_project", {"project_name": "P"}, "u1")
        m.assert_awaited_once()

    async def test_dispatches_delete_task(self):
        with patch("services.tool_executor._execute_delete_task", new_callable=AsyncMock, return_value=("ok", {})) as m:
            await execute_tool("delete_task", {"task_number": 1, "project_name": "P"}, "u1")
        m.assert_awaited_once()

    async def test_dispatches_delete_note(self):
        with patch("services.tool_executor._execute_delete_note", new_callable=AsyncMock, return_value=("ok", {})) as m:
            await execute_tool("delete_note", {"note_title": "N", "project_name": "P"}, "u1")
        m.assert_awaited_once()

    async def test_dispatches_delete_project(self):
        with patch("services.tool_executor._execute_delete_project", new_callable=AsyncMock, return_value=("ok", {})) as m:
            await execute_tool("delete_project", {"project_name": "P"}, "u1")
        m.assert_awaited_once()


# ─── _execute_create_task ────────────────────────────────────────────────────

def _mock_httpx_response(status_code: int, json_data: dict):
    resp = MagicMock(spec=httpx.Response)
    resp.status_code = status_code
    resp.json.return_value = json_data
    resp.text = str(json_data)
    return resp


class TestExecuteCreateTask:
    async def test_project_not_found(self):
        with patch("services.tool_executor._resolve_project_slug", new_callable=AsyncMock, return_value=(None, None)):
            result, info = await _execute_create_task({"project_name": "NoProj", "title": "T"}, "u1")
        assert "not found" in result

    async def test_success(self):
        with (
            patch("services.tool_executor._resolve_project_slug", new_callable=AsyncMock, return_value=("alpha", "Alpha")),
            patch("services.tool_executor.INTERNAL_API_SECRET", "secret"),
            patch("httpx.AsyncClient") as MockClient,
        ):
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=_mock_httpx_response(201, {"title": "Build dashboard"}))
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = mock_client

            result, info = await _execute_create_task(
                {"project_name": "Alpha", "title": "Build dashboard", "priority": "HIGH"}, "u1"
            )
        assert "successfully" in result
        assert "Build dashboard" in result
        assert info["sources"] == ["write_task"]

    async def test_api_error(self):
        with (
            patch("services.tool_executor._resolve_project_slug", new_callable=AsyncMock, return_value=("aa", "AA")),
            patch("services.tool_executor.INTERNAL_API_SECRET", "s"),
            patch("httpx.AsyncClient") as MockClient,
        ):
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=_mock_httpx_response(400, {"error": "Title required"}))
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = mock_client

            result, info = await _execute_create_task({"project_name": "AA", "title": ""}, "u1")
        assert "Failed" in result
        assert "Title required" in result


# ─── _execute_update_task ────────────────────────────────────────────────────

class TestExecuteUpdateTask:
    async def test_missing_task_number(self):
        result, _ = await _execute_update_task({"project_name": "P"}, "u1")
        assert "required" in result

    async def test_task_not_found(self):
        with patch("services.tool_executor._resolve_task_id", new_callable=AsyncMock, return_value=None):
            result, _ = await _execute_update_task({"task_number": 9, "project_name": "P"}, "u1")
        assert "not found" in result

    async def test_success_with_changes(self):
        task = {"id": "t1", "title": "Old", "body": "", "status": "TODO", "priority": "MEDIUM", "dueDate": None, "projectSlug": "p"}
        with (
            patch("services.tool_executor._resolve_task_id", new_callable=AsyncMock, return_value=task),
            patch("services.tool_executor.INTERNAL_API_SECRET", "s"),
            patch("httpx.AsyncClient") as MockClient,
        ):
            mock_client = AsyncMock()
            mock_client.patch = AsyncMock(return_value=_mock_httpx_response(200, {"title": "New Title"}))
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = mock_client

            result, info = await _execute_update_task(
                {"task_number": 1, "project_name": "P", "status": "DONE"}, "u1"
            )
        assert "#1 updated" in result
        assert "DONE" in result

    async def test_clear_due_date(self):
        from datetime import date
        task = {"id": "t1", "title": "T", "body": "", "status": "TODO", "priority": "LOW", "dueDate": date(2026, 5, 1), "projectSlug": "p"}
        with (
            patch("services.tool_executor._resolve_task_id", new_callable=AsyncMock, return_value=task),
            patch("services.tool_executor.INTERNAL_API_SECRET", "s"),
            patch("httpx.AsyncClient") as MockClient,
        ):
            mock_client = AsyncMock()
            mock_client.patch = AsyncMock(return_value=_mock_httpx_response(200, {}))
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = mock_client

            result, _ = await _execute_update_task(
                {"task_number": 1, "project_name": "P", "due_date": "none"}, "u1"
            )
        # Verify the payload sent had dueDate=None (clearing it)
        call_kwargs = mock_client.patch.call_args
        assert call_kwargs.kwargs["json"]["dueDate"] is None


# ─── _execute_create_note ────────────────────────────────────────────────────

class TestExecuteCreateNote:
    async def test_project_not_found(self):
        with patch("services.tool_executor._resolve_project_slug", new_callable=AsyncMock, return_value=(None, None)):
            result, _ = await _execute_create_note({"project_name": "Ghost", "title": "T", "body": "B"}, "u1")
        assert "not found" in result

    async def test_success(self):
        with (
            patch("services.tool_executor._resolve_project_slug", new_callable=AsyncMock, return_value=("alpha", "Alpha")),
            patch("services.tool_executor.INTERNAL_API_SECRET", "s"),
            patch("httpx.AsyncClient") as MockClient,
        ):
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=_mock_httpx_response(201, {"title": "Notes"}))
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = mock_client

            result, info = await _execute_create_note(
                {"project_name": "Alpha", "title": "Notes", "body": "Hello"}, "u1"
            )
        assert "successfully" in result
        assert info["sources"] == ["write_note"]

    async def test_api_error(self):
        with (
            patch("services.tool_executor._resolve_project_slug", new_callable=AsyncMock, return_value=("a", "A")),
            patch("services.tool_executor.INTERNAL_API_SECRET", "s"),
            patch("httpx.AsyncClient") as MockClient,
        ):
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=_mock_httpx_response(400, {"error": "Body too long"}))
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = mock_client

            result, _ = await _execute_create_note(
                {"project_name": "A", "title": "T", "body": "B"}, "u1"
            )
        assert "Failed" in result
        assert "Body too long" in result


# ─── _execute_update_note ────────────────────────────────────────────────────

class TestExecuteUpdateNote:
    async def test_missing_note_title(self):
        result, _ = await _execute_update_note({"project_name": "P"}, "u1")
        assert "required" in result

    async def test_note_not_found(self):
        with patch("services.tool_executor._resolve_note_id", new_callable=AsyncMock, return_value=None):
            result, _ = await _execute_update_note(
                {"note_title": "Ghost", "project_name": "P"}, "u1"
            )
        assert "not found" in result

    async def test_success(self):
        note = {"id": "n1", "title": "Old Title", "body": "Old body", "projectSlug": "alpha"}
        with (
            patch("services.tool_executor._resolve_note_id", new_callable=AsyncMock, return_value=note),
            patch("services.tool_executor.INTERNAL_API_SECRET", "s"),
            patch("httpx.AsyncClient") as MockClient,
        ):
            mock_client = AsyncMock()
            mock_client.patch = AsyncMock(return_value=_mock_httpx_response(200, {"title": "New Title"}))
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = mock_client

            result, info = await _execute_update_note(
                {"note_title": "Old Title", "project_name": "Alpha", "title": "New Title"}, "u1"
            )
        assert "updated" in result
        assert 'title → "New Title"' in result
        assert info["sources"] == ["write_note"]

    async def test_no_changes_message(self):
        note = {"id": "n1", "title": "Same", "body": "Same body", "projectSlug": "alpha"}
        with (
            patch("services.tool_executor._resolve_note_id", new_callable=AsyncMock, return_value=note),
            patch("services.tool_executor.INTERNAL_API_SECRET", "s"),
            patch("httpx.AsyncClient") as MockClient,
        ):
            mock_client = AsyncMock()
            mock_client.patch = AsyncMock(return_value=_mock_httpx_response(200, {}))
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = mock_client

            result, _ = await _execute_update_note(
                {"note_title": "Same", "project_name": "Alpha"}, "u1"
            )
        assert "no fields changed" in result


# ─── _execute_update_project ─────────────────────────────────────────────────

class TestExecuteUpdateProject:
    async def test_project_not_found(self):
        conn = _make_conn([None])
        pool = _pool_with_conn(conn)
        conn.fetchrow = AsyncMock(return_value=None)
        with patch("db.get_pool", new_callable=AsyncMock, return_value=pool):
            result, _ = await _execute_update_project({"project_name": "Ghost"}, "u1")
        assert "not found" in result

    async def test_success(self):
        row = {"id": "p1", "title": "Alpha", "description": "Old desc", "visibility": "PRIVATE"}
        conn = _make_conn([row])
        pool = _pool_with_conn(conn)
        conn.fetchrow = AsyncMock(return_value=row)
        with (
            patch("db.get_pool", new_callable=AsyncMock, return_value=pool),
            patch("services.tool_executor.INTERNAL_API_SECRET", "s"),
            patch("httpx.AsyncClient") as MockClient,
        ):
            mock_client = AsyncMock()
            mock_client.patch = AsyncMock(return_value=_mock_httpx_response(200, {"title": "Alpha"}))
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = mock_client

            result, info = await _execute_update_project(
                {"project_name": "Alpha", "description": "New desc", "visibility": "PUBLIC"}, "u1"
            )
        assert "updated" in result
        assert "description updated" in result
        assert "PUBLIC" in result

    async def test_api_error(self):
        row = {"id": "p1", "title": "Alpha", "description": "", "visibility": "PRIVATE"}
        conn = _make_conn([row])
        pool = _pool_with_conn(conn)
        conn.fetchrow = AsyncMock(return_value=row)
        with (
            patch("db.get_pool", new_callable=AsyncMock, return_value=pool),
            patch("services.tool_executor.INTERNAL_API_SECRET", "s"),
            patch("httpx.AsyncClient") as MockClient,
        ):
            mock_client = AsyncMock()
            mock_client.patch = AsyncMock(return_value=_mock_httpx_response(500, {"error": "DB error"}))
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = mock_client

            result, _ = await _execute_update_project({"project_name": "Alpha"}, "u1")
        assert "Failed" in result

# ��� _execute_delete_task �����������������������������������������������������

class TestExecuteDeleteTask:
    @pytest.fixture(autouse=True)
    def _patch_pool(self):
        self.conn = _make_conn([])
        self.pool = _pool_with_conn(self.conn)
        with patch("db.get_pool", new_callable=AsyncMock, return_value=self.pool):
            yield

    async def test_task_not_found(self):
        self.conn.fetchrow = AsyncMock(return_value=None)
        result, info = await _execute_delete_task({"task_number": 99, "project_name": "Alpha"}, "u1")
        assert "not found" in result
        assert info == {}

    async def test_missing_task_number(self):
        result, info = await _execute_delete_task({"project_name": "Alpha"}, "u1")
        assert "required" in result
        assert info == {}

    async def test_stages_deletion(self):
        row = {"id": "t1", "title": "Fix bug", "body": "", "status": "TODO",
               "priority": "HIGH", "dueDate": None, "projectSlug": "alpha"}
        self.conn.fetchrow = AsyncMock(return_value=row)
        result, info = await _execute_delete_task({"task_number": 1, "project_name": "Alpha"}, "u1")
        assert "ready to be deleted" in result or "awaiting user confirmation" in result
        assert info.get("requires_confirmation") is True
        confirm = info.get("confirm_data", {})
        assert confirm.get("type") == "delete_task"
        assert confirm.get("taskId") == "t1"
        assert confirm.get("taskNumber") == 1
        assert confirm.get("taskTitle") == "Fix bug"



# ��� _execute_delete_note �����������������������������������������������������

class TestExecuteDeleteNote:
    @pytest.fixture(autouse=True)
    def _patch_pool(self):
        self.conn = _make_conn([])
        self.pool = _pool_with_conn(self.conn)
        with patch("db.get_pool", new_callable=AsyncMock, return_value=self.pool):
            yield

    async def test_missing_note_title(self):
        result, info = await _execute_delete_note({"project_name": "Alpha"}, "u1")
        assert "required" in result
        assert info == {}

    async def test_note_not_found(self):
        self.conn.fetchrow = AsyncMock(side_effect=[None, None])
        result, info = await _execute_delete_note({"note_title": "Ghost", "project_name": "Alpha"}, "u1")
        assert "not found" in result
        assert info == {}

    async def test_stages_deletion(self):
        row = {"id": "n1", "title": "Sprint Plan", "body": "...", "projectSlug": "alpha"}
        self.conn.fetchrow = AsyncMock(return_value=row)
        result, info = await _execute_delete_note({"note_title": "Sprint Plan", "project_name": "Alpha"}, "u1")
        assert "ready to be deleted" in result or "confirm" in result.lower()
        assert info.get("requires_confirmation") is True
        confirm = info.get("confirm_data", {})
        assert confirm.get("type") == "delete_note"
        assert confirm.get("noteId") == "n1"
        assert confirm.get("noteTitle") == "Sprint Plan"


# ��� _execute_delete_project ��������������������������������������������������

class TestExecuteDeleteProject:
    @pytest.fixture(autouse=True)
    def _patch_pool(self):
        self.conn = _make_conn([])
        self.pool = _pool_with_conn(self.conn)
        with patch("db.get_pool", new_callable=AsyncMock, return_value=self.pool):
            yield

    async def test_missing_project_name(self):
        result, info = await _execute_delete_project({}, "u1")
        assert "required" in result
        assert info == {}

    async def test_project_not_found_slug(self):
        self.conn.fetchrow = AsyncMock(return_value=None)
        result, info = await _execute_delete_project({"project_name": "Ghost"}, "u1")
        assert "not found" in result
        assert info == {}

    async def test_stages_deletion_with_counts(self):
        # First fetchrow: _resolve_project_slug (exact match)
        slug_row = {"slug": "alpha", "title": "Alpha"}
        # Second fetchrow: cascade counts
        counts_row = {"id": "p1", "task_count": 3, "note_count": 2}
        self.conn.fetchrow = AsyncMock(side_effect=[slug_row, counts_row])
        result, info = await _execute_delete_project({"project_name": "Alpha"}, "u1")
        assert "ready to be deleted" in result or "confirm" in result.lower()
        assert info.get("requires_confirmation") is True
        confirm = info.get("confirm_data", {})
        assert confirm.get("type") == "delete_project"
        assert confirm.get("projectId") == "p1"
        assert confirm.get("taskCount") == 3
        assert confirm.get("noteCount") == 2
