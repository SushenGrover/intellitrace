"""Database configuration – async SQLAlchemy + session helpers."""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://intellitrace:intellitrace_secret@db:5432/intellitrace",
)

engine = create_async_engine(DATABASE_URL, echo=False, pool_size=20, max_overflow=10)

SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with SessionLocal() as session:
        yield session
