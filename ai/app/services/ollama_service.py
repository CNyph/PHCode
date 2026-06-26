import httpx
import asyncio
from typing import AsyncGenerator
from ..core.config import settings

STREAM_TIMEOUT = 60.0


class OllamaService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.max_retries = 3
        self.retry_delay = 1.0
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=300.0)
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

    async def list_models(self) -> list[dict]:
        async def _fetch():
            client = await self._get_client()
            response = await client.get(f"{self.base_url}/api/tags")
            response.raise_for_status()
            data = response.json()
            return data.get("models", [])

        return await self._retry_operation(_fetch)

    async def chat(
        self,
        model: str,
        messages: list[dict],
        stream: bool = False
    ) -> dict | AsyncGenerator[str, None]:
        payload = {
            "model": model,
            "messages": messages,
            "stream": stream
        }

        if stream:
            return self._stream_chat(payload)

        async def _fetch():
            client = await self._get_client()
            response = await client.post(
                f"{self.base_url}/api/chat",
                json=payload
            )
            response.raise_for_status()
            return response.json()

        return await self._retry_operation(_fetch)

    async def _stream_chat(self, payload: dict) -> AsyncGenerator[str, None]:
        client = await self._get_client()
        try:
            async with client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=STREAM_TIMEOUT
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        yield line
        except httpx.ReadTimeout:
            return

    async def embeddings(self, model: str, input: str | list[str]) -> list[list[float]]:
        if isinstance(input, str):
            input = [input]

        async def _fetch():
            client = await self._get_client()
            response = await client.post(
                f"{self.base_url}/api/embeddings",
                json={
                    "model": model,
                    "prompt": input
                }
            )
            response.raise_for_status()
            data = response.json()

            if "embeddings" in data:
                return data["embeddings"]
            elif "embedding" in data:
                return [data["embedding"]]
            else:
                return []

        return await self._retry_operation(_fetch)


ollama_service = OllamaService()
