"""Invoice CRUD and validation routes."""

import hashlib
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Invoice, Entity, FraudFlag, InvoiceStatus
from app.schemas import InvoiceCreate, InvoiceOut, FraudFlagOut
from app.engines.invoice_validator import validate_invoice, compute_fingerprint
from app.engines.duplicate_detector import detect_duplicates

router = APIRouter()


@router.get("/", response_model=List[InvoiceOut])
async def list_invoices(
    status: Optional[str] = None,
    tier: Optional[str] = None,
    min_risk: Optional[float] = None,
    supplier_id: Optional[int] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """List invoices with optional filters."""
    query = select(Invoice).options(selectinload(Invoice.fraud_flags))

    if status:
        query = query.where(Invoice.status == status)
    if tier:
        query = query.where(Invoice.tier == tier)
    if min_risk is not None:
        query = query.where(Invoice.risk_score >= min_risk)
    if supplier_id:
        query = query.where(Invoice.supplier_id == supplier_id)

    query = query.order_by(Invoice.risk_score.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    invoices = result.scalars().all()

    # Enrich with entity names
    out = []
    for inv in invoices:
        inv_dict = InvoiceOut.model_validate(inv)

        supplier = await db.get(Entity, inv.supplier_id)
        buyer = await db.get(Entity, inv.buyer_id)
        inv_dict.supplier_name = supplier.name if supplier else None
        inv_dict.buyer_name = buyer.name if buyer else None
        inv_dict.fraud_flags = [FraudFlagOut.model_validate(f) for f in inv.fraud_flags]

        out.append(inv_dict)

    return out


@router.get("/{invoice_id}", response_model=InvoiceOut)
async def get_invoice(invoice_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single invoice with fraud flags."""
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.fraud_flags))
        .where(Invoice.id == invoice_id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    inv_out = InvoiceOut.model_validate(invoice)
    supplier = await db.get(Entity, invoice.supplier_id)
    buyer = await db.get(Entity, invoice.buyer_id)
    inv_out.supplier_name = supplier.name if supplier else None
    inv_out.buyer_name = buyer.name if buyer else None
    inv_out.fraud_flags = [FraudFlagOut.model_validate(f) for f in invoice.fraud_flags]

    return inv_out


@router.post("/", response_model=InvoiceOut)
async def create_invoice(data: InvoiceCreate, db: AsyncSession = Depends(get_db)):
    """Create a new invoice and run real-time fraud checks."""
    fingerprint = compute_fingerprint(
        data.invoice_number, data.supplier_id, data.buyer_id,
        data.amount, data.invoice_date,
    )

    invoice = Invoice(
        invoice_number=data.invoice_number,
        fingerprint=fingerprint,
        supplier_id=data.supplier_id,
        buyer_id=data.buyer_id,
        lender_id=data.lender_id,
        tier=data.tier,
        amount=data.amount,
        currency=data.currency,
        invoice_date=data.invoice_date,
        due_date=data.due_date,
        po_number=data.po_number,
        grn_number=data.grn_number,
        delivery_confirmed=data.delivery_confirmed,
        po_validated=bool(data.po_number),
        grn_validated=bool(data.grn_number),
        status=InvoiceStatus.pending,
    )
    db.add(invoice)
    await db.flush()

    # Run fraud detection engines
    flags = await validate_invoice(db, invoice)
    dup_flags = await detect_duplicates(db, invoice)
    flags.extend(dup_flags)

    # Calculate risk score
    if flags:
        max_confidence = max(f.confidence for f in flags)
        invoice.risk_score = round(max_confidence * 100, 1)
        if invoice.risk_score > 50:
            invoice.status = InvoiceStatus.flagged

    for flag in flags:
        db.add(flag)

    await db.commit()
    await db.refresh(invoice)

    inv_out = InvoiceOut.model_validate(invoice)
    supplier = await db.get(Entity, invoice.supplier_id)
    buyer = await db.get(Entity, invoice.buyer_id)
    inv_out.supplier_name = supplier.name if supplier else None
    inv_out.buyer_name = buyer.name if buyer else None
    inv_out.fraud_flags = [FraudFlagOut.model_validate(f) for f in flags]

    return inv_out


@router.get("/stats/summary")
async def invoice_summary(db: AsyncSession = Depends(get_db)):
    """Quick summary stats for invoices."""
    total = await db.execute(select(func.count(Invoice.id)))
    amount = await db.execute(select(func.coalesce(func.sum(Invoice.amount), 0)))

    status_result = await db.execute(
        select(Invoice.status, func.count(Invoice.id))
        .group_by(Invoice.status)
    )
    status_breakdown = {}
    for s, c in status_result.all():
        key = s.value if hasattr(s, 'value') else str(s)
        status_breakdown[key] = c

    return {
        "total_invoices": total.scalar(),
        "total_amount": round(amount.scalar(), 2),
        "status_breakdown": status_breakdown,
    }
