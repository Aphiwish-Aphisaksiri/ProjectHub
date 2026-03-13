from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from embeddings import embed_source

router = APIRouter(prefix="/embed", tags=["embeddings"])

class ProjectEmbedRequest(BaseModel):
    projectId: str
    sourceId: str
    title: str
    description: str | None = None

@router.post("/project")
async def embed_project(req: ProjectEmbedRequest):
    try:
        # Combine title + description as one meaningful chunk
        text = req.title
        if req.description:
            text += f"\n{req.description}"

        await embed_source(
            project_id=req.projectId,
            source_table="project",
            source_id=req.sourceId,
            text=text
        )
        return {"success": True, "sourceId": req.sourceId}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))