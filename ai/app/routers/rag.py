from fastapi import APIRouter
from pydantic import BaseModel
from ..services.rag_service import rag_service

router = APIRouter(prefix="/v1", tags=["rag"])


class IndexRequest(BaseModel):
    document_id: str
    content: str


class SearchRequest(BaseModel):
    query: str
    documents: list[dict]
    top_k: int = 5


@router.post("/rag/index")
async def index_document(request: IndexRequest):
    try:
        chunks = await rag_service.index_document(request.document_id, request.content)
        return {"chunks": len(chunks), "document_id": request.document_id}
    except Exception as e:
        return {"error": str(e), "chunks": 0}


@router.post("/rag/search")
async def search_documents(request: SearchRequest):
    try:
        results = await rag_service.search(
            query=request.query,
            documents=request.documents,
            top_k=request.top_k
        )
        context = rag_service.build_context(results)
        return {
            "results": [
                {"content": r["content"], "score": r["score"], "document_id": r.get("document_id")}
                for r in results
            ],
            "context": context
        }
    except Exception as e:
        return {"error": str(e), "results": [], "context": ""}
