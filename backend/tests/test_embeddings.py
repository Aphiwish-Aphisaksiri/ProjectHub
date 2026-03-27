"""
Unit tests for embeddings.py

- chunk_text: pure function, no mocking needed
- get_embedding: mocked via respx (intercepts httpx calls to Ollama)
"""

import json
import pytest
import respx
import httpx
from embeddings import chunk_text, get_embedding


# ─── chunk_text ───────────────────────────────────────────────────────────────

class TestChunkText:
    def test_empty_string_returns_single_chunk(self):
        assert chunk_text("") == [""]

    def test_short_text_stays_single_chunk(self):
        text = "hello world"
        assert chunk_text(text) == [text]

    def test_single_word(self):
        assert chunk_text("python") == ["python"]

    def test_exactly_max_tokens_is_single_chunk(self):
        words = ["word"] * 400
        text = " ".join(words)
        assert chunk_text(text, max_tokens=400) == [text]

    def test_one_word_over_max_splits_into_two_chunks(self):
        words = [str(i) for i in range(401)]
        text = " ".join(words)
        chunks = chunk_text(text, max_tokens=400, overlap=50)
        assert len(chunks) == 2

    def test_chunk_boundaries_are_correct(self):
        # 450 words, max=400, overlap=50
        # chunk 0: words 0–399  chunk 1: words 350–449
        words = [str(i) for i in range(450)]
        text = " ".join(words)
        chunks = chunk_text(text, max_tokens=400, overlap=50)
        assert len(chunks) == 2
        assert chunks[0] == " ".join(str(i) for i in range(400))
        assert chunks[1] == " ".join(str(i) for i in range(350, 450))

    def test_overlap_is_shared_between_consecutive_chunks(self):
        # 900 words → 3 chunks; last 50 words of chunk N == first 50 of chunk N+1
        words = [str(i) for i in range(900)]
        text = " ".join(words)
        chunks = chunk_text(text, max_tokens=400, overlap=50)
        assert len(chunks) == 3
        assert chunks[0].split()[-50:] == chunks[1].split()[:50]
        assert chunks[1].split()[-50:] == chunks[2].split()[:50]

    def test_no_overlap_produces_non_overlapping_chunks(self):
        words = [str(i) for i in range(800)]
        text = " ".join(words)
        chunks = chunk_text(text, max_tokens=400, overlap=0)
        assert len(chunks) == 2
        assert chunks[0] == " ".join(str(i) for i in range(400))
        assert chunks[1] == " ".join(str(i) for i in range(400, 800))


# ─── get_embedding ────────────────────────────────────────────────────────────

class TestGetEmbedding:
    @pytest.mark.asyncio
    async def test_returns_embedding_list(self):
        fake_embedding = [0.1] * 768
        with respx.mock:
            respx.post("http://ollama:11434/api/embeddings").mock(
                return_value=httpx.Response(200, json={"embedding": fake_embedding})
            )
            result = await get_embedding("hello world")
        assert result == fake_embedding

    @pytest.mark.asyncio
    async def test_sends_correct_model_and_prompt(self):
        with respx.mock:
            route = respx.post("http://ollama:11434/api/embeddings").mock(
                return_value=httpx.Response(200, json={"embedding": [0.0] * 768})
            )
            await get_embedding("my search query")
        body = json.loads(route.calls[0].request.content)
        assert body["model"] == "nomic-embed-text"
        assert body["prompt"] == "my search query"

    @pytest.mark.asyncio
    async def test_empty_string_is_forwarded(self):
        with respx.mock:
            route = respx.post("http://ollama:11434/api/embeddings").mock(
                return_value=httpx.Response(200, json={"embedding": [0.0] * 768})
            )
            await get_embedding("")
        body = json.loads(route.calls[0].request.content)
        assert body["prompt"] == ""
