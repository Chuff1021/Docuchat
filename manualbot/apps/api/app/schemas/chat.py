"""Chat schemas."""
import uuid
from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class Citation(BaseModel):
    chunk_id: str
    document_id: str
    file_name: str
    page_number: Optional[int]
    text_snippet: str
    score: Optional[float]


class ChatRequest(BaseModel):
    message: str
    session_token: Optional[str] = None  # If None, creates new session
    visitor_id: Optional[str] = None
    visitor_email: Optional[str] = None
    visitor_name: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    session_token: str
    message_id: str
    citations: List[Citation] = []
    sources: List[str] = []
    answer_found: bool = True
    confidence: Optional[str] = None  # "high", "medium", "low", "none"
    tokens_used: Optional[int] = None
    latency_ms: Optional[int] = None


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    content: str
    citations: Optional[List[Any]]
    sources: Optional[List[str]]
    confidence: Optional[str]
    answer_found: bool
    created_at: datetime


class ChatSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    bot_id: uuid.UUID
    session_token: str
    visitor_id: Optional[str]
    visitor_email: Optional[str]
    visitor_name: Optional[str]
    is_resolved: bool
    message_count: int
    created_at: datetime
    messages: Optional[List[ChatMessageResponse]] = None
