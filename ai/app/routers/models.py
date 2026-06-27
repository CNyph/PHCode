import time
from fastapi import APIRouter, Header
from ..core.config import settings
from ..models.schemas import ModelListResponse, ModelInfo
from ..services.provider_factory import get_provider

router = APIRouter(prefix='/v1', tags=['models'])


@router.get('/models')
async def list_models(x_ollama_base_url: str | None = Header(default=None)):
    try:
        provider = get_provider()
        models = await provider.list_models(
            base_url_override=x_ollama_base_url.strip() if x_ollama_base_url else None
        )
        data = [
            ModelInfo(
                id=m.get('name', 'unknown'),
                created=int(time.time()),
                owned_by=settings.AI_PROVIDER.lower()
            )
            for m in models
        ]
        resolved_url = getattr(provider, '_resolved_base_url', None)
        return ModelListResponse(data=data, resolved_ollama_url=resolved_url)
    except Exception as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content={
                'error': f"无法连接到 {settings.AI_PROVIDER} 服务: {str(e)}",
                'data': [],
                'resolved_ollama_url': None
            }
        )
