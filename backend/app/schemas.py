"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List
from enum import Enum


# ── Enums ───────────────────────────────────────────────────────────
class TierEnum(str, Enum):
    TIER_1 = "tier_1"
    TIER_2 = "tier_2"
    TIER_3 = "tier_3"


class InvoiceStatusEnum(str, Enum):
    PENDING = "pending"
    VALIDATED = "validated"
    FLAGGED = "flagged"
    REJECTED = "rejected"
    FINANCED = "financed"


class FraudTypeEnum(str, Enum):
    PHANTOM_INVOICE = "phantom_invoice"
    DUPLICATE_FINANCING = "duplicate_financing"
    OVER_INVOICING = "over_invoicing"
    CAROUSEL_TRADE = "carousel_trade"
    DILUTION = "dilution"
    VELOCITY_ANOMALY = "velocity_anomaly"
    CASCADE_FRAUD = "cascade_fraud"


class SeverityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# ── Entity ──────────────────────────────────────────────────────────
class EntityOut(BaseModel):
    id: int
    name: str
    entity_type: str
    tier: Optional[str] = None
    country: Optional[str] = None
    industry: Optional[str] = None
    annual_revenue: float = 0
    risk_score: float = 0

    class Config:
        from_attributes = True


# ── Invoice ─────────────────────────────────────────────────────────
class InvoiceCreate(BaseModel):
    invoice_number: str
    supplier_id: int
    buyer_id: int
    lender_id: Optional[int] = None
    tier: TierEnum
    amount: float = Field(gt=0)
    currency: str = "USD"
    invoice_date: date
    due_date: date
    po_number: Optional[str] = None
    grn_number: Optional[str] = None
    delivery_confirmed: bool = False


class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    fingerprint: str
    supplier_id: int
    buyer_id: int
    lender_id: Optional[int] = None
    tier: str
    amount: float
    currency: str
    invoice_date: date
    due_date: date
    status: str
    po_number: Optional[str] = None
    grn_number: Optional[str] = None
    delivery_confirmed: bool
    po_validated: bool
    grn_validated: bool
    risk_score: float
    cascade_group: Optional[str] = None
    created_at: datetime
    supplier_name: Optional[str] = None
    buyer_name: Optional[str] = None
    fraud_flags: Optional[List["FraudFlagOut"]] = []

    class Config:
        from_attributes = True


# ── Fraud Flag ──────────────────────────────────────────────────────
class FraudFlagOut(BaseModel):
    id: int
    invoice_id: int
    fraud_type: str
    confidence: float
    severity: str
    description: Optional[str] = None
    engine: Optional[str] = None
    detected_at: datetime

    class Config:
        from_attributes = True


# ── Alert ───────────────────────────────────────────────────────────
class AlertOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    severity: str
    status: str
    fraud_type: Optional[str] = None
    related_invoice_ids: Optional[str] = None
    related_entity_ids: Optional[str] = None
    total_exposure: float
    created_at: datetime

    class Config:
        from_attributes = True


# ── Dashboard ───────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_invoices: int
    total_amount: float
    flagged_invoices: int
    flagged_amount: float
    fraud_flags_count: int
    critical_alerts: int
    entities_count: int
    avg_risk_score: float
    fraud_by_type: dict
    tier_breakdown: dict
    recent_alerts: List[AlertOut]
    risk_distribution: dict
    monthly_trend: List[dict]


# ── Graph Analytics ─────────────────────────────────────────────────
class NetworkNode(BaseModel):
    id: int
    name: str
    entity_type: str
    tier: Optional[str] = None
    risk_score: float = 0
    size: float = 10


class NetworkEdge(BaseModel):
    source: int
    target: int
    relationship_type: Optional[str] = None
    volume: float = 0
    risk_score: float = 0


class NetworkGraph(BaseModel):
    nodes: List[NetworkNode]
    edges: List[NetworkEdge]
    communities: List[List[int]] = []
    carousel_cycles: List[List[int]] = []


class FraudScanResult(BaseModel):
    scan_id: str
    timestamp: datetime
    invoices_scanned: int
    flags_raised: int
    flags: List[FraudFlagOut]
    summary: dict
