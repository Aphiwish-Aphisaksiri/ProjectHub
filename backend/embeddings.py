import httpx
import os
from cuid2 import cuid_wrapper
from db import get_pool

cuid = cuid_wrapper()
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
EMBED_MODEL = "nomic-embed-text"

async def get_embedding(text: str) -> list[float]:
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(f"{OLLAMA_URL}/api/embeddings", json={
            "model": EMBED_MODEL,
            "prompt": text
        })
        return res.json()["embedding"]

def chunk_text(text: str, max_tokens: int = 400, overlap: int = 50) -> list[str]:
    # Simple word-based chunking — good enough for titles/descriptions
    # When you add Notes, this handles long content automatically
    words = text.split()
    if len(words) <= max_tokens:
        return [text]

    chunks = []
    start = 0
    while start < len(words):
        end = min(start + max_tokens, len(words))
        chunks.append(" ".join(words[start:end]))
        start += max_tokens - overlap  # slide with overlap

    return chunks

async def delete_embeddings(source_table: str, source_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            DELETE FROM "Vector"
            WHERE "sourceTable" = $1 AND "sourceId" = $2
        """, source_table, source_id)

async def delete_project_embeddings(project_id: str):
    """Delete ALL vectors for a project (tasks, notes, and the project itself)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            DELETE FROM "Vector" WHERE "projectId" = $1
        """, project_id)

async def store_embedding(
    project_id: str,
    source_table: str,
    source_id: str,
    chunk_index: int,
    text_content: str,
    embedding: list[float]
):
    pool = await get_pool()
    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
    async with pool.acquire() as conn:
        await conn.execute(f"""
            INSERT INTO "Vector" (id, "projectId", "sourceTable", "sourceId", "chunkIndex", "textContent", embedding)
            VALUES ($1, $2, $3, $4, $5, $6, $7::vector)
        """, cuid(), project_id, source_table, source_id, chunk_index, text_content, embedding_str)

async def embed_source(project_id: str, source_table: str, source_id: str, text: str):
    # Delete old embeddings for this source first
    await delete_embeddings(source_table, source_id)

    # Chunk and embed
    chunks = chunk_text(text)
    for i, chunk in enumerate(chunks):
        embedding = await get_embedding(chunk)
        await store_embedding(project_id, source_table, source_id, i, chunk, embedding)