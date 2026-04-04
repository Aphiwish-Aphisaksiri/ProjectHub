from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from embeddings import embed_source, delete_embeddings, delete_project_embeddings

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

class TaskEmbedRequest(BaseModel):
    projectId: str
    sourceId: str
    text: str

@router.post("/task")
async def embed_task(req: TaskEmbedRequest):
    try:
        await embed_source(
            project_id=req.projectId,
            source_table="task",
            source_id=req.sourceId,
            text=req.text
        )
        return {"success": True, "sourceId": req.sourceId}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class NoteEmbedRequest(BaseModel):
    projectId: str
    sourceId: str
    text: str

@router.post("/note")
async def embed_note(req: NoteEmbedRequest):
    try:
        await embed_source(
            project_id=req.projectId,
            source_table="note",
            source_id=req.sourceId,
            text=req.text
        )
        return {"success": True, "sourceId": req.sourceId}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/task/{source_id}")
async def delete_task_embeddings(source_id: str):
    try:
        await delete_embeddings("task", source_id)
        return {"success": True, "sourceId": source_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/note/{source_id}")
async def delete_note_embeddings(source_id: str):
    try:
        await delete_embeddings("note", source_id)
        return {"success": True, "sourceId": source_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/project/{project_id}")
async def delete_all_project_embeddings(project_id: str):
    try:
        await delete_project_embeddings(project_id)
        return {"success": True, "projectId": project_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))