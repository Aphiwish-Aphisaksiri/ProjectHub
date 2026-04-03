import json
import os
import httpx
from embeddings import get_embedding
from services.search import (
    detect_project_scope,
    search_user_projects_scoped,
    SIMILARITY_THRESHOLD,
)
from services.structured_queries import run_structured_query

NEXTJS_URL = os.getenv("NEXTJS_URL", "http://dev:3000")
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "")

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
    },
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": (
                "Create a new task in one of the user's projects. "
                "Use this when the user explicitly asks to create/add a task."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "project_name": {
                        "type": "string",
                        "description": "The exact project title to create the task in"
                    },
                    "title": {
                        "type": "string",
                        "description": "The task title"
                    },
                    "body": {
                        "type": "string",
                        "description": "Optional task description/body"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["TODO", "IN_PROGRESS", "DONE", "ARCHIVED"],
                        "description": "Task status (default: TODO)"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["LOW", "MEDIUM", "HIGH"],
                        "description": "Task priority (default: MEDIUM)"
                    },
                    "due_date": {
                        "type": "string",
                        "description": "Due date in ISO 8601 format (e.g. 2026-04-01)"
                    }
                },
                "required": ["project_name", "title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": (
                "Update an existing task's status, priority, title, body, or due date. "
                "Use this when the user asks to change/update/edit a task. "
                "You MUST first call query_structured_data to find the task number before updating."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "task_number": {
                        "type": "integer",
                        "description": "The task number (e.g. #1, #5) to update"
                    },
                    "project_name": {
                        "type": "string",
                        "description": "The project title the task belongs to"
                    },
                    "title": {
                        "type": "string",
                        "description": "New task title (omit to keep current)"
                    },
                    "body": {
                        "type": "string",
                        "description": "New task body (omit to keep current)"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["TODO", "IN_PROGRESS", "DONE", "ARCHIVED"],
                        "description": "New status"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["LOW", "MEDIUM", "HIGH"],
                        "description": "New priority"
                    },
                    "due_date": {
                        "type": "string",
                        "description": "New due date in ISO 8601 format, or 'none' to clear"
                    }
                },
                "required": ["task_number", "project_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_note",
            "description": (
                "Create a new note in one of the user's projects. "
                "Use this when the user explicitly asks to create/add a note."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "project_name": {
                        "type": "string",
                        "description": "The exact project title to create the note in"
                    },
                    "title": {
                        "type": "string",
                        "description": "The note title"
                    },
                    "body": {
                        "type": "string",
                        "description": "The note content (supports markdown)"
                    }
                },
                "required": ["project_name", "title", "body"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_note",
            "description": (
                "Update an existing note's title or body. "
                "Use this when the user asks to change/edit a note. "
                "You MUST first call query_structured_data with get_notes_for_project to find the note title before updating."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "note_title": {
                        "type": "string",
                        "description": "The current title of the note to update"
                    },
                    "project_name": {
                        "type": "string",
                        "description": "The project title the note belongs to"
                    },
                    "title": {
                        "type": "string",
                        "description": "New note title (omit to keep current)"
                    },
                    "body": {
                        "type": "string",
                        "description": "New note body/content (supports markdown)"
                    }
                },
                "required": ["note_title", "project_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_project",
            "description": (
                "Update a project's description or visibility. "
                "Use this when the user asks to change project details."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "project_name": {
                        "type": "string",
                        "description": "The current project title"
                    },
                    "title": {
                        "type": "string",
                        "description": "New project title (omit to keep current)"
                    },
                    "description": {
                        "type": "string",
                        "description": "New project description"
                    },
                    "visibility": {
                        "type": "string",
                        "enum": ["PRIVATE", "PUBLIC"],
                        "description": "New visibility setting"
                    }
                },
                "required": ["project_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_task",
            "description": (
                "Stage a task for permanent deletion. Use ONLY when the user explicitly asks to "
                "delete or remove a task. This does NOT delete immediately — it will ask the user "
                "to confirm before any data is removed. "
                "You MUST call query_structured_data first to confirm the task exists."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "task_number": {
                        "type": "integer",
                        "description": "The task number (e.g. #1, #5) to delete"
                    },
                    "project_name": {
                        "type": "string",
                        "description": "The project title the task belongs to"
                    }
                },
                "required": ["task_number", "project_name"]
            }
        }
    },
]

# ─── Tool dispatcher ──────────────────────────────────────────────────────────

async def execute_tool(name: str, args: dict, user_id: str) -> tuple[str, dict]:
    """Execute a named tool. Returns (result_string, log_info)."""
    if name == "search_project_data":
        query = args.get("query", "")
        limit = min(int(args.get("limit", 5)), 10)
        scoped_project = await detect_project_scope(user_id, query)
        embedding = await get_embedding(query)
        rows = await search_user_projects_scoped(
            user_id,
            embedding,
            limit,
            project_id=scoped_project["project_id"] if scoped_project else None,
        )
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
            "count": len(relevant),
            "scoped_project": scoped_project["project_title"] if scoped_project else None,
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

    elif name == "create_task":
        return await _execute_create_task(args, user_id)

    elif name == "update_task":
        return await _execute_update_task(args, user_id)

    elif name == "create_note":
        return await _execute_create_note(args, user_id)

    elif name == "update_note":
        return await _execute_update_note(args, user_id)

    elif name == "update_project":
        return await _execute_update_project(args, user_id)

    elif name == "delete_task":
        return await _execute_delete_task(args, user_id)

    return f"Unknown tool: {name}", {}


# ─── Write tool helpers ───────────────────────────────────────────────────────

async def _resolve_project_slug(user_id: str, project_name: str) -> tuple[str | None, str | None]:
    """Look up the project slug by fuzzy-matching the project name."""
    from db import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            'SELECT slug, title FROM "Project" WHERE "ownerId" = $1 AND LOWER(title) = LOWER($2)',
            user_id, project_name,
        )
        if row:
            return row["slug"], row["title"]
        # Fallback: partial match
        row = await conn.fetchrow(
            'SELECT slug, title FROM "Project" WHERE "ownerId" = $1 AND LOWER(title) LIKE LOWER($2) LIMIT 1',
            user_id, f"%{project_name}%",
        )
        return (row["slug"], row["title"]) if row else (None, None)


