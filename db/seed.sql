-- ═══════════════════════════════════════════════════════════════════
-- IntelliTrace – Seed Data
-- Realistic multi-tier supply chain with embedded fraud patterns
-- ═══════════════════════════════════════════════════════════════════

-- ── ENTITIES ───────────────────────────────────────────────────────

-- Buyers (large corporations)
INSERT INTO entities (id, name, entity_type, tier, country, industry, annual_revenue, risk_score) VALUES
(1,  'GlobalTech Corp',         'buyer',    NULL,     'USA',        'Technology',       5000000000, 10),
(2,  'AutoNova Industries',     'buyer',    NULL,     'Germany',    'Automotive',       3200000000, 15),
(3,  'MedPharma Holdings',      'buyer',    NULL,     'Switzerland','Pharmaceuticals',  4100000000, 8);

-- Tier 1 Suppliers
INSERT INTO entities (id, name, entity_type, tier, country, industry, annual_revenue, risk_score) VALUES
(4,  'PrecisionParts Ltd',      'supplier', 'tier_1', 'USA',        'Manufacturing',    180000000, 25),
(5,  'ChipMakers Inc',          'supplier', 'tier_1', 'Taiwan',     'Semiconductors',   320000000, 12),
(6,  'SteelForge GmbH',         'supplier', 'tier_1', 'Germany',    'Steel',            250000000, 18),
(7,  'PharmaSynth Co',          'supplier', 'tier_1', 'India',      'Chemicals',        140000000, 30),
(8,  'QuickSupply Corp',        'supplier', 'tier_1', 'USA',        'Distribution',     95000000,  65);

-- Tier 2 Suppliers  
INSERT INTO entities (id, name, entity_type, tier, country, industry, annual_revenue, risk_score) VALUES
(9,  'RawMetal Works',          'supplier', 'tier_2', 'China',      'Raw Materials',    45000000,  35),
(10, 'CircuitBoard Express',    'supplier', 'tier_2', 'Vietnam',    'Electronics',      28000000,  40),
(11, 'ChemBase Solutions',      'supplier', 'tier_2', 'India',      'Chemicals',        18000000,  55),
(12, 'PackLogis Inc',           'supplier', 'tier_2', 'Mexico',     'Logistics',        22000000,  45),
(13, 'ShadowTrade LLC',         'supplier', 'tier_2', 'Cyprus',     'Trading',          8000000,   85);

-- Tier 3 Suppliers
INSERT INTO entities (id, name, entity_type, tier, country, industry, annual_revenue, risk_score) VALUES
(14, 'MineralSource Pty',       'supplier', 'tier_3', 'South Africa','Mining',          12000000,  30),
(15, 'PlastiChem Ltd',          'supplier', 'tier_3', 'Thailand',   'Plastics',         6500000,   50),
(16, 'MicroWeld Shop',          'supplier', 'tier_3', 'Bangladesh', 'Welding',          3200000,   60),
(17, 'ShellCo Enterprises',     'supplier', 'tier_3', 'BVI',        'Trading',          1200000,   92);

-- Lenders
INSERT INTO entities (id, name, entity_type, tier, country, industry, annual_revenue, risk_score) VALUES
(18, 'Capital Finance Bank',    'lender',   NULL,     'USA',        'Banking',          0, 5),
(19, 'EuroTrade Credit',        'lender',   NULL,     'UK',         'Trade Finance',    0, 8),
(20, 'Pacific SCF Fund',        'lender',   NULL,     'Singapore',  'Trade Finance',    0, 6);


-- ── SUPPLY CHAIN EDGES ─────────────────────────────────────────────

