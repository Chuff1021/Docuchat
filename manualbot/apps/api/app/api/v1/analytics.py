"""Analytics API endpoints."""
import uuid
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.core.database import get_db
from app.models.user import User
from app.models.organization import Organization
from app.models.bot import Bot
from app.models.document import Document, DocumentChunk
from app.models.chat import ChatSession, ChatMessage
from app.schemas.analytics import AnalyticsOverviewResponse, TopQuestion, BotAnalyticsResponse, DailyChartPoint
from app.api.deps import get_current_user, get_current_org

router = APIRouter(prefix="/orgs/{org_id}/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_overview(
    org_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Get analytics overview for an organization."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    # Docs uploaded
    docs_result = await db.execute(
        select(func.count(Document.id)).where(
            Document.organization_id == org_id,
            Document.status != "deleted",
        )
    )
    docs_uploaded = docs_result.scalar() or 0

    # Chunks indexed
    chunks_result = await db.execute(
        select(func.count(DocumentChunk.id)).where(
            DocumentChunk.organization_id == org_id
        )
    )
    chunks_indexed = chunks_result.scalar() or 0

    # Chats today
    chats_today_result = await db.execute(
        select(func.count(ChatMessage.id)).where(
            and_(
                ChatMessage.bot_id.in_(
                    select(Bot.id).where(Bot.organization_id == org_id)
                ),
                ChatMessage.role == "user",
                ChatMessage.created_at >= today_start,
            )
        )
    )
    chats_today = chats_today_result.scalar() or 0

    # Chats total
    chats_total_result = await db.execute(
        select(func.count(ChatMessage.id)).where(
            and_(
                ChatMessage.bot_id.in_(
                    select(Bot.id).where(Bot.organization_id == org_id)
                ),
                ChatMessage.role == "user",
            )
        )
    )
    chats_total = chats_total_result.scalar() or 0

    # Active bots
    active_bots_result = await db.execute(
        select(func.count(Bot.id)).where(
            Bot.organization_id == org_id,
            Bot.is_active == True,
        )
    )
    active_bots = active_bots_result.scalar() or 0

    # Unresolved count (answer_found = False)
    unresolved_result = await db.execute(
        select(func.count(ChatMessage.id)).where(
            and_(
                ChatMessage.bot_id.in_(
                    select(Bot.id).where(Bot.organization_id == org_id)
                ),
                ChatMessage.role == "assistant",
                ChatMessage.answer_found == False,
            )
        )
    )
    unresolved_count = unresolved_result.scalar() or 0

    # Top questions (recent user messages)
    top_q_result = await db.execute(
        select(ChatMessage.content, func.count(ChatMessage.id).label("cnt"))
        .where(
            and_(
                ChatMessage.bot_id.in_(
                    select(Bot.id).where(Bot.organization_id == org_id)
                ),
                ChatMessage.role == "user",
            )
        )
        .group_by(ChatMessage.content)
        .order_by(func.count(ChatMessage.id).desc())
        .limit(10)
    )
    top_questions = [
        TopQuestion(question=row.content[:100], count=row.cnt)
        for row in top_q_result.all()
    ]

    return AnalyticsOverviewResponse(
        docs_uploaded=docs_uploaded,
        chunks_indexed=chunks_indexed,
        chats_today=chats_today,
        chats_total=chats_total,
        active_bots=active_bots,
        top_questions=top_questions,
        unresolved_count=unresolved_count,
    )


@router.get("/bots/{bot_id}", response_model=BotAnalyticsResponse)
async def get_bot_analytics(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Get analytics for a specific bot."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    result = await db.execute(
        select(Bot).where(Bot.id == bot_id, Bot.organization_id == org_id)
    )
    bot = result.scalar_one_or_none()
    if not bot:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Bot not found")

    # Docs count
    docs_result = await db.execute(
        select(func.count(Document.id)).where(
            Document.bot_id == bot_id,
            Document.status != "deleted",
        )
    )
    docs_count = docs_result.scalar() or 0

    # Chunks count
    chunks_result = await db.execute(
        select(func.count(DocumentChunk.id)).where(DocumentChunk.bot_id == bot_id)
    )
    chunks_count = chunks_result.scalar() or 0

    # Chats today
    chats_today_result = await db.execute(
        select(func.count(ChatMessage.id)).where(
            ChatMessage.bot_id == bot_id,
            ChatMessage.role == "user",
            ChatMessage.created_at >= today_start,
        )
    )
    chats_today = chats_today_result.scalar() or 0

    # Chats total
    chats_total_result = await db.execute(
        select(func.count(ChatMessage.id)).where(
            ChatMessage.bot_id == bot_id,
            ChatMessage.role == "user",
        )
    )
    chats_total = chats_total_result.scalar() or 0

    # Top questions
    top_q_result = await db.execute(
        select(ChatMessage.content, func.count(ChatMessage.id).label("cnt"))
        .where(ChatMessage.bot_id == bot_id, ChatMessage.role == "user")
        .group_by(ChatMessage.content)
        .order_by(func.count(ChatMessage.id).desc())
        .limit(10)
    )
    top_questions = [
        TopQuestion(question=row.content[:100], count=row.cnt)
        for row in top_q_result.all()
    ]

    # Daily chart (last 7 days)
    daily_chart = []
    for i in range(6, -1, -1):
        day_start = today_start - timedelta(days=i)
        day_end = day_start + timedelta(days=1)

        day_chats = await db.execute(
            select(func.count(ChatMessage.id)).where(
                ChatMessage.bot_id == bot_id,
                ChatMessage.role == "user",
                ChatMessage.created_at >= day_start,
                ChatMessage.created_at < day_end,
            )
        )
        day_resolved = await db.execute(
            select(func.count(ChatMessage.id)).where(
                ChatMessage.bot_id == bot_id,
                ChatMessage.role == "assistant",
                ChatMessage.answer_found == True,
                ChatMessage.created_at >= day_start,
                ChatMessage.created_at < day_end,
            )
        )
        daily_chart.append(DailyChartPoint(
            date=day_start.strftime("%Y-%m-%d"),
            chats=day_chats.scalar() or 0,
            resolved=day_resolved.scalar() or 0,
        ))

    return BotAnalyticsResponse(
        bot_id=str(bot_id),
        bot_name=bot.name,
        chats_today=chats_today,
        chats_total=chats_total,
        docs_count=docs_count,
        chunks_count=chunks_count,
        top_questions=top_questions,
        daily_chart=daily_chart,
    )