async def _resolve_task_id(user_id: str, task_number: int, project_name: str) -> dict | None:
    """Look up a task by its number + project name, returning its current data."""
    from db import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT t.id, t.title, t.body, t.status, t.priority, t."dueDate", p.slug as "projectSlug"
            FROM "Task" t
            JOIN "Project" p ON p.id = t."projectId"
            WHERE t."taskNumber" = $1 AND p."ownerId" = $2 AND LOWER(p.title) LIKE LOWER($3)
        """, task_number, user_id, f"%{project_name}%")
        if row:
            return dict(row)
    return None


def _internal_headers() -> dict:
    return {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_API_SECRET,
    }


async def _execute_create_task(args: dict, user_id: str) -> tuple[str, dict]:
    project_name = args.get("project_name", "")
    slug, resolved_title = await _resolve_project_slug(user_id, project_name)
    if not slug:
        return f"Project '{project_name}' not found.", {}

    payload = {
        "userId": user_id,
        "projectSlug": slug,
        "title": args.get("title", ""),
        "body": args.get("body"),
        "status": args.get("status", "TODO"),
        "priority": args.get("priority", "MEDIUM"),
        "dueDate": args.get("due_date"),
    }

    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(f"{NEXTJS_URL}/api/tasks", json=payload, headers=_internal_headers())

    if res.status_code >= 400:
        error = res.json().get("error", res.text)
        return f"Failed to create task: {error}", {}

    data = res.json()
    return (
        f"Task created successfully in **{resolved_title}**: \"{data.get('title', args.get('title'))}\"",
        {"sources": ["write_task"], "scores": [], "count": 1},
    )


async def _execute_update_task(args: dict, user_id: str) -> tuple[str, dict]:
    task_number = args.get("task_number")
    project_name = args.get("project_name", "")
    if not task_number:
        return "Task number is required to update a task.", {}

    task = await _resolve_task_id(user_id, int(task_number), project_name)
    if not task:
        return f"Task #{task_number} not found in project '{project_name}'.", {}

    payload = {
        "userId": user_id,
        "taskId": task["id"],
        "title": args.get("title", task["title"]),
        "body": args.get("body", task["body"] or ""),
        "status": args.get("status", task["status"]),
        "priority": args.get("priority", task["priority"]),
        "dueDate": (
            None if args.get("due_date") == "none"
            else args.get("due_date") or (task["dueDate"].isoformat() if task["dueDate"] else None)
        ),
    }

    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.patch(f"{NEXTJS_URL}/api/tasks", json=payload, headers=_internal_headers())

    if res.status_code >= 400:
        error = res.json().get("error", res.text)
        return f"Failed to update task: {error}", {}

    changes = []
    if args.get("title"): changes.append(f"title → \"{args['title']}\"")
    if args.get("status"): changes.append(f"status → {args['status']}")
    if args.get("priority"): changes.append(f"priority → {args['priority']}")
    if args.get("due_date"): changes.append(f"due date → {args['due_date']}")
    if args.get("body"): changes.append("body updated")
    change_str = ", ".join(changes) if changes else "no fields changed"

    return (
        f"Task #{task_number} updated: {change_str}",
        {"sources": ["write_task"], "scores": [], "count": 1},
    )


async def _resolve_note_id(user_id: str, note_title: str, project_name: str) -> dict | None:
    """Look up a note by its title + project name, returning its current data."""
    from db import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT n.id, n.title, n.body, p.slug as "projectSlug"
            FROM "Note" n
            JOIN "Project" p ON p.id = n."projectId"
            WHERE LOWER(n.title) = LOWER($1) AND p."ownerId" = $2 AND LOWER(p.title) LIKE LOWER($3)
        """, note_title, user_id, f"%{project_name}%")
        if row:
            return dict(row)
        # Fallback: partial title match
        row = await conn.fetchrow("""
            SELECT n.id, n.title, n.body, p.slug as "projectSlug"
            FROM "Note" n
            JOIN "Project" p ON p.id = n."projectId"
            WHERE LOWER(n.title) LIKE LOWER($1) AND p."ownerId" = $2 AND LOWER(p.title) LIKE LOWER($3)
            LIMIT 1
        """, f"%{note_title}%", user_id, f"%{project_name}%")
        return dict(row) if row else None


