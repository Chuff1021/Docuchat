"""Document schemas."""
import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    bot_id: uuid.UUID
    organization_id: uuid.UUID
    file_name: str
    original_file_name: str
    file_size: Optional[int]
    mime_type: Optional[str]
    status: str
    page_count: Optional[int]
    chunk_count: Optional[int]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int


class IngestionJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_id: uuid.UUID
    bot_id: uuid.UUID
    celery_task_id: Optional[str]
    status: str
    progress: int
    total_pages: Optional[int]
    processed_pages: Optional[int]
    total_chunks: Optional[int]
    error_message: Optional[str]
    started_at: Optional[str]
    completed_at: Optional[str]
    created_at: datetime
    # Include document info
    document_name: Optional[str] = None
