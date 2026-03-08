"""Bot management API endpoints."""
import uuid
import hashlib
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import generate_api_key, generate_widget_token
from app.models.user import User
from app.models.organization import Organization
from app.models.bot import Bot, ApiKey, WidgetToken
from app.models.document import Document, DocumentChunk
from app.schemas.bot import (
    BotCreate, BotUpdate, BotResponse, BotListResponse,
    ApiKeyCreate, ApiKeyResponse, WidgetTokenResponse
)
from app.api.deps import get_current_user, get_current_org

router = APIRouter(prefix="/orgs/{org_id}/bots", tags=["bots"])


async def get_bot_or_404(bot_id: uuid.UUID, org_id: uuid.UUID, db: AsyncSession) -> Bot:
    result = await db.execute(
        select(Bot).where(Bot.id == bot_id, Bot.organization_id == org_id)
    )
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    return bot


async def enrich_bot_response(bot: Bot, db: AsyncSession) -> BotResponse:
    """Add computed fields to bot response."""
    doc_count = await db.execute(
        select(func.count(Document.id)).where(Document.bot_id == bot.id)
    )
    chunk_count = await db.execute(
        select(func.count(DocumentChunk.id)).where(DocumentChunk.bot_id == bot.id)
    )
    resp = BotResponse.model_validate(bot)
    resp.document_count = doc_count.scalar() or 0
    resp.chunk_count = chunk_count.scalar() or 0
    return resp


@router.get("", response_model=BotListResponse)
async def list_bots(
    org_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List all bots for an organization."""
    result = await db.execute(
        select(Bot).where(Bot.organization_id == org_id).order_by(Bot.created_at.desc())
    )
    bots = result.scalars().all()
    enriched = [await enrich_bot_response(b, db) for b in bots]
    return BotListResponse(bots=enriched, total=len(enriched))


@router.post("", response_model=BotResponse, status_code=status.HTTP_201_CREATED)
async def create_bot(
    org_id: uuid.UUID,
    data: BotCreate,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Create a new bot."""
    bot = Bot(
        organization_id=org_id,
        **data.model_dump(),
    )
    db.add(bot)
    await db.flush()

    # Auto-create a widget token
    widget_token = WidgetToken(
        bot_id=bot.id,
        organization_id=org_id,
        token=generate_widget_token(),
        is_active=True,
    )
    db.add(widget_token)
    await db.commit()
    await db.refresh(bot)

    return await enrich_bot_response(bot, db)


@router.get("/{bot_id}", response_model=BotResponse)
async def get_bot(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific bot."""
    bot = await get_bot_or_404(bot_id, org_id, db)
    return await enrich_bot_response(bot, db)


@router.patch("/{bot_id}", response_model=BotResponse)
async def update_bot(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    data: BotUpdate,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Update a bot's settings."""
    bot = await get_bot_or_404(bot_id, org_id, db)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bot, field, value)

    await db.commit()
    await db.refresh(bot)
    return await enrich_bot_response(bot, db)


@router.delete("/{bot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bot(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Delete a bot and all its data."""
    bot = await get_bot_or_404(bot_id, org_id, db)
    await db.delete(bot)
    await db.commit()


# API Keys
@router.get("/{bot_id}/api-keys", response_model=List[ApiKeyResponse])
async def list_api_keys(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List API keys for a bot."""
    await get_bot_or_404(bot_id, org_id, db)
    result = await db.execute(
        select(ApiKey).where(ApiKey.bot_id == bot_id).order_by(ApiKey.created_at.desc())
    )
    return [ApiKeyResponse.model_validate(k) for k in result.scalars().all()]


@router.post("/{bot_id}/api-keys", response_model=ApiKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    data: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Create a new API key for a bot."""
    await get_bot_or_404(bot_id, org_id, db)
    full_key = generate_api_key()
    key_hash = hashlib.sha256(full_key.encode()).hexdigest()
    key_prefix = full_key[:12] + "..."

    api_key = ApiKey(
        bot_id=bot_id,
        organization_id=org_id,
        name=data.name,
        key_hash=key_hash,
        key_prefix=key_prefix,
        is_active=True,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    resp = ApiKeyResponse.model_validate(api_key)
    resp.full_key = full_key  # Only returned once
    return resp


@router.delete("/{bot_id}/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Revoke an API key."""
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.bot_id == bot_id)
    )
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")
    await db.delete(key)
    await db.commit()


# Widget Tokens
@router.get("/{bot_id}/widget-tokens", response_model=List[WidgetTokenResponse])
async def list_widget_tokens(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List widget tokens for a bot."""
    await get_bot_or_404(bot_id, org_id, db)
    result = await db.execute(
        select(WidgetToken).where(WidgetToken.bot_id == bot_id)
    )
    return [WidgetTokenResponse.model_validate(t) for t in result.scalars().all()]


@router.post("/{bot_id}/widget-tokens", response_model=WidgetTokenResponse, status_code=status.HTTP_201_CREATED)
async def create_widget_token(
    org_id: uuid.UUID,
    bot_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Create a new widget token."""
    await get_bot_or_404(bot_id, org_id, db)
    token = WidgetToken(
        bot_id=bot_id,
        organization_id=org_id,
        token=generate_widget_token(),
        is_active=True,
    )
    db.add(token)
    await db.commit()
    await db.refresh(token)
    return WidgetTokenResponse.model_validate(token)
