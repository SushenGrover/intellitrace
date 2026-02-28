import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { invoiceAPI } from "../api";

const FRAUD_LABELS = {
  phantom_invoice: "Phantom Invoice",
  duplicate_financing: "Duplicate Financing",
  over_invoicing: "Over-Invoicing",
  carousel_trade: "Carousel Trade",
  dilution: "Dilution",
  velocity_anomaly: "Velocity Anomaly",
  cascade_fraud: "Cascade Fraud",
};

const formatMoney = (val) => `$${val.toLocaleString()}`;

const getRiskClass = (score) => {
  if (score >= 75) return "risk-critical";
  if (score >= 50) return "risk-high";
  if (score >= 20) return "risk-medium";
  return "risk-low";
};

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    const params = {};
    if (filter !== "all") {
      if (
        ["pending", "validated", "flagged", "financed", "rejected"].includes(
          filter,
        )
      ) {
        params.status = filter;
      } else if (["tier_1", "tier_2", "tier_3"].includes(filter)) {
        params.tier = filter;
      } else if (filter === "high_risk") {
        params.min_risk = 50;
      }
    }
    invoiceAPI
      .list(params)
      .then((res) => {
        setInvoices(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  const filtered = invoices.filter(
    (inv) =>
      search === "" ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.supplier_name &&
        inv.supplier_name.toLowerCase().includes(search.toLowerCase())) ||
      (inv.buyer_name &&
        inv.buyer_name.toLowerCase().includes(search.toLowerCase())),
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Loading invoices...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Invoice Management</h2>
          <p>Monitor and validate supply chain invoices across all tiers</p>
        </div>
        <div className="search-bar">
          <Search size={16} style={{ color: "var(--text-muted)" }} />
          <input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        {[
          "all",
          "pending",
          "flagged",
          "validated",
          "financed",
          "high_risk",
          "tier_1",
          "tier_2",
          "tier_3",
        ].map((f) => (
          <button
            key={f}
            className={`filter-chip ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all"
              ? "All"
              : f === "high_risk"
                ? "High Risk"
                : f
                    .replace("tier_", "Tier ")
                    .replace(/^\w/, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: 700,
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <h3>Invoice #{selectedInvoice.invoice_number}</h3>
              <span className={`badge ${selectedInvoice.status}`}>
                {selectedInvoice.status}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Supplier
                </div>
                <div style={{ fontWeight: 600 }}>
                  {selectedInvoice.supplier_name ||
                    `ID: ${selectedInvoice.supplier_id}`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Buyer
                </div>
                <div style={{ fontWeight: 600 }}>
                  {selectedInvoice.buyer_name ||
                    `ID: ${selectedInvoice.buyer_id}`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Amount
                </div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  {formatMoney(selectedInvoice.amount)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Risk Score
                </div>
                <div
                  className={`risk-score ${getRiskClass(selectedInvoice.risk_score)}`}
                >
                  <div className="risk-dot" />
                  {selectedInvoice.risk_score}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Tier
                </div>
                <div>{selectedInvoice.tier?.replace("tier_", "Tier ")}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Date
                </div>
                <div>{selectedInvoice.invoice_date}</div>
              </div>
            </div>

            {/* Validation Status */}
            <div style={{ marginBottom: 20 }}>
              <h4
                style={{
                  fontSize: 13,
                  marginBottom: 10,
                  color: "var(--text-secondary)",
                }}
              >
                VALIDATION STATUS
              </h4>
              <div style={{ display: "flex", gap: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                  }}
                >
                  {selectedInvoice.po_validated ? (
                    <CheckCircle
                      size={16}
                      style={{ color: "var(--accent-green)" }}
                    />
                  ) : (
                    <XCircle size={16} style={{ color: "var(--accent-red)" }} />
                  )}
                  PO: {selectedInvoice.po_number || "N/A"}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                  }}
                >
                  {selectedInvoice.grn_validated ? (
                    <CheckCircle
                      size={16}
                      style={{ color: "var(--accent-green)" }}
                    />
                  ) : (
                    <XCircle size={16} style={{ color: "var(--accent-red)" }} />
                  )}
                  GRN: {selectedInvoice.grn_number || "N/A"}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                  }}
                >
                  {selectedInvoice.delivery_confirmed ? (
                    <CheckCircle
                      size={16}
                      style={{ color: "var(--accent-green)" }}
                    />
                  ) : (
                    <XCircle size={16} style={{ color: "var(--accent-red)" }} />
                  )}
                  Delivery
                </div>
              </div>
            </div>

            {/* Fraud Flags */}
            {selectedInvoice.fraud_flags &&
              selectedInvoice.fraud_flags.length > 0 && (
                <div>
                  <h4
                    style={{
                      fontSize: 13,
                      marginBottom: 10,
                      color: "var(--accent-red)",
                    }}
                  >
                    <AlertTriangle size={14} style={{ marginRight: 4 }} />
                    FRAUD FLAGS ({selectedInvoice.fraud_flags.length})
                  </h4>
                  {selectedInvoice.fraud_flags.map((flag, i) => (
                    <div
                      key={i}
                      style={{
                        background: "rgba(239,68,68,0.05)",
                        border: "1px solid rgba(239,68,68,0.15)",
                        borderRadius: 8,
                        padding: "12px 16px",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <span className={`badge ${flag.fraud_type}`}>
                          {FRAUD_LABELS[flag.fraud_type] || flag.fraud_type}
                        </span>
                        <span className={`badge ${flag.severity}`}>
                          {flag.severity}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "var(--text-secondary)",
                          lineHeight: 1.5,
                        }}
                      >
                        {flag.description}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginTop: 6,
                        }}
                      >
                        Confidence: {(flag.confidence * 100).toFixed(0)}% ·
                        Engine: {flag.engine}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3>{filtered.length} Invoices</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Supplier</th>
                <th>Buyer</th>
                <th>Tier</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Flags</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  style={{ cursor: "pointer" }}
                >
                  <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                    {inv.invoice_number}
                  </td>
                  <td>{inv.supplier_name || `#${inv.supplier_id}`}</td>
                  <td>{inv.buyer_name || `#${inv.buyer_id}`}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: "rgba(59,130,246,0.15)",
                        color: "var(--accent-blue)",
                      }}
                    >
                      {inv.tier?.replace("tier_", "T")}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatMoney(inv.amount)}</td>
                  <td>
                    <span className={`badge ${inv.status}`}>{inv.status}</span>
                  </td>
                  <td>
                    <span
                      className={`risk-score ${getRiskClass(inv.risk_score)}`}
                    >
                      <span className="risk-dot" />
                      {inv.risk_score}
                    </span>
                  </td>
                  <td>
                    {inv.fraud_flags && inv.fraud_flags.length > 0 ? (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          color: "var(--accent-red)",
                        }}
                      >
                        <AlertTriangle size={14} /> {inv.fraud_flags.length}
                      </span>
                    ) : (
                      <span style={{ color: "var(--accent-green)" }}>
                        <CheckCircle size={14} />
                      </span>
                    )}
                  </td>
                  <td>{inv.invoice_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Invoices;
