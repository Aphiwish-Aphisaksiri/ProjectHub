import json
from embeddings import get_embedding
from services.search import (
    detect_project_scope,
    search_user_projects_scoped,
    SIMILARITY_THRESHOLD,
)
from services.structured_queries import run_structured_query

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
    }
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

    return f"Unknown tool: {name}", {}
