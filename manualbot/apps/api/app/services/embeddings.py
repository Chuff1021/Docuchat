"""Embeddings abstraction - provider-swappable interface."""
from typing import List, Protocol
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class EmbeddingProvider(Protocol):
    """Protocol for embedding providers."""

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of texts and return vectors."""
        ...

    async def embed_query(self, text: str) -> List[float]:
        """Embed a single query text."""
        ...

    @property
    def dimensions(self) -> int:
        """Return the embedding dimensions."""
        ...


class OpenAIEmbeddingProvider:
    """OpenAI embeddings provider."""

    def __init__(self):
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
        )
        self.model = settings.EMBEDDING_MODEL
        self._dimensions = settings.EMBEDDING_DIMENSIONS

    @property
    def dimensions(self) -> int:
        return self._dimensions

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Embed multiple texts in batches."""
        if not texts:
            return []

        # Batch in groups of 100
        all_embeddings = []
        batch_size = 100
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            response = await self.client.embeddings.create(
                model=self.model,
                input=batch,
            )
            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)
            logger.debug("embeddings_batch_created", count=len(batch))

        return all_embeddings

    async def embed_query(self, text: str) -> List[float]:
        """Embed a single query."""
        response = await self.client.embeddings.create(
            model=self.model,
            input=[text],
        )
        return response.data[0].embedding


def get_embedding_provider() -> EmbeddingProvider:
    """Get the configured embedding provider."""
    provider = settings.EMBEDDING_PROVIDER
    if provider == "openai":
        return OpenAIEmbeddingProvider()
    raise ValueError(f"Unknown embedding provider: {provider}")
