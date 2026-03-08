"""Chat API endpoints - both admin (dashboard tester) and public widget."""
import uuid
import secrets
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.user import User
from app.models.organization import Organization
from app.models.bot import Bot
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import ChatRequest, ChatResponse, ChatSessionResponse, ChatMessageResponse
from app.api.deps import get_current_user, get_current_org, get_widget_bot
from app.services.chat_engine import get_chat_engine
from app.core.logging import get_logger

logger = get_logger(__name__)

# Admin chat router (requires auth)
admin_router = APIRouter(prefix="/orgs/{org_id}/bots/{bot_id}/chat", tags=["chat"])

# Public widget chat router (uses widget token)
widget_router = APIRouter(prefix="/widget/chat", tags=["widget"])


async def get_or_create_session(
    bot_id: uuid.UUID,
    org_id: uuid.UUID,
    session_token: str | None,
    visitor_id: str | None,
    visitor_email: str | None,
    visitor_name: str | None,
    request: Request,
    db: AsyncSession,
) -> ChatSession:
    """Get existing session or create a new one."""
    if session_token:
        result = await db.execute(
            select(ChatSession).where(
                ChatSession.session_token == session_token,
                ChatSession.bot_id == bot_id,
            )
        )
        session = result.scalar_one_or_none()
        if session:
            return session

    # Create new session
    token = secrets.token_urlsafe(32)
    session = ChatSession(
        bot_id=bot_id,
        organization_id=org_id,
        session_token=token,
        visitor_id=visitor_id,
        visitor_email=visitor_email,
        visitor_name=visitor_name,
        referrer_url=request.headers.get("referer"),
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
    db.add(session)
    await db.flush()
    return session


async def get_conversation_history(session_id: uuid.UUID, db: AsyncSession) -> list:
    """Get recent conversation history for context."""
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(10)
    )
    messages = list(reversed(result.scalars().all()))
    return [{"role": m.role, "content": m.content} for m in messages]


async def process_chat(
    bot: Bot,
    request_data: ChatRequest,
    request: Request,
    db: AsyncSession,
) -> ChatResponse:
    """Core chat processing logic."""
    # Get or create session
    session = await get_or_create_session(
        bot_id=bot.id,
        org_id=bot.organization_id,
        session_token=request_data.session_token,
        visitor_id=request_data.visitor_id,
        visitor_email=request_data.visitor_email,
        visitor_name=request_data.visitor_name,
        request=request,
        db=db,
    )

    # Get conversation history
    history = await get_conversation_history(session.id, db)

    # Run chat engine
    engine = get_chat_engine()
    result = await engine.chat(
        message=request_data.message,
        bot_id=str(bot.id),
        org_id=str(bot.organization_id),
        bot_name=bot.name,
        system_prompt=bot.system_prompt,
        strict_mode=bot.strict_mode,
        citation_mode=bot.citation_mode,
        fallback_message=bot.fallback_message or "I couldn't find an answer in the documentation.",
        chat_model=bot.chat_model,
        temperature=bot.temperature or 0.1,
        max_tokens=bot.max_tokens or 1024,
        conversation_history=history,
    )

    # Save user message
    user_msg = ChatMessage(
        session_id=session.id,
        bot_id=bot.id,
        role="user",
        content=request_data.message,
        answer_found=True,
    )
    db.add(user_msg)

    # Save assistant message
    assistant_msg = ChatMessage(
        session_id=session.id,
        bot_id=bot.id,
        role="assistant",
        content=result["answer"],
        citations=[c.model_dump() for c in result["citations"]],
        sources=result["sources"],
        confidence=result["confidence"],
        answer_found=result["answer_found"],
        tokens_used=result.get("tokens_used"),
        latency_ms=result.get("latency_ms"),
        model_used=result.get("model_used"),
    )
    db.add(assistant_msg)

    # Update session message count
    session.message_count += 2
    await db.commit()
    await db.refresh(assistant_msg)

    # Track analytics event
    try:
        from app.models.analytics import AnalyticsEvent
        event = AnalyticsEvent(
            organization_id=bot.organization_id,
            bot_id=bot.id,
            event_type="chat_message",
            session_id=session.session_token,
            properties={
                "answer_found": result["answer_found"],
                "confidence": result["confidence"],
                "latency_ms": result.get("latency_ms"),
            },
        )
        db.add(event)
        await db.commit()
    except Exception as e:
        logger.warning("analytics_event_failed", error=str(e))

    return ChatResponse(
        answer=result["answer"],
        session_token=session.session_token,
        message_id=str(assistant_msg.id),
        citations=result["citations"],
        sources=result["sources"],
        answer_found=result["answer_found"],
        confidence=result["confidence"],
        tokens_used=result.get("tokens_used"),
        latency_ms=result.get("latency_ms"),
    )


# Admin endpoints
@admin_router.post("", response_model=ChatResponse)
async def admin_chat(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    request_data: ChatRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Test chat from dashboard (admin only)."""
    result = await db.execute(
        select(Bot).where(Bot.id == bot_id, Bot.organization_id == org_id)
    )
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")

    return await process_chat(bot, request_data, request, db)


@admin_router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_sessions(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List chat sessions for a bot."""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.bot_id == bot_id, ChatSession.organization_id == org_id)
        .order_by(ChatSession.created_at.desc())
        .limit(50)
    )
    sessions = result.scalars().all()
    return [ChatSessionResponse.model_validate(s) for s in sessions]


@admin_router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_session(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Get a chat session with messages."""
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.bot_id == bot_id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()

    resp = ChatSessionResponse.model_validate(session)
    resp.messages = [ChatMessageResponse.model_validate(m) for m in messages]
    return resp


# Public widget endpoint
@widget_router.post("/{widget_token}", response_model=ChatResponse)
async def widget_chat(
    widget_token: str,
    request_data: ChatRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Public chat endpoint for embedded widget."""
    # Validate widget token and get bot
    bot = await get_widget_bot(widget_token, db)

    # Domain validation
    if bot.allowed_domains:
        origin = request.headers.get("origin", "")
        referer = request.headers.get("referer", "")
        check_url = origin or referer

        if check_url:
            from urllib.parse import urlparse
            parsed = urlparse(check_url)
            domain = parsed.netloc.lower()
            # Remove port if present
            domain = domain.split(":")[0]

            allowed = any(
                domain == d.lower().strip() or domain.endswith("." + d.lower().strip())
                for d in bot.allowed_domains
            )
            if not allowed:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Domain not allowed",
                )

    return await process_chat(bot, request_data, request, db)


@widget_router.get("/{widget_token}/config")
async def get_widget_config(
    widget_token: str,
    db: AsyncSession = Depends(get_db),
):
    """Get bot configuration for widget initialization."""
    bot = await get_widget_bot(widget_token, db)
    return {
        "bot_id": str(bot.id),
        "name": bot.name,
        "greeting": bot.greeting,
        "brand_color": bot.brand_color,
        "logo_url": bot.logo_url,
        "citation_mode": bot.citation_mode,
        "lead_capture": bot.lead_capture,
    }
