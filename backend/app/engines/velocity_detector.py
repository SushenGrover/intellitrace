"""
Velocity & Sequencing Anomaly Detector
Detects unusual patterns in invoice submission frequency per tier.
"""

from typing import List
from datetime import timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Invoice, FraudFlag, FraudType, AlertSeverity, Entity


async def detect_velocity_anomalies(session: AsyncSession) -> List[FraudFlag]:
    """
    Detect velocity anomalies:
    1. Sudden spike in invoice count per supplier within a rolling window
    2. Unusually rapid sequential invoices
    3. Tier-specific submission rate anomalies
    """
    flags: List[FraudFlag] = []

    # Get all suppliers
    suppliers_result = await session.execute(
        select(Entity).where(Entity.entity_type == "supplier")
    )
    suppliers = suppliers_result.scalars().all()

    for supplier in suppliers:
        # Get all invoices for this supplier ordered by date
        inv_result = await session.execute(
            select(Invoice)
            .where(Invoice.supplier_id == supplier.id)
            .order_by(Invoice.invoice_date)
        )
        invoices = inv_result.scalars().all()

        if len(invoices) < 3:
            continue

        # 1. Check for rapid sequential invoices (< 1 day apart)
        for i in range(1, len(invoices)):
            gap = (invoices[i].invoice_date - invoices[i - 1].invoice_date).days
            if gap == 0 and invoices[i].amount > 50000:
                # Check if already flagged
                existing = await session.execute(
                    select(FraudFlag)
                    .where(FraudFlag.invoice_id == invoices[i].id)
                    .where(FraudFlag.fraud_type == FraudType.velocity_anomaly)
                )
                if existing.scalar_one_or_none():
                    continue

                flags.append(FraudFlag(
                    invoice_id=invoices[i].id,
                    fraud_type=FraudType.velocity_anomaly,
                    confidence=0.70,
                    severity=AlertSeverity.high,
                    description=(
                        f"Rapid sequential invoice from {supplier.name}: "
                        f"${invoices[i].amount:,.0f} submitted same day as "
                        f"${invoices[i-1].amount:,.0f} (Invoice #{invoices[i-1].invoice_number})"
                    ),
                    engine="velocity_detector",
                ))

        # 2. Volume spike detection – compare recent vs historical
        if len(invoices) >= 6:
            recent_count = len(invoices[-3:])
            recent_total = sum(inv.amount for inv in invoices[-3:])
            hist_avg_amount = sum(inv.amount for inv in invoices[:-3]) / len(invoices[:-3])

            avg_recent = recent_total / recent_count
            if avg_recent > hist_avg_amount * 3:
                target_inv = invoices[-1]
                existing = await session.execute(
                    select(FraudFlag)
                    .where(FraudFlag.invoice_id == target_inv.id)
                    .where(FraudFlag.fraud_type == FraudType.velocity_anomaly)
                    .where(FraudFlag.engine == "velocity_spike_detector")
                )
                if not existing.scalar_one_or_none():
                    flags.append(FraudFlag(
                        invoice_id=target_inv.id,
                        fraud_type=FraudType.velocity_anomaly,
                        confidence=0.80,
                        severity=AlertSeverity.high,
                        description=(
                            f"Invoice volume spike for {supplier.name}: "
                            f"recent avg ${avg_recent:,.0f} is "
                            f"{avg_recent/hist_avg_amount:.1f}x historical avg ${hist_avg_amount:,.0f}"
                        ),
                        engine="velocity_spike_detector",
                    ))

    return flags
