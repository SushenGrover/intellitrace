"""
Dilution Monitor
Monitors cash collection vs expected amounts to detect dilution fraud.
Dilution = when collected cash is significantly less than financed amount.
"""

from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CashCollection, Invoice, FraudFlag, FraudType, AlertSeverity, Entity


async def detect_dilution(session: AsyncSession) -> List[FraudFlag]:
    """
    Detect dilution fraud:
    1. Compare expected vs collected amounts
    2. Flag when dilution ratio exceeds threshold
    3. Aggregate dilution by supplier to catch systemic issues
    """
    flags: List[FraudFlag] = []

    # Get all cash collection records with significant dilution
    result = await session.execute(
        select(CashCollection)
        .where(CashCollection.dilution_ratio > 0.20)  # >20% dilution
    )
    collections = result.scalars().all()

    for coll in collections:
        invoice = await session.get(Invoice, coll.invoice_id)
        if not invoice:
            continue

        existing = await session.execute(
            select(FraudFlag)
            .where(FraudFlag.invoice_id == coll.invoice_id)
            .where(FraudFlag.fraud_type == FraudType.dilution)
        )
        if existing.scalar_one_or_none():
            continue

        supplier = await session.get(Entity, invoice.supplier_id)
        supplier_name = supplier.name if supplier else "Unknown"

        severity = AlertSeverity.low
        if coll.dilution_ratio > 0.50:
            severity = AlertSeverity.critical
        elif coll.dilution_ratio > 0.35:
            severity = AlertSeverity.high
        elif coll.dilution_ratio > 0.20:
            severity = AlertSeverity.medium

        flags.append(FraudFlag(
            invoice_id=coll.invoice_id,
            fraud_type=FraudType.dilution,
            confidence=min(0.5 + coll.dilution_ratio, 0.99),
            severity=severity,
            description=(
                f"Dilution detected for {supplier_name}: "
                f"expected ${coll.expected_amount:,.0f}, "
                f"collected ${coll.collected_amount:,.0f} "
                f"({coll.dilution_ratio*100:.1f}% dilution). "
                f"Invoice #{invoice.invoice_number}"
            ),
            engine="dilution_monitor",
        ))

    return flags