-- Buyer → Tier 1
INSERT INTO supply_chain_edges (source_id, target_id, relationship_type, total_volume, transaction_count, avg_amount, first_transaction, last_transaction, risk_score) VALUES
(1, 4,  'buyer_supplier', 12500000, 45, 277778, '2024-01-15', '2025-12-01', 15),
(1, 5,  'buyer_supplier', 18000000, 38, 473684, '2024-03-01', '2025-11-15', 10),
(2, 6,  'buyer_supplier', 22000000, 52, 423077, '2024-02-10', '2025-12-10', 12),
(2, 8,  'buyer_supplier', 8500000,  35, 242857, '2024-06-01', '2025-11-30', 55),
(3, 7,  'buyer_supplier', 15000000, 42, 357143, '2024-01-20', '2025-12-05', 20),
(1, 8,  'buyer_supplier', 6200000,  28, 221429, '2024-07-15', '2025-11-28', 60);

-- Tier 1 → Tier 2
INSERT INTO supply_chain_edges (source_id, target_id, relationship_type, total_volume, transaction_count, avg_amount, first_transaction, last_transaction, risk_score) VALUES
(4, 9,   'buyer_supplier', 5200000,  30, 173333, '2024-02-01', '2025-11-20', 25),
(5, 10,  'buyer_supplier', 4800000,  25, 192000, '2024-04-01', '2025-11-18', 30),
(6, 9,   'buyer_supplier', 6100000,  28, 217857, '2024-03-01', '2025-11-25', 20),
(7, 11,  'buyer_supplier', 3500000,  22, 159091, '2024-02-15', '2025-11-22', 40),
(8, 12,  'buyer_supplier', 2800000,  18, 155556, '2024-08-01', '2025-11-15', 50),
(8, 13,  'buyer_supplier', 4200000,  15, 280000, '2024-09-01', '2025-11-28', 80);

-- Tier 2 → Tier 3
INSERT INTO supply_chain_edges (source_id, target_id, relationship_type, total_volume, transaction_count, avg_amount, first_transaction, last_transaction, risk_score) VALUES
(9,  14, 'buyer_supplier', 2100000, 18, 116667, '2024-03-01', '2025-10-30', 22),
(10, 15, 'buyer_supplier', 1500000, 12, 125000, '2024-05-01', '2025-10-15', 35),
(11, 15, 'buyer_supplier', 1200000, 10, 120000, '2024-04-01', '2025-10-20', 40),
(13, 17, 'buyer_supplier', 3800000, 8,  475000, '2024-10-01', '2025-11-25', 90);

-- Carousel cycle: 13 → 17 → 8 → 13 (circular trading)
INSERT INTO supply_chain_edges (source_id, target_id, relationship_type, total_volume, transaction_count, avg_amount, first_transaction, last_transaction, risk_score) VALUES
(17, 8,  'buyer_supplier', 2900000, 6,  483333, '2024-11-01', '2025-11-20', 88),
(12, 13, 'buyer_supplier', 1500000, 5,  300000, '2025-01-01', '2025-11-10', 75);

-- Supplier → Lender
INSERT INTO supply_chain_edges (source_id, target_id, relationship_type, total_volume, transaction_count, avg_amount, first_transaction, last_transaction, risk_score) VALUES
(4, 18,  'supplier_lender', 10000000, 40, 250000, '2024-01-20', '2025-12-01', 10),
(5, 19,  'supplier_lender', 14000000, 35, 400000, '2024-03-05', '2025-11-15', 8),
(6, 18,  'supplier_lender', 18000000, 48, 375000, '2024-02-15', '2025-12-10', 10),
(7, 20,  'supplier_lender', 12000000, 38, 315789, '2024-01-25', '2025-12-05', 15),
(8, 18,  'supplier_lender', 7500000,  30, 250000, '2024-06-10', '2025-11-30', 50),
(8, 19,  'supplier_lender', 5000000,  20, 250000, '2024-08-01', '2025-11-28', 55);


-- ── INVOICES (Legitimate + Fraudulent) ──────────────────────────────

-- Helper: fingerprint = md5(invoice_number || supplier_id || buyer_id || amount || date)

-- === LEGITIMATE INVOICES ===

