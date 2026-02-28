-- ═══════════════════════════════════════════════════════════════════
-- IntelliTrace – Database Schema
-- Multi-Tier Supply Chain Fraud Detection
-- ═══════════════════════════════════════════════════════════════════

-- Enums
CREATE TYPE tier_enum AS ENUM ('tier_1', 'tier_2', 'tier_3');
CREATE TYPE invoice_status_enum AS ENUM ('pending', 'validated', 'flagged', 'rejected', 'financed');
CREATE TYPE fraud_type_enum AS ENUM (
    'phantom_invoice', 'duplicate_financing', 'over_invoicing',
    'carousel_trade', 'dilution', 'velocity_anomaly', 'cascade_fraud'
);
CREATE TYPE alert_severity_enum AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE alert_status_enum AS ENUM ('open', 'investigating', 'resolved', 'dismissed');

-- Entities (Buyers, Suppliers, Lenders)
CREATE TABLE IF NOT EXISTS entities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    tier tier_enum,
    country VARCHAR(100),
    industry VARCHAR(100),
    annual_revenue FLOAT DEFAULT 0,
    risk_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    fingerprint VARCHAR(64) NOT NULL,
    supplier_id INTEGER REFERENCES entities(id),
    buyer_id INTEGER REFERENCES entities(id),
    lender_id INTEGER REFERENCES entities(id),
    tier tier_enum NOT NULL,
    amount FLOAT NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status invoice_status_enum DEFAULT 'pending',
    po_number VARCHAR(100),
    grn_number VARCHAR(100),
    delivery_confirmed BOOLEAN DEFAULT FALSE,
    po_validated BOOLEAN DEFAULT FALSE,
    grn_validated BOOLEAN DEFAULT FALSE,
    risk_score FLOAT DEFAULT 0.0,
    cascade_group VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_invoice_fingerprint ON invoices(fingerprint);
CREATE INDEX IF NOT EXISTS ix_invoice_supplier_date ON invoices(supplier_id, invoice_date);

-- Fraud Flags
CREATE TABLE IF NOT EXISTS fraud_flags (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id),
    fraud_type fraud_type_enum NOT NULL,
    confidence FLOAT NOT NULL,
    severity alert_severity_enum DEFAULT 'medium',
    description TEXT,
    engine VARCHAR(100),
    detected_at TIMESTAMP DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE
);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity alert_severity_enum DEFAULT 'medium',
    status alert_status_enum DEFAULT 'open',
    fraud_type fraud_type_enum,
    related_invoice_ids TEXT,
    related_entity_ids TEXT,
    total_exposure FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Cash Collections (for dilution monitoring)
CREATE TABLE IF NOT EXISTS cash_collections (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id),
    expected_amount FLOAT NOT NULL,
    collected_amount FLOAT DEFAULT 0,
    collection_date DATE,
    dilution_ratio FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Supply Chain Edges (for graph analytics)
CREATE TABLE IF NOT EXISTS supply_chain_edges (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES entities(id),
    target_id INTEGER REFERENCES entities(id),
    relationship_type VARCHAR(50),
    total_volume FLOAT DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    avg_amount FLOAT DEFAULT 0,
    first_transaction DATE,
    last_transaction DATE,
    risk_score FLOAT DEFAULT 0.0,
    UNIQUE(source_id, target_id)
);
