from abc import ABC, abstractmethod
from typing import AsyncGenerator


class BaseProvider(ABC):
    """Abstract base class for AI providers."""

    @abstractmethod
    async def list_models(self, base_url_override: str | None = None) -> list[dict]:
        """List available models.

        Returns list of dicts with at least:
        - name: str (model identifier)
        - model: str (same as name for most providers)
        """
        ...

    @abstractmethod
    async def chat(
        self,
        model: str,
        messages: list[dict],
        stream: bool = False,
        base_url_override: str | None = None,
    ) -> dict | AsyncGenerator[str, None]:
        """Send a chat completion request.

        When stream=False, returns a dict with:
        - message: {role, content}
        - prompt_eval_count: int (optional)
        - eval_count: int (optional)

        When stream=True, returns an async generator yielding
        newline-delimited JSON strings, each representing a chunk.
        """
        ...

    @abstractmethod
    async def embeddings(
        self,
        model: str,
        input: str | list[str],
        base_url_override: str | None = None,
    ) -> list[list[float]]:
        """Generate embeddings for the given input text(s)."""
        ...

    async def close(self):
        """Clean up resources."""
        pass
