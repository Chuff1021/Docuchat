"""Qdrant vector store service."""
import uuid
from typing import List, Optional, Dict, Any
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, Filter, FieldCondition,
    MatchValue, SearchRequest, ScoredPoint
)
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

COLLECTION_NAME = f"{settings.QDRANT_COLLECTION_PREFIX}_chunks"


class VectorStore:
    """Qdrant vector store for document chunks."""

    def __init__(self):
        self.client = AsyncQdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
        )
        self.collection = COLLECTION_NAME
        self.dimensions = settings.EMBEDDING_DIMENSIONS

    async def ensure_collection(self) -> None:
        """Create collection if it doesn't exist."""
        try:
            await self.client.get_collection(self.collection)
        except Exception:
            await self.client.create_collection(
                collection_name=self.collection,
                vectors_config=VectorParams(
                    size=self.dimensions,
                    distance=Distance.COSINE,
                ),
            )
            logger.info("qdrant_collection_created", collection=self.collection)

    async def upsert_chunks(
        self,
        chunks: List[Dict[str, Any]],
        vectors: List[List[float]],
    ) -> None:
        """Upsert document chunks with their embeddings."""
        await self.ensure_collection()

        points = []
        for chunk, vector in zip(chunks, vectors):
            point = PointStruct(
                id=chunk["chunk_id"],
                vector=vector,
                payload={
                    "bot_id": chunk["bot_id"],
                    "org_id": chunk["org_id"],
                    "document_id": chunk["document_id"],
                    "file_name": chunk["file_name"],
                    "page_number": chunk.get("page_number"),
                    "chunk_index": chunk["chunk_index"],
                    "text": chunk["text"],
                },
            )
            points.append(point)

        await self.client.upsert(
            collection_name=self.collection,
            points=points,
        )
        logger.info("chunks_upserted", count=len(points))

    async def search(
        self,
        query_vector: List[float],
        bot_id: str,
        org_id: str,
        top_k: int = 6,
        score_threshold: float = 0.3,
    ) -> List[ScoredPoint]:
        """Search for relevant chunks scoped to a specific bot and org."""
        await self.ensure_collection()

        results = await self.client.search(
            collection_name=self.collection,
            query_vector=query_vector,
            query_filter=Filter(
                must=[
                    FieldCondition(key="bot_id", match=MatchValue(value=bot_id)),
                    FieldCondition(key="org_id", match=MatchValue(value=org_id)),
                ]
            ),
            limit=top_k,
            score_threshold=score_threshold,
            with_payload=True,
        )
        return results

    async def delete_by_document(self, document_id: str) -> None:
        """Delete all chunks for a document."""
        await self.ensure_collection()
        from qdrant_client.models import FilterSelector
        await self.client.delete(
            collection_name=self.collection,
            points_selector=FilterSelector(
                filter=Filter(
                    must=[
                        FieldCondition(key="document_id", match=MatchValue(value=document_id))
                    ]
                )
            ),
        )
        logger.info("chunks_deleted_for_document", document_id=document_id)

    async def delete_by_bot(self, bot_id: str) -> None:
        """Delete all chunks for a bot."""
        await self.ensure_collection()
        from qdrant_client.models import FilterSelector
        await self.client.delete(
            collection_name=self.collection,
            points_selector=FilterSelector(
                filter=Filter(
                    must=[
                        FieldCondition(key="bot_id", match=MatchValue(value=bot_id))
                    ]
                )
            ),
        )
        logger.info("chunks_deleted_for_bot", bot_id=bot_id)

    async def count_by_bot(self, bot_id: str) -> int:
        """Count chunks for a bot."""
        await self.ensure_collection()
        result = await self.client.count(
            collection_name=self.collection,
            count_filter=Filter(
                must=[FieldCondition(key="bot_id", match=MatchValue(value=bot_id))]
            ),
        )
        return result.count


_vector_store: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    """Get singleton vector store instance."""
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store
