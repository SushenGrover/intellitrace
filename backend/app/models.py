"""SQLAlchemy ORM Models for IntelliTrace."""

from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, Boolean, Text,
    ForeignKey, Enum as SAEnum, Index, UniqueConstraint,
)
from sqlalchemy.orm import relationship
import enum
from app.database import Base


# ── Enums (names must match PostgreSQL enum values exactly) ─────────
class Tier(str, enum.Enum):
    tier_1 = "tier_1"
    tier_2 = "tier_2"
    tier_3 = "tier_3"


class InvoiceStatus(str, enum.Enum):
    pending = "pending"
    validated = "validated"
    flagged = "flagged"
    rejected = "rejected"
    financed = "financed"


class FraudType(str, enum.Enum):
    phantom_invoice = "phantom_invoice"
    duplicate_financing = "duplicate_financing"
    over_invoicing = "over_invoicing"
    carousel_trade = "carousel_trade"
    dilution = "dilution"
    velocity_anomaly = "velocity_anomaly"
    cascade_fraud = "cascade_fraud"


class AlertSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class AlertStatus(str, enum.Enum):
    open = "open"
    investigating = "investigating"
    resolved = "resolved"
    dismissed = "dismissed"


# ── Entities ────────────────────────────────────────────────────────
class Entity(Base):
    """Buyer, Supplier, or Lender in the supply chain."""
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    entity_type = Column(String(50), nullable=False)  # buyer / supplier / lender
    tier = Column(SAEnum(Tier, name="tier_enum", create_type=False), nullable=True)
    country = Column(String(100))
    industry = Column(String(100))
    annual_revenue = Column(Float, default=0)
    risk_score = Column(Float, default=0.0)  # 0-100
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    invoices_as_supplier = relationship("Invoice", back_populates="supplier", foreign_keys="Invoice.supplier_id")
    invoices_as_buyer = relationship("Invoice", back_populates="buyer", foreign_keys="Invoice.buyer_id")


class Invoice(Base):
    """Core invoice record with ERP-linked fields."""
    __tablename__ = "invoices"
    __table_args__ = (
        Index("ix_invoice_fingerprint", "fingerprint"),
        Index("ix_invoice_supplier_date", "supplier_id", "invoice_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), nullable=False)
    fingerprint = Column(String(64), nullable=False)  # SHA-256 of key fields
    supplier_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    lender_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    tier = Column(SAEnum(Tier, name="tier_enum", create_type=False), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(SAEnum(InvoiceStatus, name="invoice_status_enum", create_type=False), default=InvoiceStatus.pending)
    po_number = Column(String(100), nullable=True)
    grn_number = Column(String(100), nullable=True)
    delivery_confirmed = Column(Boolean, default=False)
    po_validated = Column(Boolean, default=False)
    grn_validated = Column(Boolean, default=False)
    risk_score = Column(Float, default=0.0)  # 0-100
    cascade_group = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    supplier = relationship("Entity", back_populates="invoices_as_supplier", foreign_keys=[supplier_id])
    buyer = relationship("Entity", back_populates="invoices_as_buyer", foreign_keys=[buyer_id])
    fraud_flags = relationship("FraudFlag", back_populates="invoice")


class FraudFlag(Base):
    """Fraud detection flag raised by an engine."""
    __tablename__ = "fraud_flags"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    fraud_type = Column(SAEnum(FraudType, name="fraud_type_enum", create_type=False), nullable=False)
    confidence = Column(Float, nullable=False)  # 0.0-1.0
    severity = Column(SAEnum(AlertSeverity, name="alert_severity_enum", create_type=False), default=AlertSeverity.medium)
    description = Column(Text)
    engine = Column(String(100))  # which detection engine
    detected_at = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Boolean, default=False)

    invoice = relationship("Invoice", back_populates="fraud_flags")


class Alert(Base):
    """Real-time alert for pre-disbursement early warning."""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    severity = Column(SAEnum(AlertSeverity, name="alert_severity_enum", create_type=False), default=AlertSeverity.medium)
    status = Column(SAEnum(AlertStatus, name="alert_status_enum", create_type=False), default=AlertStatus.open)
    fraud_type = Column(SAEnum(FraudType, name="fraud_type_enum", create_type=False), nullable=True)
    related_invoice_ids = Column(Text)  # comma-separated IDs
    related_entity_ids = Column(Text)
    total_exposure = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CashCollection(Base):
    """Cash collection records for dilution monitoring."""
    __tablename__ = "cash_collections"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    expected_amount = Column(Float, nullable=False)
    collected_amount = Column(Float, default=0)
    collection_date = Column(Date, nullable=True)
    dilution_ratio = Column(Float, default=0.0)  # (expected - collected) / expected
    created_at = Column(DateTime, default=datetime.utcnow)


class SupplyChainEdge(Base):
    """Edge in the supply chain network graph."""
    __tablename__ = "supply_chain_edges"
    __table_args__ = (
        UniqueConstraint("source_id", "target_id", name="uq_edge"),
    )

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    target_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    relationship_type = Column(String(50))  # buyer_supplier, supplier_lender
    total_volume = Column(Float, default=0)
    transaction_count = Column(Integer, default=0)
    avg_amount = Column(Float, default=0)
    first_transaction = Column(Date, nullable=True)
    last_transaction = Column(Date, nullable=True)
    risk_score = Column(Float, default=0.0)
