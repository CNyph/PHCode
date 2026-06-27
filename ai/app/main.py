import os
import atexit
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .routers import chat, models, embeddings, rag

PORT_FILE = Path(__file__).parent.parent.parent / "data" / "ai-port"

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(models.router)
app.include_router(embeddings.router)
app.include_router(rag.router)


@app.on_event("startup")
async def startup_event():
    PORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    PORT_FILE.write_text(str(settings.PORT))
    atexit.register(lambda: PORT_FILE.unlink(missing_ok=True))


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.APP_NAME}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
