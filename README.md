<div align="center">

# IntelliTrace Hackthon Porject

### Multi-Tier Supply Chain Fraud Detection & Real-Time Early Warning System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)](https://docker.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)](https://python.org)

_Detecting phantom invoices, duplicate financing, carousel trades, and cascade fraud across multi-tier supply chain finance networks before disbursement._

</div>

---

## Quick Start

```bash
docker-compose up --build
```

That's it. Open **http://localhost:3000** and explore.

| Service  | URL                        |
| -------- | -------------------------- |
| Frontend | http://localhost:3000      |
| Backend  | http://localhost:8000      |
| API Docs | http://localhost:8000/docs |
| Database | localhost:5432             |

---

## Screenshots

### Dashboard Overview

<!-- Screenshot: Full dashboard page showing all KPI cards, charts, and metrics at http://localhost:3000 (Dashboard tab) -->

![Dashboard Overview](screenshots/dashboard-overview.png)
_The main dashboard displays real-time KPIs—total invoices, flagged count, fraud exposure ($12.3M), average risk score—alongside monthly trend charts, fraud distribution by type (donut chart), risk score distribution, and tier-level breakdown._

### Dashboard KPI Cards

<!-- Screenshot: Close-up of the top 4 KPI stat cards (Total Invoices, Flagged Invoices, Fraud Flags, Critical Alerts) -->

![Dashboard KPIs](screenshots/dashboard-kpis.png)
_Four key metric cards providing at-a-glance situational awareness: total processed invoices, flagged suspicious invoices, active fraud flags across all engines, and unresolved critical alerts._

### Fraud Distribution Chart

<!-- Screenshot: The donut/pie chart showing fraud breakdown by type (phantom_invoice, duplicate_financing, etc.) -->

![Fraud Distribution](screenshots/fraud-distribution.png)
_Donut chart breaking down detected fraud flags by typology—phantom invoices, duplicate financing, over-invoicing, carousel trades, dilution, velocity anomalies, and cascade fraud._

### Monthly Trend Chart

<!-- Screenshot: The bar/line chart showing monthly invoice volume and flagged invoice trend -->

![Monthly Trend](screenshots/monthly-trend.png)
_Monthly invoice submission trend with flagged invoice overlay, revealing temporal patterns and sudden spikes in suspicious activity._

### Invoice Management

<!-- Screenshot: Full Invoices page showing the sortable/filterable invoice table at http://localhost:3000 (Invoices tab) -->

![Invoice List](screenshots/invoice-list.png)
_Comprehensive invoice table with columns for invoice number, supplier, buyer, amount, tier, risk score, and status. Supports sorting, filtering by status/tier, and search._

### Invoice Detail Modal

<!-- Screenshot: Click on any invoice row to open the detail modal showing PO/GRN/Delivery validation and fraud flags -->

![Invoice Detail](screenshots/invoice-detail.png)
_Expanded invoice view showing ERP validation status (PO ✓, GRN ✓, Delivery ✓), associated fraud flags with confidence scores, and full invoice metadata._

### Fraud Detection Center

<!-- Screenshot: Full Fraud Detection page with the "Run Full Scan" button, exposure chart, and flags table at http://localhost:3000 (Fraud Detection tab) -->

![Fraud Detection](screenshots/fraud-detection.png)
_The fraud detection center with one-click system scan across all 6 engines, exposure breakdown by fraud type (bar chart), threat profile radar, and detailed flag table._

### Fraud Scan Results

<!-- Screenshot: After clicking "Run Full Scan"—show the scan results with newly detected flags, confidence meters, and exposure amounts -->

![Scan Results](screenshots/scan-results.png)
_Post-scan results showing newly detected fraud flags with per-flag confidence meters, severity badges, engine attribution, and total exposure calculation._

### Fraud Exposure Breakdown

<!-- Screenshot: The bar chart showing total dollar exposure grouped by fraud type (phantom_invoice, carousel_trade, etc.) -->