-- GlobalTech ↔ PrecisionParts (Tier 1) – normal trading
INSERT INTO invoices (invoice_number, fingerprint, supplier_id, buyer_id, lender_id, tier, amount, invoice_date, due_date, status, po_number, grn_number, delivery_confirmed, po_validated, grn_validated, risk_score) VALUES
('PP-2025-001', 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2', 4, 1, 18, 'tier_1', 285000, '2025-01-15', '2025-03-15', 'financed', 'PO-GT-10001', 'GRN-GT-10001', true, true, true, 8),
('PP-2025-002', 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b3', 4, 1, 18, 'tier_1', 310000, '2025-02-10', '2025-04-10', 'financed', 'PO-GT-10002', 'GRN-GT-10002', true, true, true, 5),
('PP-2025-003', 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b4c5', 4, 1, 18, 'tier_1', 265000, '2025-03-05', '2025-05-05', 'validated', 'PO-GT-10003', 'GRN-GT-10003', true, true, true, 6),
('PP-2025-004', 'pp2025004fp00000000000000000000000000000000000000000000000000004', 4, 1, 18, 'tier_1', 292000, '2025-04-12', '2025-06-12', 'financed', 'PO-GT-10004', 'GRN-GT-10004', true, true, true, 7),
('PP-2025-005', 'pp2025005fp00000000000000000000000000000000000000000000000000005', 4, 1, 18, 'tier_1', 278000, '2025-05-18', '2025-07-18', 'validated', 'PO-GT-10005', 'GRN-GT-10005', true, true, true, 5);

-- ChipMakers → GlobalTech (Tier 1)
INSERT INTO invoices (invoice_number, fingerprint, supplier_id, buyer_id, lender_id, tier, amount, invoice_date, due_date, status, po_number, grn_number, delivery_confirmed, po_validated, grn_validated, risk_score) VALUES
('CM-2025-001', 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b5cm01', 5, 1, 19, 'tier_1', 480000, '2025-01-20', '2025-03-20', 'financed', 'PO-GT-20001', 'GRN-GT-20001', true, true, true, 10),
('CM-2025-002', 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b6cm0002', 5, 1, 19, 'tier_1', 520000, '2025-02-25', '2025-04-25', 'financed', 'PO-GT-20002', 'GRN-GT-20002', true, true, true, 8),
('CM-2025-003', 'cm2025003fp00000000000000000000000000000000000000000000000000003', 5, 1, 19, 'tier_1', 495000, '2025-03-20', '2025-05-20', 'validated', 'PO-GT-20003', 'GRN-GT-20003', true, true, true, 9),
('CM-2025-004', 'cm2025004fp00000000000000000000000000000000000000000000000000004', 5, 1, 19, 'tier_1', 510000, '2025-04-15', '2025-06-15', 'financed', 'PO-GT-20004', 'GRN-GT-20004', true, true, true, 7);

-- SteelForge → AutoNova (Tier 1)
INSERT INTO invoices (invoice_number, fingerprint, supplier_id, buyer_id, lender_id, tier, amount, invoice_date, due_date, status, po_number, grn_number, delivery_confirmed, po_validated, grn_validated, risk_score) VALUES
('SF-2025-001', 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b7sf000001', 6, 2, 18, 'tier_1', 420000, '2025-01-10', '2025-03-10', 'financed', 'PO-AN-30001', 'GRN-AN-30001', true, true, true, 12),
('SF-2025-002', 'sf2025002fp00000000000000000000000000000000000000000000000000002', 6, 2, 18, 'tier_1', 395000, '2025-02-15', '2025-04-15', 'financed', 'PO-AN-30002', 'GRN-AN-30002', true, true, true, 10),
('SF-2025-003', 'sf2025003fp00000000000000000000000000000000000000000000000000003', 6, 2, 18, 'tier_1', 440000, '2025-03-20', '2025-05-20', 'validated', 'PO-AN-30003', 'GRN-AN-30003', true, true, true, 11);

-- PharmaSynth → MedPharma (Tier 1)
INSERT INTO invoices (invoice_number, fingerprint, supplier_id, buyer_id, lender_id, tier, amount, invoice_date, due_date, status, po_number, grn_number, delivery_confirmed, po_validated, grn_validated, risk_score) VALUES
('PS-2025-001', 'ps2025001fp00000000000000000000000000000000000000000000000000001', 7, 3, 20, 'tier_1', 360000, '2025-01-25', '2025-03-25', 'financed', 'PO-MP-40001', 'GRN-MP-40001', true, true, true, 15),
('PS-2025-002', 'ps2025002fp00000000000000000000000000000000000000000000000000002', 7, 3, 20, 'tier_1', 345000, '2025-02-28', '2025-04-28', 'financed', 'PO-MP-40002', 'GRN-MP-40002', true, true, true, 12),
('PS-2025-003', 'ps2025003fp00000000000000000000000000000000000000000000000000003', 7, 3, 20, 'tier_1', 380000, '2025-04-10', '2025-06-10', 'validated', 'PO-MP-40003', 'GRN-MP-40003', true, true, true, 14);

-- Tier 2 legitimate
INSERT INTO invoices (invoice_number, fingerprint, supplier_id, buyer_id, lender_id, tier, amount, invoice_date, due_date, status, po_number, grn_number, delivery_confirmed, po_validated, grn_validated, risk_score) VALUES
('RM-2025-001', 'rm2025001fp00000000000000000000000000000000000000000000000000001', 9, 4, 18, 'tier_2', 175000, '2025-01-20', '2025-03-20', 'financed', 'PO-PP-50001', 'GRN-PP-50001', true, true, true, 15),
('RM-2025-002', 'rm2025002fp00000000000000000000000000000000000000000000000000002', 9, 6, 18, 'tier_2', 220000, '2025-02-15', '2025-04-15', 'financed', 'PO-SF-50002', 'GRN-SF-50002', true, true, true, 12),
('CB-2025-001', 'cb2025001fp00000000000000000000000000000000000000000000000000001', 10, 5, 19, 'tier_2', 195000, '2025-02-01', '2025-04-01', 'financed', 'PO-CM-60001', 'GRN-CM-60001', true, true, true, 18),
('CS-2025-001', 'cs2025001fp00000000000000000000000000000000000000000000000000001', 11, 7, 20, 'tier_2', 160000, '2025-01-28', '2025-03-28', 'financed', 'PO-PS-70001', 'GRN-PS-70001', true, true, true, 20);

-- Tier 3 legitimate  
INSERT INTO invoices (invoice_number, fingerprint, supplier_id, buyer_id, lender_id, tier, amount, invoice_date, due_date, status, po_number, grn_number, delivery_confirmed, po_validated, grn_validated, risk_score) VALUES
('MS-2025-001', 'ms2025001fp00000000000000000000000000000000000000000000000000001', 14, 9, 18, 'tier_3', 118000, '2025-02-05', '2025-04-05', 'financed', 'PO-RM-80001', 'GRN-RM-80001', true, true, true, 20),
('PC-2025-001', 'pc2025001fp00000000000000000000000000000000000000000000000000001', 15, 10, 19, 'tier_3', 125000, '2025-03-01', '2025-05-01', 'financed', 'PO-CB-90001', 'GRN-CB-90001', true, true, true, 22);


-- === FRAUDULENT INVOICES ===

-- ▸ PHANTOM INVOICES from QuickSupply (entity 8) – no PO/GRN, high volume
INSERT INTO invoices (invoice_number, fingerprint, supplier_id, buyer_id, lender_id, tier, amount, invoice_date, due_date, status, po_number, grn_number, delivery_confirmed, po_validated, grn_validated, risk_score, cascade_group) VALUES
('QS-2025-P01', 'qs2025p01fp0000000000000000000000000000000000000000000000000001', 8, 1, 18, 'tier_1', 450000, '2025-06-01', '2025-08-01', 'pending', NULL, NULL, false, false, false, 78, 'CASCADE-001'),
('QS-2025-P02', 'qs2025p02fp0000000000000000000000000000000000000000000000000002', 8, 1, 18, 'tier_1', 520000, '2025-06-01', '2025-08-01', 'pending', NULL, NULL, false, false, false, 82, 'CASCADE-001'),
('QS-2025-P03', 'qs2025p03fp0000000000000000000000000000000000000000000000000003', 8, 2, 19, 'tier_1', 380000, '2025-06-05', '2025-08-05', 'pending', 'PO-FAKE-001', NULL, false, false, false, 75, 'CASCADE-002'),
('QS-2025-P04', 'qs2025p04fp0000000000000000000000000000000000000000000000000004', 8, 2, 18, 'tier_1', 610000, '2025-06-05', '2025-08-05', 'pending', NULL, NULL, false, false, false, 88, NULL),
('QS-2025-P05', 'qs2025p05fp0000000000000000000000000000000000000000000000000005', 8, 1, 19, 'tier_1', 495000, '2025-06-10', '2025-08-10', 'pending', NULL, NULL, false, false, false, 80, 'CASCADE-001');

-- ▸ DUPLICATE FINANCING – same invoices submitted to different lenders
INSERT INTO invoices (invoice_number, fingerprint, supplier_id, buyer_id, lender_id, tier, amount, invoice_date, due_date, status, po_number, grn_number, delivery_confirmed, po_validated, grn_validated, risk_score) VALUES
-- Duplicate of PP-2025-003 (same fingerprint!)
('PP-2025-003-DUP', 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b4c5', 4, 1, 19, 'tier_1', 265000, '2025-03-05', '2025-05-05', 'pending', 'PO-GT-10003', 'GRN-GT-10003', true, true, true, 72),
-- Duplicate of CM-2025-002 (same fingerprint!)
('CM-2025-002-DUP', 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b6cm0002', 5, 1, 20, 'tier_1', 520000, '2025-02-25', '2025-04-25', 'pending', 'PO-GT-20002', 'GRN-GT-20002', true, true, true, 70);

-- ▸ OVER-INVOICING – unusually high amounts
INSERT INTO invoices (invoice_number, fingerprint, supplier_id, buyer_id, lender_id, tier, amount, invoice_date, due_date, status, po_number, grn_number, delivery_confirmed, po_validated, grn_validated, risk_score) VALUES
('SF-2025-OI1', 'sf2025oi1fp0000000000000000000000000000000000000000000000000001', 6, 2, 18, 'tier_1', 1850000, '2025-05-20', '2025-07-20', 'pending', 'PO-AN-30010', 'GRN-AN-30010', true, true, true, 65),
('CS-2025-OI1', 'cs2025oi1fp0000000000000000000000000000000000000000000000000001', 11, 7, 20, 'tier_2', 890000, '2025-05-15', '2025-07-15', 'pending', 'PO-PS-70010', 'GRN-PS-70010', true, true, true, 60);

-- ▸ CASCADE FRAUD – Tier 2/3 invoices cascading from phantom Tier 1
INSERT INTO invoices (invoice_number, fingerprint, supplier_id, buyer_id, lender_id, tier, amount, invoice_date, due_date, status, po_number, grn_number, delivery_confirmed, po_validated, grn_validated, risk_score, cascade_group) VALUES
('PL-2025-C01', 'pl2025c01fp0000000000000000000000000000000000000000000000000001', 12, 8, 18, 'tier_2', 280000, '2025-06-03', '2025-08-03', 'pending', 'PO-QS-C001', NULL, false, false, false, 72, 'CASCADE-001'),
('PL-2025-C02', 'pl2025c02fp0000000000000000000000000000000000000000000000000002', 12, 8, 19, 'tier_2', 320000, '2025-06-07', '2025-08-07', 'pending', NULL, NULL, false, false, false, 76, 'CASCADE-001'),
('ST-2025-C01', 'st2025c01fp0000000000000000000000000000000000000000000000000001', 13, 8, 18, 'tier_2', 410000, '2025-06-05', '2025-08-05', 'pending', NULL, NULL, false, false, false, 85, 'CASCADE-002'),
('MW-2025-C01', 'mw2025c01fp0000000000000000000000000000000000000000000000000001', 16, 12, 18, 'tier_3', 145000, '2025-06-08', '2025-08-08', 'pending', NULL, NULL, false, false, false, 68, 'CASCADE-001'),
('SC-2025-C01', 'sc2025c01fp0000000000000000000000000000000000000000000000000001', 17, 13, 19, 'tier_3', 380000, '2025-06-10', '2025-08-10', 'pending', NULL, NULL, false, false, false, 90, 'CASCADE-002');

-- ▸ CAROUSEL TRADE invoices (ShadowTrade → ShellCo → QuickSupply → ShadowTrade)
INSERT INTO invoices (invoice_number, fingerprint, supplier_id, buyer_id, lender_id, tier, amount, invoice_date, due_date, status, po_number, grn_number, delivery_confirmed, po_validated, grn_validated, risk_score) VALUES
('ST-2025-CT1', 'st2025ct1fp0000000000000000000000000000000000000000000000000001', 13, 12, 18, 'tier_2', 350000, '2025-05-01', '2025-07-01', 'pending', NULL, NULL, false, false, false, 88),
('SC-2025-CT1', 'sc2025ct1fp0000000000000000000000000000000000000000000000000001', 17, 13, 19, 'tier_3', 340000, '2025-05-05', '2025-07-05', 'pending', NULL, NULL, false, false, false, 90),
('QS-2025-CT1', 'qs2025ct1fp0000000000000000000000000000000000000000000000000001', 8, 17, 18, 'tier_1', 360000, '2025-05-10', '2025-07-10', 'pending', NULL, NULL, false, false, false, 85);


-- ── CASH COLLECTIONS (for dilution detection) ──────────────────────

INSERT INTO cash_collections (invoice_id, expected_amount, collected_amount, collection_date, dilution_ratio) VALUES
-- Normal collections
(1, 285000, 285000, '2025-03-15', 0.00),
(2, 310000, 306000, '2025-04-10', 0.013),
(6, 480000, 472000, '2025-03-20', 0.017),
(7, 520000, 515000, '2025-04-25', 0.010),
(10, 420000, 418000, '2025-03-10', 0.005),

-- Dilution cases from QuickSupply
(13, 360000, 345000, '2025-03-25', 0.042),
(15, 175000, 170000, '2025-03-20', 0.029),

-- Suspicious dilution
(3, 265000, 185000, '2025-05-05', 0.302),   -- 30% dilution!
(14, 345000, 180000, '2025-04-28', 0.478),  -- 48% dilution!
(16, 160000, 88000, '2025-03-28', 0.450);   -- 45% dilution!


-- ── ALERTS ─────────────────────────────────────────────────────────

INSERT INTO alerts (title, description, severity, status, fraud_type, related_invoice_ids, related_entity_ids, total_exposure, created_at) VALUES
('Phantom Invoice Cluster Detected',
 'QuickSupply Corp (Entity 8) submitted 5 invoices totaling $2.46M in a 10-day window with no PO/GRN documentation. This matches the phantom invoice typology from the Tier 1 fabrication case.',
 'critical', 'open', 'phantom_invoice', '21,22,23,24,25', '8,1,2', 2455000, '2025-06-11 10:30:00'),

('Duplicate Financing Alert',
 'Invoice PP-2025-003 (ID: 3) has been submitted to both Capital Finance Bank and EuroTrade Credit under different invoice numbers. Total double-financed amount: $530K.',
 'critical', 'open', 'duplicate_financing', '3,26', '4,18,19', 530000, '2025-06-11 10:35:00'),

('Cross-Tier Cascade Warning',
 'CASCADE-001 group shows suspicious multi-tier financing: 3 Tier 1 invoices ($1.47M) → 2 Tier 2 ($600K) → 1 Tier 3 ($145K). Total exposure: $2.21M. Pattern consistent with cascading phantom invoices.',
 'critical', 'open', 'cascade_fraud', '21,22,25,28,29,31', '8,12,16', 2210000, '2025-06-11 11:00:00'),

('Carousel Trade Cycle Identified',
 'Circular trading pattern detected: ShadowTrade LLC → ShellCo Enterprises → QuickSupply Corp → ShadowTrade LLC. Total carousel volume: $1.05M across 3 invoices with no delivery confirmations.',
 'critical', 'open', 'carousel_trade', '34,35,36', '8,13,17', 1050000, '2025-06-11 11:15:00'),

('Severe Dilution – PharmaSynth Co',
 'Cash collection for PharmaSynth (Invoice PS-2025-002) shows 47.8% dilution: expected $345K, collected only $180K. Combined with ChemBase dilution (45%), this supplier chain shows systemic collection failure.',
 'high', 'investigating', 'dilution', '14,16', '7,11', 252000, '2025-06-11 11:30:00'),

('Over-Invoicing Alert – SteelForge GmbH',
 'Invoice SF-2025-OI1 for $1.85M is 4.4x the historical average of $418K for the SteelForge-AutoNova trading pair. Significantly exceeds normal range.',
 'high', 'open', 'over_invoicing', '28', '6,2', 1850000, '2025-06-11 11:45:00'),

('Velocity Anomaly – QuickSupply Corp',
 'QuickSupply submitted 5 invoices in 10 days totaling $2.46M, compared to a historical average of 2 invoices per month averaging $242K. Invoice velocity is 7.5x normal.',
 'high', 'open', 'velocity_anomaly', '21,22,23,24,25', '8', 2455000, '2025-06-11 12:00:00'),

('Relationship Gap – ShellCo Enterprises',
 'ShellCo (BVI-registered, Tier 3) has $3.8M in supply volume with ShadowTrade but only $1.2M annual revenue. Revenue-to-invoice ratio suggests shell entity facilitating fraud.',
 'medium', 'open', 'phantom_invoice', '35,33', '17', 3800000, '2025-06-11 12:15:00');


-- ── FRAUD FLAGS ────────────────────────────────────────────────────

-- Phantom invoice flags for QuickSupply invoices
INSERT INTO fraud_flags (invoice_id, fraud_type, confidence, severity, description, engine, detected_at) VALUES
(21, 'phantom_invoice', 0.92, 'critical', 'No PO or GRN documentation. Invoice submitted with no supply chain evidence. Amount $450K exceeds 0.47% of supplier revenue ($95M).', 'invoice_validator', '2025-06-11 10:30:00'),
(22, 'phantom_invoice', 0.94, 'critical', 'No PO or GRN documentation. Same-day submission as QS-2025-P01. Combined same-day volume: $970K.', 'invoice_validator', '2025-06-11 10:30:00'),
(23, 'phantom_invoice', 0.88, 'high', 'Fake PO reference PO-FAKE-001 does not match any ERP records. No GRN. No delivery confirmation.', 'invoice_validator', '2025-06-11 10:31:00'),
(24, 'phantom_invoice', 0.95, 'critical', 'No documentation. Single invoice $610K is 0.64% of supplier annual revenue. Highest risk phantom detected.', 'invoice_validator', '2025-06-11 10:31:00'),
(25, 'phantom_invoice', 0.90, 'critical', 'No PO or GRN. Third phantom invoice in 10-day cluster from QuickSupply to GlobalTech.', 'invoice_validator', '2025-06-11 10:32:00'),

-- Duplicate financing flags
(26, 'duplicate_financing', 0.97, 'critical', 'Fingerprint matches Invoice #3 (PP-2025-003). Original financed by Capital Finance Bank, duplicate submitted to EuroTrade Credit. Total exposure: $530K.', 'duplicate_detector', '2025-06-11 10:35:00'),
(3,  'duplicate_financing', 0.97, 'critical', 'Fingerprint matches Invoice #26 (PP-2025-003-DUP). Cross-lender duplicate financing detected.', 'duplicate_detector', '2025-06-11 10:35:00'),
(27, 'duplicate_financing', 0.95, 'critical', 'Fingerprint matches Invoice #7 (CM-2025-002). Original financed by EuroTrade Credit, duplicate submitted to Pacific SCF Fund. Total exposure: $1.04M.', 'duplicate_detector', '2025-06-11 10:36:00'),

-- Over-invoicing flags
(28, 'over_invoicing', 0.82, 'high', 'Invoice amount $1.85M is 4.4x the historical average of $418K for SteelForge-AutoNova trading pair.', 'over_invoice_detector', '2025-06-11 11:45:00'),
(29, 'over_invoicing', 0.78, 'high', 'Invoice amount $890K is 5.6x the historical average of $160K for ChemBase-PharmaSynth trading pair.', 'over_invoice_detector', '2025-06-11 11:46:00'),

-- Velocity anomaly flags
(21, 'velocity_anomaly', 0.85, 'high', 'Rapid sequential invoices: QS-2025-P01 and QS-2025-P02 submitted on same day. Combined: $970K.', 'velocity_detector', '2025-06-11 12:00:00'),
(22, 'velocity_anomaly', 0.85, 'high', 'Same-day invoice pair with QS-2025-P01. Invoice velocity 7.5x normal for this supplier.', 'velocity_detector', '2025-06-11 12:00:00'),
(25, 'velocity_anomaly', 0.80, 'high', 'Invoice volume spike: recent avg $488K is 3.1x historical avg $158K for QuickSupply.', 'velocity_spike_detector', '2025-06-11 12:01:00'),

-- Cascade fraud flags
(21, 'cascade_fraud', 0.88, 'critical', 'Cross-tier cascade CASCADE-001: 6 invoices across 3 tiers. Total exposure $2.21M is 4.9x root amount.', 'cascade_detector', '2025-06-11 11:00:00'),
(22, 'cascade_fraud', 0.88, 'critical', 'Part of CASCADE-001 cascade group. Tier 1 root invoice contributing to multi-tier financing multiplication.', 'cascade_detector', '2025-06-11 11:00:00'),
(30, 'cascade_fraud', 0.85, 'critical', 'CASCADE-001 Tier 2 cascade. PackLogis financing derived from phantom Tier 1 QuickSupply invoices.', 'cascade_detector', '2025-06-11 11:01:00'),
(31, 'cascade_fraud', 0.85, 'critical', 'CASCADE-001 Tier 2 cascade. Second PackLogis invoice in cascade group, different lender.', 'cascade_detector', '2025-06-11 11:01:00'),
(33, 'cascade_fraud', 0.82, 'high', 'CASCADE-001 Tier 3 cascade. MicroWeld invoice derived from phantom cascade chain.', 'cascade_detector', '2025-06-11 11:02:00'),

-- Carousel trade flags
(34, 'carousel_trade', 0.91, 'critical', 'Circular trade: ShadowTrade → PackLogis → ShadowTrade (via ShellCo/QuickSupply). Total carousel: $1.05M.', 'graph_analytics', '2025-06-11 11:15:00'),
(35, 'carousel_trade', 0.93, 'critical', 'ShellCo (BVI shell entity) carousel node. Revenue $1.2M but facilitating $3.8M in trades.', 'graph_analytics', '2025-06-11 11:15:00'),
(36, 'carousel_trade', 0.89, 'critical', 'QuickSupply carousel return leg. Completes circular trading cycle back to ShadowTrade.', 'graph_analytics', '2025-06-11 11:16:00'),

-- Dilution flags
(3,  'dilution', 0.80, 'high', 'Dilution 30.2%: expected $265K, collected $185K. Shortfall $80K.', 'dilution_monitor', '2025-06-11 11:30:00'),
(14, 'dilution', 0.95, 'critical', 'Dilution 47.8%: expected $345K, collected $180K. Shortfall $165K. Severe collection failure.', 'dilution_monitor', '2025-06-11 11:30:00'),
(16, 'dilution', 0.93, 'critical', 'Dilution 45.0%: expected $160K, collected $88K. Shortfall $72K. Supplier chain shows systemic dilution.', 'dilution_monitor', '2025-06-11 11:31:00');
