"""Alert management routes."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Alert, AlertSeverity, AlertStatus
from app.schemas import AlertOut

router = APIRouter()


@router.get("/", response_model=List[AlertOut])
async def list_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List alerts with optional filters."""
    query = select(Alert).order_by(Alert.created_at.desc())

    if severity:
        query = query.where(Alert.severity == severity)
    if status:
        query = query.where(Alert.status == status)

    result = await db.execute(query.limit(limit))
    return [AlertOut.model_validate(a) for a in result.scalars().all()]


@router.get("/{alert_id}", response_model=AlertOut)
async def get_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single alert by ID."""
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return AlertOut.model_validate(alert)


@router.patch("/{alert_id}/status")
async def update_alert_status(
    alert_id: int,
    new_status: str,
    db: AsyncSession = Depends(get_db),
):
    """Update alert status."""
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = new_status
    await db.commit()
    return {"id": alert_id, "status": new_status}


@router.get("/stats/summary")
async def alert_summary(db: AsyncSession = Depends(get_db)):
    """Alert summary statistics."""
    total = await db.execute(select(func.count(Alert.id)))
    open_count = await db.execute(
        select(func.count(Alert.id)).where(Alert.status == 'open')
    )
    critical_count = await db.execute(
        select(func.count(Alert.id))
        .where(Alert.severity == 'critical')
        .where(Alert.status == 'open')
    )
    total_exposure = await db.execute(
        select(func.coalesce(func.sum(Alert.total_exposure), 0))
        .where(Alert.status == 'open')
    )

    return {
        "total_alerts": total.scalar(),
        "open_alerts": open_count.scalar(),
        "critical_alerts": critical_count.scalar(),
        "total_exposure": round(total_exposure.scalar(), 2),
    }
