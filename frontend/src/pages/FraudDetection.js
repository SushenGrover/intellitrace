import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";
import {
  Scan,
  AlertTriangle,
  DollarSign,
  Shield,
  Zap,
  Loader,
} from "lucide-react";
import { fraudAPI } from "../api";

const FRAUD_LABELS = {
  phantom_invoice: "Phantom Invoice",
  duplicate_financing: "Duplicate Financing",
  over_invoicing: "Over-Invoicing",
  carousel_trade: "Carousel Trade",
  dilution: "Dilution",
  velocity_anomaly: "Velocity Anomaly",
  cascade_fraud: "Cascade Fraud",
};

const FRAUD_COLORS = {
  phantom_invoice: "#ef4444",
  duplicate_financing: "#f97316",
  over_invoicing: "#f59e0b",
  carousel_trade: "#8b5cf6",
  dilution: "#ec4899",
  velocity_anomaly: "#06b6d4",
  cascade_fraud: "#f43f5e",
};

const formatMoney = (val) => {
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${val}`;
};

function FraudDetection() {
  const [exposure, setExposure] = useState(null);
  const [flags, setFlags] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    Promise.all([fraudAPI.exposure(), fraudAPI.flags()])
      .then(([expRes, flagRes]) => {
        setExposure(expRes.data);
        setFlags(flagRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const runScan = () => {
    setScanning(true);
    fraudAPI
      .scan()
      .then((res) => {
        setScanResult(res.data);
        setScanning(false);
        // Refresh data
        fraudAPI.flags().then((r) => setFlags(r.data));
        fraudAPI.exposure().then((r) => setExposure(r.data));
      })
      .catch(() => setScanning(false));
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Loading fraud data...</span>
      </div>
    );
  }

  const exposureData = exposure?.by_type
    ? Object.entries(exposure.by_type).map(([key, val]) => ({
        name: FRAUD_LABELS[key] || key,
        exposure: val.exposure,
        count: val.invoice_count,
        color: FRAUD_COLORS[key] || "#64748b",
      }))
    : [];

  const radarData = exposureData.map((d) => ({
    type: d.name.split(" ")[0],
    exposure: d.exposure / 1000,
    count: d.count * 50000,
  }));

  const filteredFlags =
    activeFilter === "all"
      ? flags
      : flags.filter((f) => f.fraud_type === activeFilter);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Fraud Detection Center</h2>
          <p>Real-time fraud scanning across all detection engines</p>
        </div>
        <button
          className="btn btn-danger"
          onClick={runScan}
          disabled={scanning}
        >
          {scanning ? (
            <>
              <Loader size={16} className="pulse" /> Scanning...
            </>
          ) : (
            <>
              <Zap size={16} /> Run Full Scan
            </>
          )}
        </button>
      </div>

      {/* Scan Result Banner */}
      {scanResult && (
        <div
          className="card"
          style={{
            marginBottom: 20,
            borderColor:
              scanResult.flags_raised > 0
                ? "rgba(239,68,68,0.3)"
                : "rgba(16,185,129,0.3)",
            background:
              scanResult.flags_raised > 0
                ? "rgba(239,68,68,0.05)"
                : "rgba(16,185,129,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>
                Scan Complete – {scanResult.flags_raised} New Flags
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Scanned {scanResult.invoices_scanned} invoices across all 6
                detection engines
              </p>
            </div>
            <span
              className={`badge ${scanResult.flags_raised > 0 ? "critical" : "low"}`}
            >
              Scan #{scanResult.scan_id}
            </span>
          </div>
        </div>
      )}

      {/* Exposure Stats */}
      <div className="stats-grid">
        <div className="stat-card red">
          <div className="stat-icon">
            <DollarSign size={22} />
          </div>
          <div className="stat-value">
            {formatMoney(exposure?.total_exposure || 0)}
          </div>
          <div className="stat-label">Total Fraud Exposure</div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-value">{flags.length}</div>
          <div className="stat-label">Active Fraud Flags</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">
            <Scan size={22} />
          </div>
          <div className="stat-value">
            {Object.keys(exposure?.by_type || {}).length}
          </div>
          <div className="stat-label">Fraud Types Detected</div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">
            <Shield size={22} />
          </div>
          <div className="stat-value">6</div>
          <div className="stat-label">Detection Engines</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2">
        {/* Exposure by Type */}
        <div className="card">
          <div className="card-header">
            <h3>Exposure by Fraud Type</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={exposureData} layout="vertical">
              <XAxis
                type="number"
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(v) => formatMoney(v)}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
                formatter={(v) => formatMoney(v)}
              />
              <Bar dataKey="exposure" radius={[0, 4, 4, 0]}>
                {exposureData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div className="card">
          <div className="card-header">
            <h3>Threat Profile</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="type" stroke="#94a3b8" fontSize={11} />
              <PolarRadiusAxis stroke="#334155" fontSize={10} />
              <Radar
                name="Exposure ($K)"
                dataKey="exposure"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.2}
              />
              <Radar
                name="Invoice Count"
                dataKey="count"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.15}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fraud Flags Table */}
      <div className="card">
        <div className="card-header">
          <h3>Fraud Flags ({filteredFlags.length})</h3>
        </div>

        <div className="filters" style={{ marginBottom: 16 }}>
          <button
            className={`filter-chip ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            All
          </button>
          {Object.entries(FRAUD_LABELS).map(([key, label]) => (
            <button
              key={key}
              className={`filter-chip ${activeFilter === key ? "active" : ""}`}
              onClick={() => setActiveFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Fraud Type</th>
                <th>Severity</th>
                <th>Confidence</th>
                <th>Engine</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlags.slice(0, 50).map((flag) => (
                <tr key={flag.id}>
                  <td style={{ fontWeight: 600 }}>#{flag.invoice_id}</td>
                  <td>
                    <span className={`badge ${flag.fraud_type}`}>
                      {FRAUD_LABELS[flag.fraud_type] || flag.fraud_type}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${flag.severity}`}>
                      {flag.severity}
                    </span>
                  </td>
                  <td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div className="progress-bar" style={{ width: 60 }}>
                        <div
                          className={`progress-fill ${flag.confidence >= 0.9 ? "red" : flag.confidence >= 0.7 ? "orange" : "yellow"}`}
                          style={{ width: `${flag.confidence * 100}%` }}
                        />
                      </div>
                      <span>{(flag.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {flag.engine}
                  </td>
                  <td style={{ maxWidth: 300, fontSize: 12, lineHeight: 1.4 }}>
                    {flag.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FraudDetection;