![Exposure Breakdown](screenshots/exposure-breakdown.png)
_Bar chart quantifying financial exposure by fraud typology—identifying which fraud types carry the highest monetary risk across the supply chain._

### Supply Chain Network Graph

<!-- Screenshot: Full Network Graph page showing the SVG topology visualization at http://localhost:3000 (Network Graph tab) -->

![Network Graph](screenshots/network-graph.png)
_Interactive SVG network topology of the entire supply chain. Nodes are color-coded by entity type (buyer/supplier/lender) and tier level, with risk-score labels and glow effects on high-risk entities._

### Carousel Trade Detection

<!-- Screenshot: Close-up of the network graph highlighting carousel trade cycles (dashed red edges forming a loop) -->

![Carousel Detection](screenshots/carousel-detection.png)
_Carousel trade cycles highlighted with dashed red edges—circular invoice chains like ShadowTrade → ShellCo → QuickSupply → ShadowTrade used to repeatedly finance the same goods._

### Network Risk Rankings

<!-- Screenshot: The high-risk entity ranking panel/table beside the network graph -->

![Risk Rankings](screenshots/risk-rankings.png)
_Entity risk ranking table computed via PageRank and betweenness centrality from the NetworkX graph engine, identifying the most structurally suspicious nodes in the supply chain._

### Alert Center

<!-- Screenshot: Full Alerts page showing severity-grouped alert cards at http://localhost:3000 (Alerts tab) -->

![Alert Center](screenshots/alert-center.png)
_Pre-disbursement early warning alerts organized by severity (critical → high → medium → low). Each card shows the alert title, fraud type, affected entities, and total exposure._

### Alert Detail Expanded

<!-- Screenshot: Click to expand any alert card to reveal the full description, related invoice IDs, and status management buttons -->

![Alert Detail](screenshots/alert-detail.png)
_Expanded alert showing full investigation description, related invoice and entity IDs, exposure amount, and status workflow buttons (Open → Investigating → Resolved/Dismissed)._

### API Documentation

<!-- Screenshot: FastAPI auto-generated Swagger docs at http://localhost:8000/docs showing all endpoints -->

![API Docs](screenshots/api-docs.png)
_Auto-generated interactive API documentation via FastAPI/Swagger UI at `/docs`, covering all 14 REST endpoints and the WebSocket alert stream._

### Docker Services Running

<!-- Screenshot: Terminal output of `docker-compose up --build` showing all 4 services healthy, or Docker Desktop showing the containers -->

![Docker Services](screenshots/docker-services.png)
_All four services (PostgreSQL, Redis, FastAPI backend, React frontend) running via a single `docker-compose up --build` command with health checks._

> **Note:** To add your own screenshots, create a `screenshots/` folder in the project root and save images with the filenames referenced above. Recommended resolution: **1920×1080** or higher.

---

## Problem Statement

In multi-tier supply chain finance (Tier 1 → Tier 2 → Tier 3), a Tier 1 supplier fabricated **340 phantom invoices (~$47M)**. Each invoice appeared legitimate individually, but cross-tier cascading triggered repeated financing, multiplying exposure. Traditional invoice checks failed because the fraud becomes visible only through **network-level correlation**.

### Fraud Typologies Covered

| #   | Typology                | Detection Approach                                                           |
| --- | ----------------------- | ---------------------------------------------------------------------------- |
| 1   | **Phantom Invoices**    | PO/GRN/delivery validation + feasibility metrics (revenue vs invoice volume) |
| 2   | **Duplicate Financing** | SHA-256 invoice fingerprinting across lenders                                |
| 3   | **Over-Invoicing**      | Statistical anomaly detection against historical trading pair averages       |
| 4   | **Carousel Trades**     | Graph cycle detection using NetworkX                                         |
| 5   | **Dilution Fraud**      | Cash collection monitoring (expected vs actual)                              |
| 6   | **Velocity Anomalies**  | Submission rate analysis per supplier per tier                               |
| 7   | **Cascade Fraud**       | Cross-tier cascade group correlation                                         |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    IntelliTrace Platform                      │
├──────────────┬──────────────┬───────────────┬───────────────┤
│   Frontend   │   Backend    │   Database    │    Cache      │
│   React 18   │  FastAPI     │  PostgreSQL   │    Redis      │
│   Recharts   │  SQLAlchemy  │  16-Alpine    │   7-Alpine    │
│   Lucide     │  NetworkX    │              │               │
│   Port 3000  │  Port 8000   │  Port 5432   │  Port 6379    │
└──────┬───────┴──────┬───────┴──────┬────────┴───────────────┘
       │              │              │
       │    REST API  │   Async DB   │
       └──────────────┘──────────────┘