async def _execute_create_note(args: dict, user_id: str) -> tuple[str, dict]:
    project_name = args.get("project_name", "")
    slug, resolved_title = await _resolve_project_slug(user_id, project_name)
    if not slug:
        return f"Project '{project_name}' not found.", {}

    payload = {
        "userId": user_id,
        "projectSlug": slug,
        "title": args.get("title", ""),
        "body": args.get("body", ""),
    }

    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(f"{NEXTJS_URL}/api/notes", json=payload, headers=_internal_headers())

    if res.status_code >= 400:
        error = res.json().get("error", res.text)
        return f"Failed to create note: {error}", {}

    data = res.json()
    return (
        f"Note created successfully in **{resolved_title}**: \"{data.get('title', args.get('title'))}\"",
        {"sources": ["write_note"], "scores": [], "count": 1},
    )


async def _execute_update_note(args: dict, user_id: str) -> tuple[str, dict]:
    note_title = args.get("note_title", "")
    project_name = args.get("project_name", "")
    if not note_title:
        return "Note title is required to update a note.", {}

    note = await _resolve_note_id(user_id, note_title, project_name)
    if not note:
        return f"Note '{note_title}' not found in project '{project_name}'.", {}

    new_title = args.get("title", note["title"])
    new_body = args.get("body", note["body"])

    payload = {
        "userId": user_id,
        "noteId": note["id"],
        "title": new_title,
        "body": new_body,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.patch(f"{NEXTJS_URL}/api/notes", json=payload, headers=_internal_headers())

    if res.status_code >= 400:
        error = res.json().get("error", res.text)
        return f"Failed to update note: {error}", {}

    changes = []
    if args.get("title"): changes.append(f'title → "{args["title"]}"')
    if args.get("body"): changes.append("body updated")
    change_str = ", ".join(changes) if changes else "no fields changed"

    return (
        f"Note \"{note['title']}\" updated: {change_str}",
        {"sources": ["write_note"], "scores": [], "count": 1},
    )


async def _execute_update_project(args: dict, user_id: str) -> tuple[str, dict]:
    project_name = args.get("project_name", "")

    # Look up the project to get its id
    from db import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            'SELECT id, title, description, visibility FROM "Project" WHERE "ownerId" = $1 AND LOWER(title) LIKE LOWER($2)',
            user_id, f"%{project_name}%",
        )
    if not row:
        return f"Project '{project_name}' not found.", {}

    payload = {
        "userId": user_id,
        "projectId": row["id"],
        "title": args.get("title", row["title"]),
        "description": args.get("description", row["description"] or ""),
        "visibility": args.get("visibility", row["visibility"]),
    }

    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.patch(f"{NEXTJS_URL}/api/projects", json=payload, headers=_internal_headers())

    if res.status_code >= 400:
        error = res.json().get("error", res.text)
        return f"Failed to update project: {error}", {}

    changes = []
    if args.get("title"): changes.append(f"title → \"{args['title']}\"")
    if args.get("description"): changes.append("description updated")
    if args.get("visibility"): changes.append(f"visibility → {args['visibility']}")
    change_str = ", ".join(changes) if changes else "no fields changed"

    return (
        f"Project **{row['title']}** updated: {change_str}",
        {"sources": ["write_project"], "scores": [], "count": 1},
    )


# ─── delete_task ─────────────────────────────────────────────────────────────

async def _execute_delete_task(args: dict, user_id: str) -> tuple[str, dict]:
    task_number = args.get("task_number")
    project_name = args.get("project_name", "")
    if not task_number:
        return "Task number is required to delete a task.", {}

    task = await _resolve_task_id(user_id, int(task_number), project_name)
    if not task:
        return f"Task #{task_number} not found in project '{project_name}'.", {}

    # Stage the deletion — the actual DELETE is performed by the frontend after
    # the user confirms via the confirmation UI.
    return (
        f"Task #{task_number} \"{task['title']}\" in project '{project_name}' is ready to be deleted. "
        f"Please confirm the deletion using the confirmation prompt above.",
        {
            "sources": ["delete_task_staged"],
            "scores": [],
            "count": 1,
            "requires_confirmation": True,
            "confirm_data": {
                "type": "delete_task",
                "taskId": task["id"],
                "taskNumber": task_number,
                "taskTitle": task["title"],
                "projectTitle": project_name,
            },
        },
    )
