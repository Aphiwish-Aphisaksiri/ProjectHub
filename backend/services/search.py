import re
from difflib import SequenceMatcher
from db import get_pool

SIMILARITY_THRESHOLD = 0.4


# ─── Vector search ────────────────────────────────────────────────────────────

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


async def search_user_projects_scoped(
    user_id: str,
    embedding: list[float],
    limit: int = 5,
    project_id: str | None = None,
) -> list[dict]:
    pool = await get_pool()
    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
    async with pool.acquire() as conn:
        if project_id:
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
                  AND p.id = $2
                ORDER BY v.embedding <=> '{embedding_str}'::vector
                LIMIT $3
            """, user_id, project_id, limit)
        else:
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


# ─── Project scope detection ──────────────────────────────────────────────────

def _normalize_for_match(text: str) -> str:
    lowered = text.lower().strip()
    cleaned = re.sub(r"[^a-z0-9\s]+", " ", lowered)
    return re.sub(r"\s+", " ", cleaned).strip()


def _project_match_score(query_norm: str, title_norm: str) -> float:
    if not query_norm or not title_norm:
        return 0.0

    # Strong signals for partial naming, e.g. "fitflow" vs
    # "fitflow virtual yoga instructor".
    if title_norm in query_norm:
        return 1.0
    if query_norm in title_norm and len(query_norm) >= 4:
        return 0.95

    query_tokens = set(query_norm.split())
    title_tokens = set(title_norm.split())
    if not query_tokens or not title_tokens:
        return 0.0

    overlap = len(query_tokens & title_tokens) / len(title_tokens)
    first_title_token = title_norm.split()[0]
    has_prefix_token = first_title_token in query_tokens
    ratio = SequenceMatcher(None, query_norm, title_norm).ratio()

    score = max(overlap, ratio)
    if has_prefix_token and len(first_title_token) >= 4:
        score = max(score, 0.85)
    return score


async def detect_project_scope(user_id: str, query: str) -> dict | None:
    pool = await get_pool()
    query_norm = _normalize_for_match(query)
    if not query_norm:
        return None

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, title
            FROM "Project"
            WHERE "ownerId" = $1
            """,
            user_id,
        )

    if not rows:
        return None

    scored: list[tuple[float, str, str]] = []
    for row in rows:
        title = str(row["title"])
        score = _project_match_score(query_norm, _normalize_for_match(title))
        scored.append((score, str(row["id"]), title))

    scored.sort(key=lambda x: x[0], reverse=True)
    best_score, best_id, best_title = scored[0]
    second_score = scored[1][0] if len(scored) > 1 else 0.0

    # Require a reasonably strong top match and enough gap to avoid wrong scoping.
    if best_score < 0.72:
        return None
    if second_score >= 0.68 and (best_score - second_score) < 0.08:
        return None

    return {"project_id": best_id, "project_title": best_title, "score": round(best_score, 3)}
