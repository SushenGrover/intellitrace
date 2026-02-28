"""Fraud detection scanning routes."""

import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Invoice, FraudFlag, InvoiceStatus
from app.schemas import FraudScanResult, FraudFlagOut
from app.engines.invoice_validator import validate_invoice
from app.engines.duplicate_detector import detect_duplicates
from app.engines.velocity_detector import detect_velocity_anomalies
from app.engines.cascade_detector import detect_cascade_fraud
from app.engines.dilution_monitor import detect_dilution
from app.engines.graph_analytics import detect_carousel_fraud

router = APIRouter()


@router.post("/scan", response_model=FraudScanResult)
async def run_fraud_scan(db: AsyncSession = Depends(get_db)):
    """Run all fraud detection engines across all pending invoices."""
    scan_id = str(uuid.uuid4())[:8]
    all_flags: List[FraudFlag] = []

    # 1. Invoice validation on all pending invoices
    result = await db.execute(
        select(Invoice).where(Invoice.status == InvoiceStatus.pending)
    )
    pending = result.scalars().all()

    for inv in pending:
        flags = await validate_invoice(db, inv)
        all_flags.extend(flags)

    # 2. Duplicate detection (full scan)
    dup_flags = await detect_duplicates(db)
    all_flags.extend(dup_flags)

    # 3. Velocity anomalies
    vel_flags = await detect_velocity_anomalies(db)
    all_flags.extend(vel_flags)

    # 4. Cascade fraud
    cas_flags = await detect_cascade_fraud(db)
    all_flags.extend(cas_flags)

    # 5. Dilution monitoring
    dil_flags = await detect_dilution(db)
    all_flags.extend(dil_flags)

    # 6. Carousel detection
    car_flags = await detect_carousel_fraud(db)
    all_flags.extend(car_flags)

    # Save new flags
    for flag in all_flags:
        db.add(flag)

    # Update invoice risk scores
    for inv in pending:
        inv_flags = [f for f in all_flags if f.invoice_id == inv.id]
        if inv_flags:
            max_conf = max(f.confidence for f in inv_flags)
            inv.risk_score = max(inv.risk_score, round(max_conf * 100, 1))
            if inv.risk_score > 50:
                inv.status = InvoiceStatus.flagged

    await db.commit()

    # Summary
    type_counts = {}
    for f in all_flags:
        key = f.fraud_type.value if hasattr(f.fraud_type, 'value') else str(f.fraud_type)
        type_counts[key] = type_counts.get(key, 0) + 1

    return FraudScanResult(
        scan_id=scan_id,
        timestamp=datetime.utcnow(),
        invoices_scanned=len(pending),
        flags_raised=len(all_flags),
        flags=[FraudFlagOut.model_validate(f) for f in all_flags[:50]],
        summary=type_counts,
    )


@router.get("/flags", response_model=List[FraudFlagOut])
async def list_fraud_flags(
    fraud_type: str = None,
    min_confidence: float = None,
    db: AsyncSession = Depends(get_db),
):
    """List all fraud flags with optional filters."""
    query = select(FraudFlag).order_by(FraudFlag.confidence.desc())

    if fraud_type:
        query = query.where(FraudFlag.fraud_type == fraud_type)
    if min_confidence:
        query = query.where(FraudFlag.confidence >= min_confidence)

    result = await db.execute(query.limit(200))
    return [FraudFlagOut.model_validate(f) for f in result.scalars().all()]


@router.get("/exposure")
async def total_exposure(db: AsyncSession = Depends(get_db)):
    """Calculate total fraud exposure by type."""
    from sqlalchemy import func, distinct

    result = await db.execute(
        select(
            FraudFlag.fraud_type,
            func.count(distinct(FraudFlag.invoice_id)),
            func.sum(Invoice.amount),
        )
        .join(Invoice, FraudFlag.invoice_id == Invoice.id)
        .group_by(FraudFlag.fraud_type)
    )

    exposure = {}
    total = 0
    for ftype, count, amount in result.all():
        key = ftype.value if hasattr(ftype, 'value') else str(ftype)
        amt = round(amount or 0, 2)
        exposure[key] = {"invoice_count": count, "exposure": amt}
        total += amt

    return {"total_exposure": round(total, 2), "by_type": exposure}
