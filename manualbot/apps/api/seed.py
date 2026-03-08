"""Seed script for demo data."""
import asyncio
import uuid
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings
from app.core.security import hash_password, generate_widget_token
from app.models.user import User
from app.models.organization import Organization, Membership, MemberRole
from app.models.bot import Bot, WidgetToken


DEMO_EMAIL = "demo@manualbot.ai"
DEMO_PASSWORD = "demo1234"
DEMO_ORG = "Acme Corp"


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionLocal() as db:
        from sqlalchemy import select

        # Check if demo user already exists
        result = await db.execute(select(User).where(User.email == DEMO_EMAIL))
        existing = result.scalar_one_or_none()
        if existing:
            print(f"Demo user already exists: {DEMO_EMAIL}")
            await engine.dispose()
            return

        print("Creating demo data...")

        # Create user
        user = User(
            email=DEMO_EMAIL,
            hashed_password=hash_password(DEMO_PASSWORD),
            full_name="Demo User",
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.flush()

        # Create organization
        org = Organization(
            name=DEMO_ORG,
            slug="acme-corp",
            plan="free",
            is_active=True,
        )
        db.add(org)
        await db.flush()

        # Create membership
        membership = Membership(
            user_id=user.id,
            organization_id=org.id,
            role=MemberRole.OWNER,
        )
        db.add(membership)

        # Create demo bot
        bot = Bot(
            organization_id=org.id,
            name="Acme Support Bot",
            greeting="Hi! I'm the Acme support assistant. How can I help you today?",
            brand_color="#6366f1",
            fallback_message="I couldn't find that in our documentation. Please contact support@acme.com",
            system_prompt="You are a helpful support assistant for Acme Corp. Answer questions based on the provided documentation.",
            is_active=True,
            citation_mode=True,
            strict_mode=True,
            temperature=0.1,
            max_tokens=1024,
        )
        db.add(bot)
        await db.flush()

        # Create widget token
        widget_token = WidgetToken(
            bot_id=bot.id,
            organization_id=org.id,
            token=generate_widget_token(),
            is_active=True,
        )
        db.add(widget_token)
        await db.commit()

        print(f"""
✅ Demo data created successfully!

Login credentials:
  Email:    {DEMO_EMAIL}
  Password: {DEMO_PASSWORD}

Organization: {DEMO_ORG}
Bot: {bot.name}
Widget Token: {widget_token.token}

Next steps:
1. Log in at http://localhost:3000
2. Upload a PDF document to the bot
3. Wait for ingestion to complete
4. Test the chat in the dashboard
5. Copy the embed snippet and test on a website
""")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
