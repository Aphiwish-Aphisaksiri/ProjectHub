from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/test-ollama")
async def test_ollama():
    async with httpx.AsyncClient() as client:
        res = await client.get("http://ollama:11434/api/tags")
        return res.json()