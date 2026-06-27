"""Backward-compatible shim — use provider_factory.get_provider() instead."""
from .provider_factory import get_provider

ollama_service = get_provider()
