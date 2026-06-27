import json
import math
from typing import Optional
from ..core.config import settings
from ..services.provider_factory import get_provider


CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
TOP_K = 5


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks."""
    if len(text) <= chunk_size:
        return [text] if text.strip() else []

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]

        if end < len(text):
            last_period = chunk.rfind('。')
            last_newline = chunk.rfind('\n')
            break_at = max(last_period, last_newline)
            if break_at > chunk_size * 0.3:
                chunk = chunk[:break_at + 1]
                end = start + break_at + 1

        if chunk.strip():
            chunks.append(chunk.strip())

        start = end - overlap

    return chunks


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    if len(a) != len(b):
        return 0.0

    dot_product = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot_product / (norm_a * norm_b)


class RAGService:
    def __init__(self):
        self._embedding_cache: dict[str, list[float]] = {}

    async def get_embedding(self, text: str) -> list[float]:
        """Get embedding for text, using cache."""
        cache_key = text[:200]
        if cache_key in self._embedding_cache:
            return self._embedding_cache[cache_key]

        provider = get_provider()
        embeddings = await provider.embeddings(model="nomic-embed-text:latest", input=text)
        embedding = embeddings[0] if embeddings else []
        self._embedding_cache[cache_key] = embedding
        return embedding

    async def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Get embeddings for multiple texts."""
        provider = get_provider()
        embeddings = await provider.embeddings(model="nomic-embed-text:latest", input=texts)
        return embeddings

    async def index_document(self, document_id: str, content: str) -> list[dict]:
        """Chunk and index a document. Returns chunks with embeddings."""
        chunks = chunk_text(content)
        if not chunks:
            return []

        embeddings = await self.get_embeddings(chunks)

        indexed = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            indexed.append({
                "document_id": document_id,
                "chunk_index": i,
                "content": chunk,
                "embedding": embedding
            })

        return indexed

    async def search(
        self,
        query: str,
        documents: list[dict],
        top_k: int = TOP_K
    ) -> list[dict]:
        """Search documents for relevant chunks.

        documents: list of dicts with 'content' and 'embedding' keys.
        """
        if not documents:
            return []

        query_embedding = await self.get_embedding(query)
        if not query_embedding:
            return []

        scored = []
        for doc in documents:
            emb = doc.get("embedding", [])
            if not emb:
                continue
            score = cosine_similarity(query_embedding, emb)
            scored.append({**doc, "score": score})

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

    def build_context(self, results: list[dict]) -> str:
        """Build context string from search results."""
        if not results:
            return ""

        parts = []
        for i, r in enumerate(results, 1):
            source = r.get("filename", f"文档{i}")
            content = r.get("content", "")
            score = r.get("score", 0)
            parts.append(f"[{source}] (相关度: {score:.2f})\n{content}")

        return "\n\n---\n\n".join(parts)


rag_service = RAGService()
