import json
import httpx
import asyncio
from typing import AsyncGenerator
from ..core.config import settings
from .base_provider import BaseProvider

STREAM_TIMEOUT = 60.0


class OpenAIProvider(BaseProvider):
    """Provider for OpenAI-compatible APIs (OpenAI, DeepSeek, etc.)."""

    def __init__(self):
        self.base_url = settings.OPENAI_BASE_URL
        self.api_key = settings.OPENAI_API_KEY
        self.max_retries = 3
        self.retry_delay = 1.0
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=300.0,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
            )
        return self._client

    async def _retry_operation(self, operation):
        last_error = None
        for attempt in range(self.max_retries):
            try:
                return await operation()
            except Exception as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay * (attempt + 1))
        raise last_error

    async def list_models(self, base_url_override: str | None = None) -> list[dict]:
        async def _fetch():
            client = await self._get_client()
            base_url = base_url_override.strip() if base_url_override else self.base_url
            response = await client.get(f"{base_url}/v1/models")
            response.raise_for_status()
            data = response.json()
            return data.get("data", [])

        return await self._retry_operation(_fetch)

    async def chat(
        self,
        model: str,
        messages: list[dict],
        stream: bool = False,
        base_url_override: str | None = None,
    ) -> dict | AsyncGenerator[str, None]:
        payload = {
            "model": model,
            "messages": messages,
            "stream": stream
        }
        base_url = base_url_override.strip() if base_url_override else self.base_url

        if stream:
            return self._stream_chat(payload, base_url_override)

        async def _fetch():
            client = await self._get_client()
            response = await client.post(
                f"{base_url}/v1/chat/completions",
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            choice = data.get("choices", [{}])[0]
            message = choice.get("message", {})
            usage = data.get("usage", {})
            return {
                "message": {"role": message.get("role", "assistant"), "content": message.get("content", "")},
                "prompt_eval_count": usage.get("prompt_tokens", 0),
                "eval_count": usage.get("completion_tokens", 0),
            }

        return await self._retry_operation(_fetch)

    async def _stream_chat(self, payload: dict, base_url_override: str | None = None) -> AsyncGenerator[str, None]:
        client = await self._get_client()
        base_url = base_url_override.strip() if base_url_override else self.base_url
        try:
            async with client.stream(
                "POST",
                f"{base_url}/v1/chat/completions",
                json=payload,
                timeout=STREAM_TIMEOUT
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            yield json.dumps({"done": True})
                            return
                        try:
                            parsed = json.loads(data)
                            delta = parsed.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield json.dumps({
                                    "message": {"role": "assistant", "content": content},
                                    "done": False
                                })
                        except json.JSONDecodeError:
                            continue
        except httpx.ReadTimeout:
            yield json.dumps({"message": {"content": ""}, "done": True, "error": "OpenAI 服务响应超时"})

    async def embeddings(
        self,
        model: str,
        input: str | list[str],
        base_url_override: str | None = None,
    ) -> list[list[float]]:
        if isinstance(input, str):
            input = [input]

        async def _fetch():
            client = await self._get_client()
            response = await client.post(
                f"{(base_url_override.strip() if base_url_override else self.base_url)}/v1/embeddings",
                json={
                    "model": model,
                    "input": input
                }
            )
            response.raise_for_status()
            data = response.json()
            return [item["embedding"] for item in data.get("data", [])]

        return await self._retry_operation(_fetch)

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None
