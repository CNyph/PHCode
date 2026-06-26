import time
from fastapi import APIRouter
from ..models.schemas import ModelListResponse, ModelInfo
from ..services.ollama_service import ollama_service

router = APIRouter(prefix="/v1", tags=["models"])


@router.get("/models")
async def list_models():
    try:
        models = await ollama_service.list_models()
        data = [
            ModelInfo(
                id=m.get("name", "unknown"),
                created=int(time.time()),
                owned_by="ollama"
            )
            for m in models
        ]
        return ModelListResponse(data=data)
    except Exception as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content={
                "error": f"无法连接到 Ollama 服务: {str(e)}",
                "data": []
            }
        )
