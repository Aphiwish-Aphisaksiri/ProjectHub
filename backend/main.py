from fastapi import FastAPI
from contextlib import asynccontextmanager
import httpx
from db import get_pool, close_pool
from routes.embed import router as embed_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()   # init DB pool on startup
    yield
    await close_pool() # clean up on shutdown

app = FastAPI(lifespan=lifespan)
app.include_router(embed_router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/test-ollama")
async def test_ollama():
    async with httpx.AsyncClient() as client:
        res = await client.get("http://ollama:11434/api/tags")
        return res.json()