"""
IntelliTrace – FastAPI Application Entry Point
Multi-Tier Supply Chain Fraud Detection & Management
"""

import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base, SessionLocal
from app.routes import invoices, fraud, analytics, alerts, dashboard
from app.websocket import ws_router


async def _run_sql_file(conn, filepath: Path):
    """Execute a raw SQL file against the database."""
    if filepath.exists():
        sql = filepath.read_text()
        from sqlalchemy import text
        # Split on semicolons and execute each statement
        for statement in sql.split(";"):
            stmt = statement.strip()
            if stmt and not stmt.startswith("--"):
                try:
                    await conn.execute(text(stmt))
                except Exception:
                    pass  # ignore if already exists (enums, tables, data)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    async with engine.begin() as conn:
        # Try to run init.sql + seed.sql (needed on Render; skipped in Docker
        # where Postgres handles it via /docker-entrypoint-initdb.d/)
        app_dir = Path(__file__).resolve().parent
        # Try: repo_root/db/  (works on Render & local dev)
        db_dir = app_dir.parent.parent / "db"
        if not db_dir.exists():
            # Fallback: backend/db/ (if copied during build)
            db_dir = app_dir.parent / "db"
        init_sql = db_dir / "init.sql"
        seed_sql = db_dir / "seed.sql"
        await _run_sql_file(conn, init_sql)
        await _run_sql_file(conn, seed_sql)
        # Also let SQLAlchemy create any tables not covered by init.sql
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="IntelliTrace",
    description="Multi-Tier Supply Chain Fraud Detection & Real-Time Early-Warning System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ──────────────────────────────────────────────────────────
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(invoices.router, prefix="/api/invoices", tags=["Invoices"])
app.include_router(fraud.router, prefix="/api/fraud", tags=["Fraud Detection"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Graph Analytics"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(ws_router, tags=["WebSocket"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "IntelliTrace", "version": "1.0.0"}
