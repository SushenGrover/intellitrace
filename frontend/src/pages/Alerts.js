import React, { useState, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  XCircle,
} from "lucide-react";
import { alertAPI } from "../api";

const FRAUD_LABELS = {
  phantom_invoice: "Phantom Invoice",
  duplicate_financing: "Duplicate Financing",
  over_invoicing: "Over-Invoicing",
  carousel_trade: "Carousel Trade",
  dilution: "Dilution",
  velocity_anomaly: "Velocity Anomaly",
  cascade_fraud: "Cascade Fraud",
};

const SEVERITY_ICONS = {
  critical: <AlertTriangle size={16} style={{ color: "var(--accent-red)" }} />,
  high: <AlertTriangle size={16} style={{ color: "var(--accent-orange)" }} />,
  medium: <Clock size={16} style={{ color: "var(--accent-yellow)" }} />,
  low: <CheckCircle size={16} style={{ color: "var(--accent-green)" }} />,
};

const formatMoney = (val) => {
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${val}`;
};

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    Promise.all([alertAPI.list(), alertAPI.summary()])
      .then(([alertRes, sumRes]) => {
        setAlerts(alertRes.data);
        setSummary(sumRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateStatus = (id, status) => {
    alertAPI.updateStatus(id, status).then(() => {
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Loading alerts...</span>
      </div>
    );
  }

  const filtered =
    filter === "all"
      ? alerts
      : alerts.filter((a) => a.severity === filter || a.status === filter);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Alert Center</h2>
          <p>Pre-disbursement early warning system</p>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon">
              <Bell size={22} />
            </div>
            <div className="stat-value">{summary.total_alerts}</div>
            <div className="stat-label">Total Alerts</div>
          </div>
          <div className="stat-card red">
            <div className="stat-icon">
              <AlertTriangle size={22} />
            </div>
            <div className="stat-value">{summary.critical_alerts}</div>
            <div className="stat-label">Critical Open</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon">
              <Eye size={22} />
            </div>
            <div className="stat-value">{summary.open_alerts}</div>
            <div className="stat-label">Open Alerts</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon">
              <CheckCircle size={22} />
            </div>
            <div className="stat-value">
              {formatMoney(summary.total_exposure)}
            </div>
            <div className="stat-label">Total Exposure</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        {[
          "all",
          "critical",
          "high",
          "medium",
          "open",
          "investigating",
          "resolved",
        ].map((f) => (
          <button
            key={f}
            className={`filter-chip ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Alert Cards */}
      {filtered.map((alert) => (
        <div
          key={alert.id}
          className={`alert-card severity-${alert.severity}`}
          onClick={() => setExpanded(expanded === alert.id ? null : alert.id)}
        >
          <div className="alert-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {SEVERITY_ICONS[alert.severity]}
              <span className="alert-title">{alert.title}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span className={`badge ${alert.severity}`}>
                {alert.severity}
              </span>
              <span className={`badge ${alert.status}`}>{alert.status}</span>
            </div>
          </div>

          {expanded === alert.id && (
            <div style={{ marginTop: 12 }}>
              <p className="alert-description">{alert.description}</p>

              <div className="alert-meta">
                {alert.fraud_type && (
                  <span>
                    <span className={`badge ${alert.fraud_type}`}>
                      {FRAUD_LABELS[alert.fraud_type] || alert.fraud_type}
                    </span>
                  </span>
                )}
                <span>
                  Exposure: <strong>{formatMoney(alert.total_exposure)}</strong>
                </span>
                {alert.related_invoice_ids && (
                  <span>Invoices: {alert.related_invoice_ids}</span>
                )}
                <span>{new Date(alert.created_at).toLocaleString()}</span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                {alert.status === "open" && (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: 12, padding: "6px 14px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus(alert.id, "investigating");
                    }}
                  >
                    <Eye size={14} /> Investigate
                  </button>
                )}
                {alert.status === "investigating" && (
                  <button
                    className="btn btn-primary"
                    style={{
                      fontSize: 12,
                      padding: "6px 14px",
                      background: "var(--accent-green)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus(alert.id, "resolved");
                    }}
                  >
                    <CheckCircle size={14} /> Resolve
                  </button>
                )}
                {alert.status !== "dismissed" &&
                  alert.status !== "resolved" && (
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: "6px 14px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(alert.id, "dismissed");
                      }}
                    >
                      <XCircle size={14} /> Dismiss
                    </button>
                  )}
              </div>
            </div>
          )}

          {expanded !== alert.id && (
            <div className="alert-meta" style={{ marginTop: 8 }}>
              {alert.fraud_type && (
                <span className={`badge ${alert.fraud_type}`}>
                  {FRAUD_LABELS[alert.fraud_type] || alert.fraud_type}
                </span>
              )}
              <span>
                Exposure: <strong>{formatMoney(alert.total_exposure)}</strong>
              </span>
              <span>{new Date(alert.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Alerts;
