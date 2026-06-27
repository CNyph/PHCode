import json
import time
import uuid
from fastapi import APIRouter, Header
from fastapi.responses import StreamingResponse
from ..models.schemas import ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChoice, Usage, Message
from ..services.provider_factory import get_provider

router = APIRouter(prefix="/v1", tags=["chat"])


@router.post("/chat/completions")
async def chat_completions(
    request: ChatCompletionRequest,
    x_ollama_base_url: str | None = Header(default=None),
):
    ollama_base_url = x_ollama_base_url.strip() if x_ollama_base_url else None
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    if request.stream:
        return StreamingResponse(
            stream_chat(request.model, messages, ollama_base_url),
            media_type="text/event-stream"
        )

    result = await get_provider().chat(
        model=request.model,
        messages=messages,
        stream=False,
        base_url_override=ollama_base_url
    )

    response_message = result.get("message", {})
    return ChatCompletionResponse(
        id=f"chatcmpl-{uuid.uuid4().hex[:12]}",
        created=int(time.time()),
        model=request.model,
        choices=[
            ChatCompletionChoice(
                index=0,
                message=Message(
                    role=response_message.get("role", "assistant"),
                    content=response_message.get("content", "")
                ),
                finish_reason="stop"
            )
        ],
        usage=Usage(
            prompt_tokens=result.get("prompt_eval_count", 0),
            completion_tokens=result.get("eval_count", 0),
            total_tokens=result.get("prompt_eval_count", 0) + result.get("eval_count", 0)
        )
    )


async def stream_chat(model: str, messages: list[dict], ollama_base_url: str | None = None):
    try:
        stream = await get_provider().chat(
            model=model,
            messages=messages,
            stream=True,
            base_url_override=ollama_base_url
        )
        async for line in stream:
            try:
                data = json.loads(line)
                if data.get("error"):
                    yield f"data: {json.dumps({'error': data['error']})}\n\n"
                    yield "data: [DONE]\n\n"
                    return
                content = data.get("message", {}).get("content", "")
                if content:
                    chunk = {
                        "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
                        "object": "chat.completion.chunk",
                        "created": int(time.time()),
                        "model": model,
                        "choices": [{
                            "index": 0,
                            "delta": {"content": content},
                            "finish_reason": None
                        }]
                    }
                    yield f"data: {json.dumps(chunk)}\n\n"

                if data.get("done"):
                    final_chunk = {
                        "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
                        "object": "chat.completion.chunk",
                        "created": int(time.time()),
                        "model": model,
                        "choices": [{
                            "index": 0,
                            "delta": {},
                            "finish_reason": "stop"
                        }]
                    }
                    yield f"data: {json.dumps(final_chunk)}\n\n"
                    yield "data: [DONE]\n\n"
            except json.JSONDecodeError:
                continue
    except Exception as e:
        error_chunk = {
            "error": str(e)
        }
        yield f"data: {json.dumps(error_chunk)}\n\n"
        yield "data: [DONE]\n\n"
