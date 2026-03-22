"""
Unit tests for the pure helper functions in routes/chat.py

- build_prompt: no external dependencies, fully deterministic
"""

from routes.chat import build_prompt


# ─── build_prompt ─────────────────────────────────────────────────────────────

class TestBuildPrompt:
    def test_first_message_is_system(self):
        messages = build_prompt("hello", [], [])
        assert messages[0]["role"] == "system"

    def test_last_message_is_user_input(self):
        messages = build_prompt("my question", [], [])
        assert messages[-1] == {"role": "user", "content": "my question"}

    def test_no_context_shows_placeholder(self):
        messages = build_prompt("hello", [], [])
        assert "No relevant projects found." in messages[0]["content"]

    def test_with_context_includes_project_title_and_content(self):
        context = [{
            "projectId": "p1",
            "projectTitle": "Alpha",
            "sourceTable": "task",
            "textContent": "Fix the login bug",
            "similarity": 0.9,
        }]
        messages = build_prompt("q", context, [])
        system = messages[0]["content"]
        assert "Alpha" in system
        assert "Fix the login bug" in system

    def test_project_header_appears_exactly_once_per_project(self):
        # Two rows for the same project → header should only appear once
        context = [
            {"projectId": "p1", "projectTitle": "Alpha", "sourceTable": "task",
             "textContent": "Task A", "similarity": 0.9},
            {"projectId": "p1", "projectTitle": "Alpha", "sourceTable": "note",
             "textContent": "Note B", "similarity": 0.85},
        ]
        messages = build_prompt("q", context, [])
        assert messages[0]["content"].count("Project: Alpha") == 1

    def test_multiple_projects_each_have_a_header(self):
        context = [
            {"projectId": "p1", "projectTitle": "Alpha", "sourceTable": "task",
             "textContent": "A", "similarity": 0.9},
            {"projectId": "p2", "projectTitle": "Beta", "sourceTable": "task",
             "textContent": "B", "similarity": 0.8},
        ]
        messages = build_prompt("q", context, [])
        system = messages[0]["content"]
        assert "Project: Alpha" in system
        assert "Project: Beta" in system

    def test_history_is_inserted_before_user_message(self):
        history = [
            {"role": "user", "content": "prev q"},
            {"role": "assistant", "content": "prev a"},
        ]
        messages = build_prompt("new q", [], history)
        # system + 2 history + user = 4
        assert len(messages) == 4
        assert messages[1] == history[0]
        assert messages[2] == history[1]

    def test_history_under_10_messages_is_kept_in_full(self):
        history = [{"role": "user", "content": str(i)} for i in range(8)]
        messages = build_prompt("q", [], history)
        assert len(messages) == 10  # system + 8 + user

    def test_history_trimmed_to_last_10_messages(self):
        history = [{"role": "user", "content": str(i)} for i in range(15)]
        messages = build_prompt("q", [], history)
        # system + 10 history + user = 12
        assert len(messages) == 12
        included_contents = [m["content"] for m in messages[1:-1]]
        assert included_contents == [str(i) for i in range(5, 15)]

    def test_empty_history_produces_only_system_and_user(self):
        messages = build_prompt("hi", [], [])
        assert len(messages) == 2
