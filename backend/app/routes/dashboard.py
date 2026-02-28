"""Dashboard API – aggregated stats and metrics."""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, case, and_, literal_column
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Invoice, FraudFlag, Alert, Entity, InvoiceStatus, FraudType, AlertSeverity
from app.schemas import DashboardStats, AlertOut

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Get comprehensive dashboard statistics."""

    # Total invoices and amount
    inv_result = await db.execute(
        select(func.count(Invoice.id), func.coalesce(func.sum(Invoice.amount), 0))
    )
    total_invoices, total_amount = inv_result.one()

    # Flagged invoices
    flagged_result = await db.execute(
        select(func.count(Invoice.id), func.coalesce(func.sum(Invoice.amount), 0))
        .where(Invoice.status.in_([InvoiceStatus.flagged, InvoiceStatus.pending]))
        .where(Invoice.risk_score > 50)
    )
    flagged_invoices, flagged_amount = flagged_result.one()

    # Fraud flags count
    flags_result = await db.execute(select(func.count(FraudFlag.id)))
    fraud_flags_count = flags_result.scalar()

    # Critical alerts
    critical_result = await db.execute(
        select(func.count(Alert.id))
        .where(Alert.severity == AlertSeverity.critical)
        .where(Alert.status == 'open')
    )
    critical_alerts = critical_result.scalar()

    # Entity count
    entity_result = await db.execute(select(func.count(Entity.id)))
    entities_count = entity_result.scalar()

    # Average risk score
    avg_risk = await db.execute(
        select(func.coalesce(func.avg(Invoice.risk_score), 0))
    )
    avg_risk_score = round(avg_risk.scalar(), 1)

    # Fraud by type
    fraud_type_result = await db.execute(
        select(FraudFlag.fraud_type, func.count(FraudFlag.id))
        .group_by(FraudFlag.fraud_type)
    )
    fraud_by_type = {}
    for ftype, count in fraud_type_result.all():
        key = ftype.value if hasattr(ftype, 'value') else str(ftype)
        fraud_by_type[key] = count

    # Tier breakdown
    tier_result = await db.execute(
        select(
            Invoice.tier,
            func.count(Invoice.id),
            func.coalesce(func.sum(Invoice.amount), 0)
        ).group_by(Invoice.tier)
    )
    tier_breakdown = {}
    for tier, count, amount in tier_result.all():
        key = tier.value if hasattr(tier, 'value') else str(tier)
        tier_breakdown[key] = {"count": count, "amount": round(amount, 2)}

    # Recent alerts
    alerts_result = await db.execute(
        select(Alert).order_by(Alert.created_at.desc()).limit(10)
    )
    recent_alerts = [AlertOut.model_validate(a) for a in alerts_result.scalars().all()]

    # Risk distribution
    risk_dist = await db.execute(
        select(
            func.count(case((Invoice.risk_score < 20, 1))).label("low"),
            func.count(case((and_(Invoice.risk_score >= 20, Invoice.risk_score < 50), 1))).label("medium"),
            func.count(case((and_(Invoice.risk_score >= 50, Invoice.risk_score < 75), 1))).label("high"),
            func.count(case((Invoice.risk_score >= 75, 1))).label("critical"),
        )
    )
    rd = risk_dist.one()
    risk_distribution = {"low": rd[0], "medium": rd[1], "high": rd[2], "critical": rd[3]}

    # Monthly trend (last 6 months)
    monthly_trend = []
    month_col = func.date_trunc(literal_column("'month'"), Invoice.invoice_date)
    months_result = await db.execute(
        select(
            month_col.label('month'),
            func.count(Invoice.id),
            func.coalesce(func.sum(Invoice.amount), 0),
            func.count(case((Invoice.risk_score > 50, 1))).label("flagged")
        )
        .group_by(month_col)
        .order_by(month_col)
    )
    for month, count, amount, flagged in months_result.all():
        monthly_trend.append({
            "month": month.strftime("%Y-%m") if month else "",
            "count": count,
            "amount": round(amount, 2),
            "flagged": flagged,
        })

    return DashboardStats(
        total_invoices=total_invoices,
        total_amount=round(total_amount, 2),
        flagged_invoices=flagged_invoices,
        flagged_amount=round(flagged_amount, 2),
        fraud_flags_count=fraud_flags_count,
        critical_alerts=critical_alerts,
        entities_count=entities_count,
        avg_risk_score=avg_risk_score,
        fraud_by_type=fraud_by_type,
        tier_breakdown=tier_breakdown,
        recent_alerts=recent_alerts,
        risk_distribution=risk_distribution,
        monthly_trend=monthly_trend,
    )
