"""Bot, ApiKey, and WidgetToken models."""
import uuid
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Boolean, ForeignKey, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.document import Document, IngestionJob
    from app.models.chat import ChatSession


class Bot(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "bots"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    greeting: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="Hi! How can I help you today?")
    brand_color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, default="#6366f1")
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fallback_message: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True,
        default="I'm sorry, I couldn't find an answer to that in the documentation. Please contact support."
    )
    system_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Model settings
    chat_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    temperature: Mapped[Optional[float]] = mapped_column(nullable=True, default=0.1)
    max_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=1024)

    # Feature flags
    citation_mode: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    strict_mode: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)  # Answer from docs only
    lead_capture: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Escalation
    escalation_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    escalation_webhook: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Domain allowlist (stored as JSON array)
    allowed_domains: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="bots")
    api_keys: Mapped[List["ApiKey"]] = relationship(
        "ApiKey", back_populates="bot", cascade="all, delete-orphan"
    )
    widget_tokens: Mapped[List["WidgetToken"]] = relationship(
        "WidgetToken", back_populates="bot", cascade="all, delete-orphan"
    )
    documents: Mapped[List["Document"]] = relationship(
        "Document", back_populates="bot", cascade="all, delete-orphan"
    )
    chat_sessions: Mapped[List["ChatSession"]] = relationship(
        "ChatSession", back_populates="bot", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Bot id={self.id} name={self.name}>"


class ApiKey(Base, UUIDMixin, TimestampMixin):
    """Admin API keys for server-side access."""
    __tablename__ = "api_keys"

    bot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bots.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    key_prefix: Mapped[str] = mapped_column(String(20), nullable=False)  # First chars for display
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_used_at: Mapped[Optional[str]] = mapped_column(nullable=True)

    bot: Mapped["Bot"] = relationship("Bot", back_populates="api_keys")

    def __repr__(self) -> str:
        return f"<ApiKey id={self.id} prefix={self.key_prefix}>"


class WidgetToken(Base, UUIDMixin, TimestampMixin):
    """Public widget tokens for embedding (less sensitive)."""
    __tablename__ = "widget_tokens"

    bot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bots.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    token: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    bot: Mapped["Bot"] = relationship("Bot", back_populates="widget_tokens")

    def __repr__(self) -> str:
        return f"<WidgetToken id={self.id} bot={self.bot_id}>"
