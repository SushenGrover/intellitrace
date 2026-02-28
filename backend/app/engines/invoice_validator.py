"""
Invoice Validation Engine
Validates invoices against PO, GRN, and delivery confirmations.
Checks feasibility metrics (revenue vs invoice volume) to flag phantoms.
"""

import hashlib
from datetime import datetime
from typing import List, Tuple

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Invoice, Entity, FraudFlag, FraudType, AlertSeverity, Tier


def compute_fingerprint(invoice_number: str, supplier_id: int, buyer_id: int,
                        amount: float, invoice_date) -> str:
    """Create SHA-256 fingerprint from core invoice fields."""
    raw = f"{invoice_number}|{supplier_id}|{buyer_id}|{amount:.2f}|{invoice_date}"
    return hashlib.sha256(raw.encode()).hexdigest()


async def validate_invoice(session: AsyncSession, invoice: Invoice) -> List[FraudFlag]:
    """Run all validation checks on a single invoice."""
    flags: List[FraudFlag] = []

    # 1. PO/GRN/Delivery validation
    if not invoice.po_validated and invoice.po_number:
        flags.append(FraudFlag(
            invoice_id=invoice.id,
            fraud_type=FraudType.phantom_invoice,
            confidence=0.6,
            severity=AlertSeverity.medium,
            description=f"PO #{invoice.po_number} could not be validated against ERP records",
            engine="invoice_validator",
        ))

    if not invoice.grn_validated and invoice.grn_number:
        flags.append(FraudFlag(
            invoice_id=invoice.id,
            fraud_type=FraudType.phantom_invoice,
            confidence=0.65,
            severity=AlertSeverity.medium,
            description=f"GRN #{invoice.grn_number} mismatch – goods receipt not confirmed",
            engine="invoice_validator",
        ))

    if not invoice.delivery_confirmed:
        flags.append(FraudFlag(
            invoice_id=invoice.id,
            fraud_type=FraudType.phantom_invoice,
            confidence=0.7,
            severity=AlertSeverity.high,
            description="No delivery confirmation found for this invoice",
            engine="invoice_validator",
        ))

    # No PO or GRN at all – suspicious
    if not invoice.po_number and not invoice.grn_number:
        flags.append(FraudFlag(
            invoice_id=invoice.id,
            fraud_type=FraudType.phantom_invoice,
            confidence=0.85,
            severity=AlertSeverity.high,
            description="Invoice has no associated PO or GRN – potential phantom invoice",
            engine="invoice_validator",
        ))

    # 2. Feasibility check – invoice amount vs supplier annual revenue
    supplier = await session.get(Entity, invoice.supplier_id)
    if supplier and supplier.annual_revenue > 0:
        ratio = invoice.amount / supplier.annual_revenue
        if ratio > 0.25:
            flags.append(FraudFlag(
                invoice_id=invoice.id,
                fraud_type=FraudType.phantom_invoice,
                confidence=min(0.5 + ratio, 0.99),
                severity=AlertSeverity.critical if ratio > 0.5 else AlertSeverity.high,
                description=(
                    f"Single invoice is {ratio*100:.1f}% of supplier annual revenue "
                    f"(${invoice.amount:,.0f} vs ${supplier.annual_revenue:,.0f})"
                ),
                engine="feasibility_checker",
            ))

    # 3. Over-invoicing: check if amount exceeds 2x the average for this supplier-buyer pair
    avg_result = await session.execute(
        select(func.avg(Invoice.amount), func.count(Invoice.id))
        .where(Invoice.supplier_id == invoice.supplier_id)
        .where(Invoice.buyer_id == invoice.buyer_id)
        .where(Invoice.id != invoice.id)
    )
    row = avg_result.one_or_none()
    if row and row[0] and row[1] >= 3:
        avg_amount = row[0]
        if invoice.amount > avg_amount * 2.5:
            flags.append(FraudFlag(
                invoice_id=invoice.id,
                fraud_type=FraudType.over_invoicing,
                confidence=0.75,
                severity=AlertSeverity.high,
                description=(
                    f"Invoice amount ${invoice.amount:,.0f} is "
                    f"{invoice.amount/avg_amount:.1f}x the historical average "
                    f"${avg_amount:,.0f} for this trading pair"
                ),
                engine="over_invoice_detector",
            ))

    return flags
