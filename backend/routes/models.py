from fastapi import APIRouter, HTTPException
import httpx
import os
from ollama_capabilities import model_supports_thinking

router = APIRouter(prefix="/models", tags=["models"])

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")

@router.get("/")
async def get_models():
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(f"{OLLAMA_URL}/api/tags")
            data = res.json()
            # Return just name and size — frontend doesn't need the full blob
            models = [
                {
                    "name": m["name"],
                    "size": m["size"],
                    "sizeGb": round(m["size"] / 1_073_741_824, 1),
                    "thinkingSupported": model_supports_thinking(m["name"]),
                }
                for m in data.get("models", [])
            ]
            return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))