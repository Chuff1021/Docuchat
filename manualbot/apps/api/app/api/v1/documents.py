"""Document upload and management API endpoints."""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.organization import Organization
from app.models.bot import Bot
from app.models.document import Document, IngestionJob, DocumentStatus, IngestionJobStatus
from app.schemas.document import DocumentResponse, DocumentListResponse, IngestionJobResponse
from app.api.deps import get_current_user, get_current_org
from app.services.storage import get_storage, sanitize_filename, generate_storage_path
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/orgs/{org_id}/bots/{bot_id}/documents", tags=["documents"])


async def get_bot_or_404(bot_id: uuid.UUID, org_id: uuid.UUID, db: AsyncSession) -> Bot:
    result = await db.execute(
        select(Bot).where(Bot.id == bot_id, Bot.organization_id == org_id)
    )
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    return bot


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List all documents for a bot."""
    await get_bot_or_404(bot_id, org_id, db)
    result = await db.execute(
        select(Document)
        .where(Document.bot_id == bot_id, Document.status != DocumentStatus.DELETED)
        .order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()
    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(d) for d in docs],
        total=len(docs),
    )


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Upload a PDF document and queue it for ingestion."""
    await get_bot_or_404(bot_id, org_id, db)

    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported",
        )

    # Validate content type
    if file.content_type and file.content_type not in ["application/pdf", "application/octet-stream"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDFs are accepted.",
        )

    # Read file
    file_data = await file.read()

    # Validate file size
    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(file_data) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB",
        )

    if len(file_data) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty",
        )

    # Sanitize filename
    safe_filename = sanitize_filename(file.filename)
    file_id = str(uuid.uuid4())
    storage_path = generate_storage_path(str(org_id), str(bot_id), file_id, safe_filename)

    # Save to storage
    storage = get_storage()
    await storage.save(file_data, storage_path)

    # Create document record
    doc = Document(
        id=uuid.UUID(file_id),
        bot_id=bot_id,
        organization_id=org_id,
        file_name=safe_filename,
        original_file_name=file.filename,
        file_size=len(file_data),
        mime_type="application/pdf",
        storage_path=storage_path,
        status=DocumentStatus.PENDING,
    )
    db.add(doc)
    await db.flush()

    # Create ingestion job
    job = IngestionJob(
        document_id=doc.id,
        bot_id=bot_id,
        organization_id=org_id,
        status=IngestionJobStatus.QUEUED,
        progress=0,
    )
    db.add(job)
    await db.commit()
    await db.refresh(doc)
    await db.refresh(job)

    # Queue Celery task
    from app.workers.ingestion import ingest_document
    task = ingest_document.apply_async(
        kwargs={
            "document_id": str(doc.id),
            "bot_id": str(bot_id),
            "org_id": str(org_id),
            "job_id": str(job.id),
            "storage_path": storage_path,
            "file_name": safe_filename,
        },
        queue="ingestion",
    )

    # Update job with task ID
    job.celery_task_id = task.id
    await db.commit()

    logger.info(
        "document_uploaded",
        document_id=str(doc.id),
        bot_id=str(bot_id),
        task_id=task.id,
    )

    return DocumentResponse.model_validate(doc)


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific document."""
    result = await db.execute(
        select(Document).where(
            Document.id == doc_id,
            Document.bot_id == bot_id,
            Document.organization_id == org_id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return DocumentResponse.model_validate(doc)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Delete a document and its chunks from vector store."""
    result = await db.execute(
        select(Document).where(
            Document.id == doc_id,
            Document.bot_id == bot_id,
            Document.organization_id == org_id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Delete from vector store
    from app.services.vector_store import get_vector_store
    vector_store = get_vector_store()
    await vector_store.delete_by_document(str(doc_id))

    # Delete from storage
    storage = get_storage()
    try:
        await storage.delete(doc.storage_path)
    except Exception as e:
        logger.warning("storage_delete_failed", doc_id=str(doc_id), error=str(e))

    # Mark as deleted
    doc.status = DocumentStatus.DELETED
    await db.commit()


@router.post("/{doc_id}/reprocess", response_model=IngestionJobResponse)
async def reprocess_document(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Reprocess a failed or completed document."""
    result = await db.execute(
        select(Document).where(
            Document.id == doc_id,
            Document.bot_id == bot_id,
            Document.organization_id == org_id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Delete existing chunks from vector store
    from app.services.vector_store import get_vector_store
    vector_store = get_vector_store()
    await vector_store.delete_by_document(str(doc_id))

    # Reset document status
    doc.status = DocumentStatus.PENDING
    doc.chunk_count = None
    doc.error_message = None

    # Create new ingestion job
    job = IngestionJob(
        document_id=doc.id,
        bot_id=bot_id,
        organization_id=org_id,
        status=IngestionJobStatus.QUEUED,
        progress=0,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Queue task
    from app.workers.ingestion import ingest_document
    task = ingest_document.apply_async(
        kwargs={
            "document_id": str(doc.id),
            "bot_id": str(bot_id),
            "org_id": str(org_id),
            "job_id": str(job.id),
            "storage_path": doc.storage_path,
            "file_name": doc.file_name,
        },
        queue="ingestion",
    )
    job.celery_task_id = task.id
    await db.commit()

    resp = IngestionJobResponse.model_validate(job)
    resp.document_name = doc.file_name
    return resp


@router.get("/{doc_id}/jobs", response_model=List[IngestionJobResponse])
async def get_ingestion_jobs(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Get ingestion job history for a document."""
    result = await db.execute(
        select(IngestionJob)
        .where(IngestionJob.document_id == doc_id)
        .order_by(IngestionJob.created_at.desc())
    )
    jobs = result.scalars().all()
    responses = []
    for job in jobs:
        resp = IngestionJobResponse.model_validate(job)
        responses.append(resp)
    return responses


# Org-level ingestion jobs endpoint
ingestion_router = APIRouter(prefix="/orgs/{org_id}/ingestion-jobs", tags=["ingestion"])


@ingestion_router.get("", response_model=List[IngestionJobResponse])
async def list_ingestion_jobs(
    org_id: uuid.UUID,
    bot_id: uuid.UUID = None,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List all ingestion jobs for an org (optionally filtered by bot)."""
    query = select(IngestionJob, Document).join(
        Document, Document.id == IngestionJob.document_id
    ).where(IngestionJob.organization_id == org_id)

    if bot_id:
        query = query.where(IngestionJob.bot_id == bot_id)

    query = query.order_by(IngestionJob.created_at.desc()).limit(100)
    result = await db.execute(query)
    rows = result.all()

    responses = []
    for job, doc in rows:
        resp = IngestionJobResponse.model_validate(job)
        resp.document_name = doc.file_name
        responses.append(resp)
    return responses
