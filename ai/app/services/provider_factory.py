from ..core.config import settings
from .base_provider import BaseProvider

_provider: BaseProvider | None = None


def get_provider() -> BaseProvider:
    """Get or create the AI provider singleton based on config."""
    global _provider
    if _provider is not None:
        return _provider

    provider_name = settings.AI_PROVIDER.lower()

    if provider_name == "openai":
        from .openai_provider import OpenAIProvider
        _provider = OpenAIProvider()
    elif provider_name == "ollama":
        from .ollama_provider import OllamaProvider
        _provider = OllamaProvider()
    else:
        raise ValueError(f"Unknown AI provider: {provider_name}")

    return _provider
