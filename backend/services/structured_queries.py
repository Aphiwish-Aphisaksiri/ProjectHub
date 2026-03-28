from db import get_pool


async def run_structured_query(
    user_id: str,
    intent: str,
    project_name: str | None,
    status: str | None,
    priority: str | None
) -> str:
    pool = await get_pool()
    async with pool.acquire() as conn:
        if intent == "get_project_details":
            if project_name:
                rows = await conn.fetch("""
                    SELECT p.title, p.description, p.visibility, p."createdAt",
                           COUNT(DISTINCT t.id) as task_count,
                           COUNT(DISTINCT n.id) as note_count
                    FROM "Project" p
                    LEFT JOIN "Task" t ON t."projectId" = p.id
                    LEFT JOIN "Note" n ON n."projectId" = p.id
                    WHERE p."ownerId" = $1 AND LOWER(p.title) LIKE LOWER($2)
                    GROUP BY p.id, p.title, p.description, p.visibility, p."createdAt"
                """, user_id, f"%{project_name}%")
            else:
                rows = await conn.fetch("""
                    SELECT p.title, p.description, p.visibility, p."createdAt",
                           COUNT(DISTINCT t.id) as task_count,
                           COUNT(DISTINCT n.id) as note_count
                    FROM "Project" p
                    LEFT JOIN "Task" t ON t."projectId" = p.id
                    LEFT JOIN "Note" n ON n."projectId" = p.id
                    WHERE p."ownerId" = $1
                    GROUP BY p.id, p.title, p.description, p.visibility, p."createdAt"
                    ORDER BY p."createdAt" DESC
                """, user_id)
            if not rows:
                return "No projects found."
            parts = []
            for r in rows:
                parts.append(
                    f"Project: {r['title']} | {r['task_count']} tasks, {r['note_count']} notes"
                    f" | Visibility: {r['visibility']} | Created: {r['createdAt'].date()}"
                )
                if r["description"]:
                    parts.append(f"  Description: {r['description']}")
            return "\n".join(parts)

        elif intent in ("list_tasks_by_status", "list_tasks_by_priority"):
            params = [user_id]
            filters = ['p."ownerId" = $1']
            if status:
                params.append(status)
                filters.append(f't.status = ${len(params)}')
            if priority:
                params.append(priority)
                filters.append(f't.priority = ${len(params)}')
            if project_name:
                params.append(f"%{project_name}%")
                filters.append(f'LOWER(p.title) LIKE LOWER(${len(params)})')
            where = " AND ".join(filters)
            rows = await conn.fetch(f"""
                SELECT t."taskNumber", t.title, t.status, t.priority, t."dueDate", p.title as project
                FROM "Task" t
                JOIN "Project" p ON p.id = t."projectId"
                WHERE {where}
                ORDER BY t."taskNumber" DESC
                LIMIT 20
            """, *params)
            if not rows:
                return "No tasks found matching those filters."
            return "\n".join(
                f"[{r['project']}] #{r['taskNumber']} {r['title']} — {r['status']} / {r['priority']}"
                + (f" (due {r['dueDate'].date()})" if r["dueDate"] else "")
                for r in rows
            )

        elif intent == "count_tasks":
            params = [user_id]
            filters = ['p."ownerId" = $1']
            if status:
                params.append(status)
                filters.append(f't.status = ${len(params)}')
            if priority:
                params.append(priority)
                filters.append(f't.priority = ${len(params)}')
            if project_name:
                params.append(f"%{project_name}%")
                filters.append(f'LOWER(p.title) LIKE LOWER(${len(params)})')
            where = " AND ".join(filters)
            row = await conn.fetchrow(f"""
                SELECT COUNT(*) as total
                FROM "Task" t
                JOIN "Project" p ON p.id = t."projectId"
                WHERE {where}
            """, *params)
            label_parts = []
            if status: label_parts.append(status)
            if priority: label_parts.append(priority)
            if project_name: label_parts.append(f"in {project_name}")
            label = " ".join(label_parts) if label_parts else "total"
            return f"{row['total']} {label} task(s) found."

        elif intent == "get_notes_for_project":
            params = [user_id]
            filters = ['p."ownerId" = $1']
            if project_name:
                params.append(f"%{project_name}%")
                filters.append(f'LOWER(p.title) LIKE LOWER(${len(params)})')
            where = " AND ".join(filters)
            rows = await conn.fetch(f"""
                SELECT n.title, n."createdAt", p.title as project
                FROM "Note" n
                JOIN "Project" p ON p.id = n."projectId"
                WHERE {where}
                ORDER BY n."createdAt" DESC
                LIMIT 20
            """, *params)
            if not rows:
                return "No notes found."
            return "\n".join(
                f"[{r['project']}] {r['title']} (created {r['createdAt'].date()})"
                for r in rows
            )

    return "Unknown query intent."