```

### Detection Engine Pipeline

```
Invoice Submitted
       │
       ▼
┌──────────────────┐
│ Invoice Validator │──→ PO/GRN/Delivery checks
│                  │──→ Feasibility metrics
│                  │──→ Over-invoicing detection
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│Duplicate Detector│──→ SHA-256 fingerprint matching
│                  │──→ Cross-lender duplicate check
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│Velocity Detector │──→ Submission rate anomalies
│                  │──→ Same-day rapid submission
│                  │──→ Volume spike detection
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│Cascade Detector  │──→ Cross-tier group correlation
│                  │──→ Amount multiplication check
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│Dilution Monitor  │──→ Cash collection tracking
│                  │──→ Dilution ratio analysis
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Graph Analytics  │──→ Carousel cycle detection
│   (NetworkX)     │──→ Community detection
│                  │──→ PageRank risk scoring
│                  │──→ Betweenness centrality
└────────┬─────────┘
         │
         ▼
   Pre-Disbursement
   Early Warning!!
```

---

## Dashboard Features

### 1. Fraud Detection Dashboard

- Real-time KPIs: total invoices, flagged count, fraud exposure, risk score
- Monthly invoice & fraud trend charts
- Fraud distribution by type (donut chart)
- Risk score distribution across all invoices
- Tier-level breakdown

### 2. Invoice Management

- Full invoice listing with sort/filter/search
- Invoice detail modal with validation status (PO ✓, GRN ✓, Delivery ✓)
- Fraud flag cards per invoice with confidence scores
- Filter by status, tier, risk level

### 3. Fraud Detection Center

- One-click full system scan across all 6 engines
- Exposure breakdown by fraud type (bar chart)
- Threat profile radar chart
- Detailed fraud flag table with confidence meters
- Filter by fraud typology

### 4. Supply Chain Network

- Interactive SVG network topology visualization
- Color-coded nodes by entity type and tier
- Risk-score labels on nodes with glow indicators
- Carousel trade cycle highlighting (dashed red edges)
- Community detection clusters
- High-risk entity ranking

### 5. Alert Center

- Pre-disbursement early warning alerts
- Severity-based card layout (critical/high/medium/low)
- Expandable alert details with full descriptions
- Status management (Open → Investigating → Resolved)
- Real-time WebSocket alert streaming

---

## Seed Data Scenario

The system comes pre-loaded with a realistic fraud scenario:

**20 entities** across 3 tiers, 3 buyers, and 3 lenders, with **36 invoices** containing:

- **5 phantom invoices** from QuickSupply Corp ($2.46M) – no PO/GRN documentation
- **2 duplicate financing** cases – same invoices submitted to different lenders ($1.57M)
- **2 over-invoicing** cases – amounts 4-5x historical averages
- **3 carousel trade** invoices – circular: ShadowTrade → ShellCo → QuickSupply → ShadowTrade ($1.05M)
- **5 cascade fraud** invoices – Tier 1 phantoms triggering Tier 2/3 financing ($2.21M)
- **3 dilution** cases – 30-48% collection shortfalls
- **8 pre-built alerts** with full descriptions

**Total detected fraud exposure: ~$12.3M**

---

## Tech Stack

| Layer        | Technology                  | Purpose                                              |
| ------------ | --------------------------- | ---------------------------------------------------- |
| Frontend     | React 18, Recharts, Lucide  | Interactive dashboard & visualization                |
| Backend      | FastAPI, SQLAlchemy (async) | REST API, fraud detection pipeline                   |
| Graph Engine | NetworkX                    | Carousel detection, community analysis, risk scoring |
| Database     | PostgreSQL 16               | Persistent storage, full-text search                 |
| Cache        | Redis 7                     | Real-time pub/sub, session caching                   |
| Container    | Docker Compose              | One-command deployment                               |

---

## Project Structure

```
intellitrace/
├── docker-compose.yml          # One-command orchestration
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI app entry point
│       ├── database.py         # Async SQLAlchemy config
│       ├── models.py           # ORM models (Invoice, Entity, FraudFlag, Alert)
│       ├── schemas.py          # Pydantic request/response schemas
│       ├── websocket.py        # Real-time WebSocket alerts
│       ├── seed_runner.py      # Initial data bootstrap
│       ├── engines/
│       │   ├── invoice_validator.py   # PO/GRN/feasibility checks
│       │   ├── duplicate_detector.py  # Fingerprint-based dedup
│       │   ├── velocity_detector.py   # Submission rate anomalies
│       │   ├── cascade_detector.py    # Cross-tier cascade correlation
│       │   ├── dilution_monitor.py    # Cash collection monitoring
│       │   └── graph_analytics.py     # NetworkX graph analysis
│       └── routes/
│           ├── dashboard.py    # Aggregated stats & metrics
│           ├── invoices.py     # Invoice CRUD & validation
│           ├── fraud.py        # Fraud scanning & flags
│           ├── analytics.py    # Graph network & risk scores
│           └── alerts.py       # Alert management
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── public/index.html
│   └── src/
│       ├── index.js
│       ├── index.css           # Dark theme styling
│       ├── App.js              # Main app with sidebar navigation
│       ├── api.js              # Axios API client
│       └── pages/
│           ├── Dashboard.js    # KPI cards + charts
│           ├── Invoices.js     # Invoice table + detail modal
│           ├── FraudDetection.js  # Scan engine + flags
│           ├── NetworkView.js  # SVG network topology
│           └── Alerts.js       # Alert management
└── db/
    ├── init.sql                # Schema creation
    └── seed.sql                # Realistic fraud scenario data
