import json
import time
import uuid
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from ..models.schemas import ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChoice, Usage, Message
from ..services.ollama_service import ollama_service

router = APIRouter(prefix="/v1", tags=["chat"])


@router.post("/chat/completions")
async def chat_completions(request: ChatCompletionRequest):
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    if request.stream:
        return StreamingResponse(
            stream_chat(request.model, messages),
            media_type="text/event-stream"
        )

    result = await ollama_service.chat(
        model=request.model,
        messages=messages,
        stream=False
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


async def stream_chat(model: str, messages: list[dict]):
    try:
        async for line in ollama_service._stream_chat({
            "model": model,
            "messages": messages,
            "stream": True
        }):
            try:
                data = json.loads(line)
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
