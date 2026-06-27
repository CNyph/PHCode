from fastapi import APIRouter, HTTPException
from ..models.schemas import EmbeddingRequest, EmbeddingResponse, EmbeddingData
from ..services.provider_factory import get_provider

router = APIRouter(prefix="/v1", tags=["embeddings"])


@router.post("/embeddings")
async def create_embeddings(request: EmbeddingRequest):
    try:
        embeddings = await get_provider().embeddings(
            model=request.model,
            input=request.input
        )

        data = [
            EmbeddingData(
                embedding=emb,
                index=i
            )
            for i, emb in enumerate(embeddings)
        ]

        return EmbeddingResponse(
            data=data,
            model=request.model
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"嵌入服务不可用: {str(e)}")
