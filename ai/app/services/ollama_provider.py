import json
import httpx
import asyncio
from typing import AsyncGenerator
from ..core.config import settings
from .base_provider import BaseProvider

STREAM_TIMEOUT = 60.0


class OllamaProvider(BaseProvider):
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.max_retries = 3
        self.retry_delay = 1.0
        self._client: httpx.AsyncClient | None = None
        self._resolved_base_url: str | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            transport = httpx.AsyncHTTPTransport(proxy=None)
            self._client = httpx.AsyncClient(timeout=300.0, transport=transport, trust_env=False)
        return self._client

    def _candidate_base_urls(self, base_url_override: str | None = None) -> list[str]:
        candidates: list[str] = []
        for candidate in [
            base_url_override,
            self._resolved_base_url,
            self.base_url,
            'http://127.0.0.1:11434',
            'http://localhost:11434',
        ]:
            normalized = candidate.strip() if candidate else ''
            if normalized and normalized not in candidates:
                candidates.append(normalized)
        return candidates

    async def _probe_base_url(self, base_url: str) -> bool:
        client = await self._get_client()
        try:
            response = await client.get(f"{base_url}/api/tags", timeout=3.0)
            return response.is_success
        except Exception:
            return False

    async def _discover_base_url(self, base_url_override: str | None = None) -> str:
        resolved = base_url_override.strip() if base_url_override else ''
        if resolved and await self._probe_base_url(resolved):
            self._resolved_base_url = resolved
            return resolved

        if self._resolved_base_url:
            return self._resolved_base_url

        for candidate in self._candidate_base_urls():
            if resolved and candidate == resolved:
                continue
            if await self._probe_base_url(candidate):
                self._resolved_base_url = candidate
                return candidate

        return self.base_url

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
            response = await client.get(f"{await self._discover_base_url(base_url_override)}/api/tags")
            response.raise_for_status()
            data = response.json()
            return data.get("models", [])

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

        if stream:
            return self._stream_chat(payload, base_url_override)

        async def _fetch():
            client = await self._get_client()
            base_url = await self._discover_base_url(base_url_override)
            response = await client.post(
                f"{base_url}/api/chat",
                json=payload
            )
            response.raise_for_status()
            return response.json()

        return await self._retry_operation(_fetch)

    async def _stream_chat(self, payload: dict, base_url_override: str | None = None) -> AsyncGenerator[str, None]:
        client = await self._get_client()
        base_url = await self._discover_base_url(base_url_override)
        try:
            async with client.stream(
                "POST",
                f"{base_url}/api/chat",
                json=payload,
                timeout=STREAM_TIMEOUT
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        yield line
        except httpx.ReadTimeout:
            yield json.dumps({"message": {"content": ""}, "done": True, "error": "Ollama 响应超时"})

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
            base_url = await self._discover_base_url(base_url_override)
            response = await client.post(
                f"{base_url}/api/embed",
                json={
                    "model": model,
                    "input": input
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

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None
