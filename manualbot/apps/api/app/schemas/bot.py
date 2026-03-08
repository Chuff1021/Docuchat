"""Bot schemas."""
import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator


class BotCreate(BaseModel):
    name: str
    greeting: Optional[str] = "Hi! How can I help you today?"
    brand_color: Optional[str] = "#6366f1"
    logo_url: Optional[str] = None
    fallback_message: Optional[str] = "I'm sorry, I couldn't find an answer to that in the documentation."
    system_prompt: Optional[str] = None
    chat_model: Optional[str] = None
    temperature: Optional[float] = 0.1
    max_tokens: Optional[int] = 1024
    citation_mode: bool = True
    strict_mode: bool = True
    lead_capture: bool = False
    escalation_email: Optional[str] = None
    escalation_webhook: Optional[str] = None
    allowed_domains: Optional[List[str]] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if len(v.strip()) < 1:
            raise ValueError("Bot name cannot be empty")
        return v.strip()

    @field_validator("brand_color")
    @classmethod
    def validate_color(cls, v: Optional[str]) -> Optional[str]:
        if v and not v.startswith("#"):
            raise ValueError("Brand color must be a hex color (e.g. #6366f1)")
        return v


class BotUpdate(BaseModel):
    name: Optional[str] = None
    greeting: Optional[str] = None
    brand_color: Optional[str] = None
    logo_url: Optional[str] = None
    fallback_message: Optional[str] = None
    system_prompt: Optional[str] = None
    chat_model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    citation_mode: Optional[bool] = None
    strict_mode: Optional[bool] = None
    lead_capture: Optional[bool] = None
    escalation_email: Optional[str] = None
    escalation_webhook: Optional[str] = None
    allowed_domains: Optional[List[str]] = None
    is_active: Optional[bool] = None


class BotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    greeting: Optional[str]
    brand_color: Optional[str]
    logo_url: Optional[str]
    fallback_message: Optional[str]
    system_prompt: Optional[str]
    is_active: bool
    chat_model: Optional[str]
    temperature: Optional[float]
    max_tokens: Optional[int]
    citation_mode: bool
    strict_mode: bool
    lead_capture: bool
    escalation_email: Optional[str]
    escalation_webhook: Optional[str]
    allowed_domains: Optional[List[str]]
    created_at: datetime
    updated_at: datetime
    # Computed fields
    document_count: Optional[int] = 0
    chunk_count: Optional[int] = 0


class BotListResponse(BaseModel):
    bots: List[BotResponse]
    total: int


class ApiKeyCreate(BaseModel):
    name: str


class ApiKeyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    bot_id: uuid.UUID
    name: str
    key_prefix: str
    is_active: bool
    created_at: datetime
    # Only returned on creation
    full_key: Optional[str] = None


class WidgetTokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    bot_id: uuid.UUID
    token: str
    is_active: bool
    created_at: datetime
