"""Document ingestion Celery tasks."""
import uuid
import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from celery import Task
from app.workers.celery_app import celery_app
from app.core.logging import get_logger

logger = get_logger(__name__)


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
    """Split text into overlapping chunks."""
    if not text.strip():
        return []

    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk_words = words[start:end]
        chunk = " ".join(chunk_words)
        if chunk.strip():
            chunks.append(chunk)
        if end >= len(words):
            break
        start = end - overlap

    return chunks


def extract_pdf_pages(pdf_bytes: bytes) -> List[Dict[str, Any]]:
    """Extract text from PDF page by page."""
    import pypdf
    import io

    pages = []
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))

    for page_num, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = text.strip()
        if text:
            pages.append({
                "page_number": page_num,
                "text": text,
            })

    return pages


@celery_app.task(
    bind=True,
    name="app.workers.ingestion.ingest_document",
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
)
def ingest_document(
    self: Task,
    document_id: str,
    bot_id: str,
    org_id: str,
    job_id: str,
    storage_path: str,
    file_name: str,
) -> Dict[str, Any]:
    """
    Main ingestion task:
    1. Load PDF from storage
    2. Extract text page by page
    3. Chunk text with overlap
    4. Generate embeddings
    5. Store in Qdrant
    6. Update DB records
    """
    return asyncio.run(
        _ingest_document_async(
            self, document_id, bot_id, org_id, job_id, storage_path, file_name
        )
    )


async def _ingest_document_async(
    task: Task,
    document_id: str,
    bot_id: str,
    org_id: str,
    job_id: str,
    storage_path: str,
    file_name: str,
) -> Dict[str, Any]:
    """Async implementation of document ingestion."""
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
    from sqlalchemy import select, update
    from app.core.config import settings
    from app.models.document import Document, DocumentChunk, IngestionJob, DocumentStatus, IngestionJobStatus
    from app.services.storage import get_storage
    from app.services.embeddings import get_embedding_provider
    from app.services.vector_store import get_vector_store

    engine = create_async_engine(settings.DATABASE_URL)
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionLocal() as db:
        try:
            # Update job status to running
            await db.execute(
                update(IngestionJob)
                .where(IngestionJob.id == uuid.UUID(job_id))
                .values(
                    status=IngestionJobStatus.RUNNING,
                    started_at=datetime.now(timezone.utc).isoformat(),
                    progress=5,
                )
            )
            await db.execute(
                update(Document)
                .where(Document.id == uuid.UUID(document_id))
                .values(status=DocumentStatus.PROCESSING)
            )
            await db.commit()

            logger.info("ingestion_started", document_id=document_id, file=file_name)

            # Load file from storage
            storage = get_storage()
            pdf_bytes = await storage.read(storage_path)

            # Extract pages
            pages = extract_pdf_pages(pdf_bytes)
            total_pages = len(pages)

            await db.execute(
                update(IngestionJob)
                .where(IngestionJob.id == uuid.UUID(job_id))
                .values(total_pages=total_pages, progress=20)
            )
            await db.commit()

            logger.info("pdf_extracted", document_id=document_id, pages=total_pages)

            # Chunk all pages
            all_chunks = []
            for page in pages:
                page_chunks = chunk_text(
                    page["text"],
                    chunk_size=settings.CHUNK_SIZE,
                    overlap=settings.CHUNK_OVERLAP,
                )
                for i, chunk_text_content in enumerate(page_chunks):
                    chunk_id = str(uuid.uuid4())
                    all_chunks.append({
                        "chunk_id": chunk_id,
                        "bot_id": bot_id,
                        "org_id": org_id,
                        "document_id": document_id,
                        "file_name": file_name,
                        "page_number": page["page_number"],
                        "chunk_index": len(all_chunks),
                        "text": chunk_text_content,
                    })

            total_chunks = len(all_chunks)
            logger.info("chunks_created", document_id=document_id, chunks=total_chunks)

            await db.execute(
                update(IngestionJob)
                .where(IngestionJob.id == uuid.UUID(job_id))
                .values(total_chunks=total_chunks, progress=40)
            )
            await db.commit()

            # Generate embeddings in batches
            embedding_provider = get_embedding_provider()
            texts = [c["text"] for c in all_chunks]
            vectors = await embedding_provider.embed_texts(texts)

            await db.execute(
                update(IngestionJob)
                .where(IngestionJob.id == uuid.UUID(job_id))
                .values(progress=70)
            )
            await db.commit()

            # Store in Qdrant
            vector_store = get_vector_store()
            await vector_store.upsert_chunks(all_chunks, vectors)

            await db.execute(
                update(IngestionJob)
                .where(IngestionJob.id == uuid.UUID(job_id))
                .values(progress=85)
            )
            await db.commit()

            # Save chunk metadata to DB
            chunk_records = []
            for chunk in all_chunks:
                chunk_record = DocumentChunk(
                    id=uuid.UUID(chunk["chunk_id"]),
                    document_id=uuid.UUID(document_id),
                    bot_id=uuid.UUID(bot_id),
                    organization_id=uuid.UUID(org_id),
                    chunk_index=chunk["chunk_index"],
                    page_number=chunk.get("page_number"),
                    text_preview=chunk["text"][:200],
                    qdrant_point_id=chunk["chunk_id"],
                    token_count=len(chunk["text"].split()),
                )
                chunk_records.append(chunk_record)

            db.add_all(chunk_records)

            # Update document and job as completed
            await db.execute(
                update(Document)
                .where(Document.id == uuid.UUID(document_id))
                .values(
                    status=DocumentStatus.COMPLETED,
                    page_count=total_pages,
                    chunk_count=total_chunks,
                )
            )
            await db.execute(
                update(IngestionJob)
                .where(IngestionJob.id == uuid.UUID(job_id))
                .values(
                    status=IngestionJobStatus.COMPLETED,
                    progress=100,
                    processed_pages=total_pages,
                    total_chunks=total_chunks,
                    completed_at=datetime.now(timezone.utc).isoformat(),
                )
            )
            await db.commit()

            logger.info(
                "ingestion_completed",
                document_id=document_id,
                pages=total_pages,
                chunks=total_chunks,
            )

            return {
                "status": "completed",
                "document_id": document_id,
                "pages": total_pages,
                "chunks": total_chunks,
            }

        except Exception as e:
            logger.error("ingestion_failed", document_id=document_id, error=str(e))

            await db.execute(
                update(Document)
                .where(Document.id == uuid.UUID(document_id))
                .values(status=DocumentStatus.FAILED, error_message=str(e))
            )
            await db.execute(
                update(IngestionJob)
                .where(IngestionJob.id == uuid.UUID(job_id))
                .values(
                    status=IngestionJobStatus.FAILED,
                    error_message=str(e),
                    completed_at=datetime.now(timezone.utc).isoformat(),
                )
            )
            await db.commit()
            raise

        finally:
            await engine.dispose()