```

---

## API Endpoints

| Method | Endpoint                     | Description                            |
| ------ | ---------------------------- | -------------------------------------- |
| GET    | `/api/health`                | Health check                           |
| GET    | `/api/dashboard/stats`       | Full dashboard statistics              |
| GET    | `/api/invoices/`             | List invoices (with filters)           |
| POST   | `/api/invoices/`             | Create invoice + real-time fraud check |
| GET    | `/api/invoices/{id}`         | Invoice detail with flags              |
| POST   | `/api/fraud/scan`            | Run full fraud detection scan          |
| GET    | `/api/fraud/flags`           | List all fraud flags                   |
| GET    | `/api/fraud/exposure`        | Total exposure by fraud type           |
| GET    | `/api/analytics/network`     | Full supply chain network graph        |
| GET    | `/api/analytics/entities`    | Entity list with risk scores           |
| POST   | `/api/analytics/risk-scores` | Recompute graph-based risk scores      |
| GET    | `/api/alerts/`               | List alerts                            |
| PATCH  | `/api/alerts/{id}/status`    | Update alert status                    |
| WS     | `/ws/alerts`                 | Real-time alert streaming              |

---

## Key Differentiators

1. **Network-Level Detection** – Not just individual invoice checks, but graph-level pattern recognition
2. **6 Specialized Engines** – Each fraud typology has a dedicated detection engine
3. **Pre-Disbursement Warnings** – Alerts fire before money leaves the system
4. **Cross-Tier Correlation** – Cascade detection across supply chain tiers
5. **Real-Time Processing** – WebSocket-powered live alert streaming
6. **One-Command Deploy** – `docker-compose up --build` and it works

---

<div align="center">

**Built for IntelliTrace Hackathon by Team Secret Weapon** 🏆

</div>
