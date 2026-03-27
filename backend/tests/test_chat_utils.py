"""
Unit tests for the pure helper functions in routes/chat.py

All functions tested here are fully deterministic with no external dependencies.
"""

import json
import httpx
from routes.chat import (
    build_rag_messages,
    build_system_prompt,
    build_notice_frame,
    thinking_fallback_notice,
    _is_retryable_thinking_error,
    _normalize_for_match,
    _project_match_score,
    build_query_extractor_messages,
)


# ─── build_rag_messages (replaced the old build_prompt) ──────────────────────

class TestBuildRagMessages:
    def test_first_message_is_system(self):
        messages = build_rag_messages("hello", [], [])
        assert messages[0]["role"] == "system"

    def test_last_message_is_user_input(self):
        messages = build_rag_messages("my question", [], [])
        assert messages[-1] == {"role": "user", "content": "my question"}

    def test_no_context_shows_placeholder(self):
        messages = build_rag_messages("hello", [], [])
        assert "No relevant projects found." in messages[0]["content"]

    def test_with_context_includes_project_title_and_content(self):
        context = [{
            "projectId": "p1",
            "projectTitle": "Alpha",
            "sourceTable": "task",
            "textContent": "Fix the login bug",
            "similarity": 0.9,
        }]
        messages = build_rag_messages("q", context, [])
        system = messages[0]["content"]
        assert "Alpha" in system
        assert "Fix the login bug" in system

    def test_project_header_appears_exactly_once_per_project(self):
        context = [
            {"projectId": "p1", "projectTitle": "Alpha", "sourceTable": "task",
             "textContent": "Task A", "similarity": 0.9},
            {"projectId": "p1", "projectTitle": "Alpha", "sourceTable": "note",
             "textContent": "Note B", "similarity": 0.85},
        ]
        messages = build_rag_messages("q", context, [])
        assert messages[0]["content"].count("Project: Alpha") == 1

    def test_multiple_projects_each_have_a_header(self):
        context = [
            {"projectId": "p1", "projectTitle": "Alpha", "sourceTable": "task",
             "textContent": "A", "similarity": 0.9},
            {"projectId": "p2", "projectTitle": "Beta", "sourceTable": "task",
             "textContent": "B", "similarity": 0.8},
        ]
        messages = build_rag_messages("q", context, [])
        system = messages[0]["content"]
        assert "Project: Alpha" in system
        assert "Project: Beta" in system

    def test_history_is_inserted_before_user_message(self):
        history = [
            {"role": "user", "content": "prev q"},
            {"role": "assistant", "content": "prev a"},
        ]
        messages = build_rag_messages("new q", [], history)
        assert len(messages) == 4
        assert messages[1] == history[0]
        assert messages[2] == history[1]

    def test_history_under_10_messages_is_kept_in_full(self):
        history = [{"role": "user", "content": str(i)} for i in range(8)]
        messages = build_rag_messages("q", [], history)
        assert len(messages) == 10  # system + 8 + user

    def test_history_trimmed_to_last_10_messages(self):
        history = [{"role": "user", "content": str(i)} for i in range(15)]
        messages = build_rag_messages("q", [], history)
        assert len(messages) == 12  # system + 10 history + user
        included_contents = [m["content"] for m in messages[1:-1]]
        assert included_contents == [str(i) for i in range(5, 15)]

    def test_empty_history_produces_only_system_and_user(self):
        messages = build_rag_messages("hi", [], [])
        assert len(messages) == 2


# ─── build_system_prompt ──────────────────────────────────────────────────────

class TestBuildSystemPrompt:
    def test_returns_string(self):
        assert isinstance(build_system_prompt(), str)

    def test_contains_tool_names(self):
        prompt = build_system_prompt()
        assert "search_project_data" in prompt
        assert "query_structured_data" in prompt

    def test_mentions_project_hub(self):
        assert "ProjectHub" in build_system_prompt()


# ─── build_notice_frame ──────────────────────────────────────────────────────

