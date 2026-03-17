import asyncpg
import os
from dotenv import load_dotenv
from cuid2 import cuid_wrapper

load_dotenv()

_pool = None

cuid = cuid_wrapper()

async def get_pool():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(os.getenv("DATABASE_URL"))
    return _pool

async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None

async def log_chat(
    user_id: str,
    query: str,
    extracted_query: str,
    context_sources: list[str],
    similarity_scores: list[float],
    result_count: int,
    prompt_tokens: int,
    completion_tokens: int,
    total_duration_ms: float,
    tokens_per_second: float,
    threshold: float
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO "ChatLog" (
                id, "userId", query, "extractedQuery",
                "contextSources", "similarityScores", "resultCount",
                "promptTokens", "completionTokens", "totalDurationMs",
                "tokensPerSecond", threshold, "createdAt"
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
        """,
            cuid(), user_id, query, extracted_query,
            context_sources, similarity_scores, result_count,
            prompt_tokens, completion_tokens, total_duration_ms,
            tokens_per_second, threshold
        )
