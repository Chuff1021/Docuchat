"""ManualBot FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.database import engine
from app.api.v1 import auth, bots, documents, chat, analytics
from app.api.v1.documents import ingestion_router
from app.api.v1.chat import admin_router as chat_admin_router, widget_router

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    setup_logging()
    logger.info("manualbot_starting", version=settings.APP_VERSION, env=settings.ENVIRONMENT)

    # Ensure Qdrant collection exists
    try:
        from app.services.vector_store import get_vector_store
        vs = get_vector_store()
        await vs.ensure_collection()
        logger.info("qdrant_ready")
    except Exception as e:
        logger.warning("qdrant_init_failed", error=str(e))

    # Ensure local storage directory exists
    if settings.STORAGE_BACKEND == "local":
        os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)

    yield

    logger.info("manualbot_shutting_down")
    await engine.dispose()


app = FastAPI(
    title="ManualBot API",
    description="AI-powered document chatbot platform",
    version=settings.APP_VERSION,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 routes
API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(bots.router, prefix=API_PREFIX)
app.include_router(documents.router, prefix=API_PREFIX)
app.include_router(ingestion_router, prefix=API_PREFIX)
app.include_router(chat_admin_router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)

# Public widget routes (no auth prefix)
app.include_router(widget_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health/detailed")
async def detailed_health():
    """Detailed health check with dependency status."""
    checks = {}

    # Database
    try:
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {str(e)}"

    # Redis
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.REDIS_URL)
        await r.ping()
        await r.aclose()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {str(e)}"

    # Qdrant
    try:
        from app.services.vector_store import get_vector_store
        vs = get_vector_store()
        await vs.ensure_collection()
        checks["qdrant"] = "ok"
    except Exception as e:
        checks["qdrant"] = f"error: {str(e)}"

    all_ok = all(v == "ok" for v in checks.values())
    return JSONResponse(
        status_code=status.HTTP_200_OK if all_ok else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"status": "healthy" if all_ok else "degraded", "checks": checks},
    )


@app.get("/metrics")
async def metrics():
    """Basic metrics endpoint."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(
        "unhandled_exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )
