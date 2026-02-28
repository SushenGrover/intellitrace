"""
Cross-Tier Cascade Detector
Detects fraudulent cascade patterns where an invoice at Tier 1 triggers
repeated financing down through Tier 2 → Tier 3, multiplying exposure.
"""

from typing import List, Dict, Set
from collections import defaultdict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Invoice, FraudFlag, FraudType, AlertSeverity, Entity


async def detect_cascade_fraud(session: AsyncSession) -> List[FraudFlag]:
    """
    Detect cross-tier cascade fraud:
    1. Find invoices that share cascade groups
    2. Check if amounts multiply across tiers
    3. Flag when total cascaded amount exceeds original by > 2x
    """
    flags: List[FraudFlag] = []

    # Find all invoices with cascade groups
    result = await session.execute(
        select(Invoice)
        .where(Invoice.cascade_group.isnot(None))
        .order_by(Invoice.cascade_group, Invoice.tier)
    )
    invoices = result.scalars().all()

    # Group by cascade group
    cascade_groups: Dict[str, List[Invoice]] = defaultdict(list)
    for inv in invoices:
        cascade_groups[inv.cascade_group].append(inv)

    for group_id, group_invoices in cascade_groups.items():
        if len(group_invoices) < 2:
            continue

        # Separate by tier
        tier_invoices = defaultdict(list)
        for inv in group_invoices:
            tier_invoices[inv.tier.value if hasattr(inv.tier, 'value') else inv.tier].append(inv)

        # Calculate total per tier
        tier_totals = {}
        for tier, invs in tier_invoices.items():
            tier_totals[tier] = sum(i.amount for i in invs)

        # Check for multiplication pattern
        total_cascade = sum(tier_totals.values())
        root_amount = min(tier_totals.values())  # Original root should be smallest

        if total_cascade > root_amount * 2:
            multiplier = total_cascade / root_amount
            for inv in group_invoices:
                existing = await session.execute(
                    select(FraudFlag)
                    .where(FraudFlag.invoice_id == inv.id)
                    .where(FraudFlag.fraud_type == FraudType.cascade_fraud)
                )
                if existing.scalar_one_or_none():
                    continue

                flags.append(FraudFlag(
                    invoice_id=inv.id,
                    fraud_type=FraudType.cascade_fraud,
                    confidence=min(0.5 + (multiplier - 2) * 0.15, 0.99),
                    severity=AlertSeverity.critical if multiplier > 3 else AlertSeverity.high,
                    description=(
                        f"Cross-tier cascade detected in group '{group_id}': "
                        f"{len(group_invoices)} invoices across {len(tier_invoices)} tiers. "
                        f"Total exposure ${total_cascade:,.0f} is {multiplier:.1f}x "
                        f"the root amount ${root_amount:,.0f}. "
                        f"Tier breakdown: {dict(tier_totals)}"
                    ),
                    engine="cascade_detector",
                ))

    return flags
