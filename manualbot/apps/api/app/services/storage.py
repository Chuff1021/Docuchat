"""Storage abstraction for file uploads (local filesystem or S3-compatible)."""
import os
import uuid
import aiofiles
from pathlib import Path
from typing import Optional, BinaryIO
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class StorageBackend:
    """Abstract storage backend interface."""

    async def save(self, file_data: bytes, path: str) -> str:
        raise NotImplementedError

    async def read(self, path: str) -> bytes:
        raise NotImplementedError

    async def delete(self, path: str) -> None:
        raise NotImplementedError

    def get_url(self, path: str) -> str:
        raise NotImplementedError


class LocalStorageBackend(StorageBackend):
    """Local filesystem storage backend."""

    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    async def save(self, file_data: bytes, path: str) -> str:
        full_path = self.base_path / path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(full_path, "wb") as f:
            await f.write(file_data)
        logger.info("file_saved", path=str(full_path))
        return path

    async def read(self, path: str) -> bytes:
        full_path = self.base_path / path
        async with aiofiles.open(full_path, "rb") as f:
            return await f.read()

    async def delete(self, path: str) -> None:
        full_path = self.base_path / path
        if full_path.exists():
            full_path.unlink()
            logger.info("file_deleted", path=str(full_path))

    def get_url(self, path: str) -> str:
        return f"/files/{path}"


class S3StorageBackend(StorageBackend):
    """S3-compatible storage backend (AWS S3, MinIO, etc.)."""

    def __init__(self):
        import boto3
        self.client = boto3.client(
            "s3",
            region_name=settings.S3_REGION,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            endpoint_url=settings.S3_ENDPOINT_URL,
        )
        self.bucket = settings.S3_BUCKET

    async def save(self, file_data: bytes, path: str) -> str:
        import asyncio
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: self.client.put_object(Bucket=self.bucket, Key=path, Body=file_data)
        )
        return path

    async def read(self, path: str) -> bytes:
        import asyncio
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.client.get_object(Bucket=self.bucket, Key=path)
        )
        return response["Body"].read()

    async def delete(self, path: str) -> None:
        import asyncio
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: self.client.delete_object(Bucket=self.bucket, Key=path)
        )

    def get_url(self, path: str) -> str:
        if settings.S3_ENDPOINT_URL:
            return f"{settings.S3_ENDPOINT_URL}/{self.bucket}/{path}"
        return f"https://{self.bucket}.s3.{settings.S3_REGION}.amazonaws.com/{path}"


def get_storage() -> StorageBackend:
    """Get the configured storage backend."""
    if settings.STORAGE_BACKEND == "s3":
        return S3StorageBackend()
    return LocalStorageBackend(settings.LOCAL_STORAGE_PATH)


def sanitize_filename(filename: str) -> str:
    """Sanitize a filename to prevent path traversal and other issues."""
    import re
    # Remove path components
    filename = os.path.basename(filename)
    # Replace dangerous characters
    filename = re.sub(r"[^\w\s\-.]", "", filename)
    filename = re.sub(r"\s+", "_", filename)
    # Limit length
    name, ext = os.path.splitext(filename)
    if len(name) > 100:
        name = name[:100]
    return f"{name}{ext}"


def generate_storage_path(org_id: str, bot_id: str, file_id: str, filename: str) -> str:
    """Generate a structured storage path."""
    return f"orgs/{org_id}/bots/{bot_id}/docs/{file_id}/{filename}"