class TestBuildNoticeFrame:
    def test_wraps_message_with_sentinels(self):
        frame = build_notice_frame("something happened")
        assert frame.startswith("\x1e__NOTICE__")
        assert frame.endswith("\x1e")

    def test_payload_is_json_encoded(self):
        frame = build_notice_frame("hello")
        inner = frame.strip("\x1e").replace("__NOTICE__", "")
        assert json.loads(inner) == "hello"


# ─── thinking_fallback_notice ─────────────────────────────────────────────────

class TestThinkingFallbackNotice:
    def test_includes_model_name(self):
        notice = thinking_fallback_notice("llama3.1:8b")
        assert "llama3.1:8b" in notice

    def test_mentions_thinking_mode(self):
        notice = thinking_fallback_notice("some-model")
        assert "hinking" in notice  # "Thinking" or "thinking"


# ─── _is_retryable_thinking_error ────────────────────────────────────────────

class TestIsRetryableThinkingError:
    def test_read_timeout_is_retryable(self):
        exc = httpx.ReadTimeout("timed out")
        assert _is_retryable_thinking_error(exc) is True

    def test_connect_error_is_retryable(self):
        exc = httpx.ConnectError("refused")
        assert _is_retryable_thinking_error(exc) is True

    def test_remote_protocol_error_is_retryable(self):
        exc = httpx.RemoteProtocolError("reset")
        assert _is_retryable_thinking_error(exc) is True

    def test_thinking_keyword_in_message_is_retryable(self):
        exc = RuntimeError("thinking is not supported")
        assert _is_retryable_thinking_error(exc) is True

    def test_unknown_field_in_message_is_retryable(self):
        exc = ValueError("unknown field 'think'")
        assert _is_retryable_thinking_error(exc) is True

    def test_unrelated_error_is_not_retryable(self):
        exc = ValueError("division by zero")
        assert _is_retryable_thinking_error(exc) is False


# ─── _normalize_for_match ────────────────────────────────────────────────────

class TestNormalizeForMatch:
    def test_lowercases_and_strips(self):
        assert _normalize_for_match("  Hello World  ") == "hello world"

    def test_removes_punctuation(self):
        assert _normalize_for_match("fit-flow!") == "fit flow"

    def test_collapses_whitespace(self):
        assert _normalize_for_match("a   b   c") == "a b c"

    def test_empty_string(self):
        assert _normalize_for_match("") == ""


# ─── _project_match_score ────────────────────────────────────────────────────

class TestProjectMatchScore:
    def test_exact_match_returns_one(self):
        assert _project_match_score("alpha", "alpha") == 1.0

    def test_title_contained_in_query_returns_one(self):
        assert _project_match_score("tell me about alpha", "alpha") == 1.0

    def test_query_substring_of_title_scores_high(self):
        score = _project_match_score("fitflow", "fitflow virtual yoga")
        assert score >= 0.95

    def test_empty_query_returns_zero(self):
        assert _project_match_score("", "alpha") == 0.0

    def test_empty_title_returns_zero(self):
        assert _project_match_score("alpha", "") == 0.0

    def test_no_overlap_scores_low(self):
        score = _project_match_score("xyz", "abc def ghi")
        assert score < 0.5


# ─── build_query_extractor_messages ──────────────────────────────────────────

class TestBuildQueryExtractorMessages:
    def test_returns_system_and_user_messages(self):
        msgs = build_query_extractor_messages("hello", [])
        assert len(msgs) == 2
        assert msgs[0]["role"] == "system"
        assert msgs[1]["role"] == "user"

    def test_user_message_contains_latest_message(self):
        msgs = build_query_extractor_messages("find my tasks", [])
        payload = json.loads(msgs[1]["content"])
        assert payload["latest_message"] == "find my tasks"

    def test_history_is_included_in_payload(self):
        history = [{"role": "user", "content": "prev"}]
        msgs = build_query_extractor_messages("new", history)
        payload = json.loads(msgs[1]["content"])
        assert payload["history"] == history

    def test_history_trimmed_to_last_10(self):
        history = [{"role": "user", "content": str(i)} for i in range(20)]
        msgs = build_query_extractor_messages("q", history)
        payload = json.loads(msgs[1]["content"])
        assert len(payload["history"]) == 10
