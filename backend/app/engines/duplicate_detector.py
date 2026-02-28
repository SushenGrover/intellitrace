"""
Duplicate Detection Engine
Uses invoice fingerprints to detect duplicate financing across lenders.
"""

from typing import List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Invoice, FraudFlag, FraudType, AlertSeverity


async def detect_duplicates(session: AsyncSession, invoice: Invoice = None) -> List[FraudFlag]:
    """
    Detect duplicate invoices using fingerprint matching.
    If invoice is provided, check only against that invoice.
    Otherwise, scan all pending invoices.
    """
    flags: List[FraudFlag] = []

    if invoice:
        # Find other invoices with the same fingerprint
        result = await session.execute(
            select(Invoice)
            .where(Invoice.fingerprint == invoice.fingerprint)
            .where(Invoice.id != invoice.id)
        )
        duplicates = result.scalars().all()

        if duplicates:
            dup_ids = [str(d.id) for d in duplicates]
            total_exposure = sum(d.amount for d in duplicates) + invoice.amount

            # Check if financed by different lenders – worst case
            lender_ids = {d.lender_id for d in duplicates if d.lender_id}
            if invoice.lender_id:
                lender_ids.add(invoice.lender_id)

            multi_lender = len(lender_ids) > 1

            flags.append(FraudFlag(
                invoice_id=invoice.id,
                fraud_type=FraudType.duplicate_financing,
                confidence=0.95 if multi_lender else 0.80,
                severity=AlertSeverity.critical if multi_lender else AlertSeverity.high,
                description=(
                    f"Invoice fingerprint matches {len(duplicates)} other invoice(s) "
                    f"[IDs: {', '.join(dup_ids)}]. "
                    f"Total exposure: ${total_exposure:,.0f}. "
                    f"{'Multiple lenders involved – likely double financing!' if multi_lender else 'Same lender – possible resubmission.'}"
                ),
                engine="duplicate_detector",
            ))
    else:
        # Full scan: find all fingerprints that appear more than once
        dup_query = await session.execute(
            select(Invoice.fingerprint, func.count(Invoice.id).label("cnt"))
            .group_by(Invoice.fingerprint)
            .having(func.count(Invoice.id) > 1)
        )
        dup_fingerprints = dup_query.all()

        for fp, count in dup_fingerprints:
            inv_result = await session.execute(
                select(Invoice).where(Invoice.fingerprint == fp)
            )
            invoices = inv_result.scalars().all()
            total_exposure = sum(inv.amount for inv in invoices)
            lender_ids = {inv.lender_id for inv in invoices if inv.lender_id}

            for inv in invoices:
                # Check if already flagged
                existing = await session.execute(
                    select(FraudFlag)
                    .where(FraudFlag.invoice_id == inv.id)
                    .where(FraudFlag.fraud_type == FraudType.duplicate_financing)
                )
                if existing.scalar_one_or_none():
                    continue

                flags.append(FraudFlag(
                    invoice_id=inv.id,
                    fraud_type=FraudType.duplicate_financing,
                    confidence=0.95 if len(lender_ids) > 1 else 0.80,
                    severity=AlertSeverity.critical if len(lender_ids) > 1 else AlertSeverity.high,
                    description=(
                        f"Duplicate fingerprint found across {count} invoices. "
                        f"Total exposure: ${total_exposure:,.0f}. "
                        f"Lenders involved: {len(lender_ids)}"
                    ),
                    engine="duplicate_detector",
                ))

    return flags
