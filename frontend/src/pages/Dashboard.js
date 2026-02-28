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
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  FileText,
  AlertTriangle,
  Shield,
  DollarSign,
  TrendingUp,
  Activity,
  Users,
  Zap,
} from "lucide-react";
import { dashboardAPI } from "../api";

const FRAUD_COLORS = {
  phantom_invoice: "#ef4444",
  duplicate_financing: "#f97316",
  over_invoicing: "#f59e0b",
  carousel_trade: "#8b5cf6",
  dilution: "#ec4899",
  velocity_anomaly: "#06b6d4",
  cascade_fraud: "#f43f5e",
};

const FRAUD_LABELS = {
  phantom_invoice: "Phantom Invoice",
  duplicate_financing: "Duplicate Financing",
  over_invoicing: "Over-Invoicing",
  carousel_trade: "Carousel Trade",
  dilution: "Dilution",
  velocity_anomaly: "Velocity Anomaly",
  cascade_fraud: "Cascade Fraud",
};

const RISK_COLORS = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

const formatMoney = (val) => {
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${val}`;
};

function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI
      .getStats()
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="loading">
        <span>Unable to load dashboard. Is the backend running?</span>
      </div>
    );
  }

  const fraudPieData = Object.entries(stats.fraud_by_type).map(
    ([key, value]) => ({
      name: FRAUD_LABELS[key] || key,
      value,
      color: FRAUD_COLORS[key] || "#64748b",
    }),
  );

  const riskPieData = Object.entries(stats.risk_distribution).map(
    ([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      color: RISK_COLORS[key] || "#64748b",
    }),
  );

  const tierData = Object.entries(stats.tier_breakdown).map(([key, val]) => ({
    name: key.replace("tier_", "Tier "),
    invoices: val.count,
    amount: val.amount,
  }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Fraud Detection Dashboard</h2>
          <p>Multi-Tier Supply Chain Finance Monitoring</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate("fraud")}>
          <Zap size={16} /> Run Fraud Scan
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">
            <FileText size={22} />
          </div>
          <div className="stat-value">{stats.total_invoices}</div>
          <div className="stat-label">Total Invoices</div>
          <div className="stat-change" style={{ color: "var(--accent-blue)" }}>
            {formatMoney(stats.total_amount)} total volume
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-icon">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-value">{stats.flagged_invoices}</div>
          <div className="stat-label">Flagged Invoices</div>
          <div className="stat-change" style={{ color: "var(--accent-red)" }}>
            {formatMoney(stats.flagged_amount)} at risk
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">
            <Shield size={22} />
          </div>
          <div className="stat-value">{stats.fraud_flags_count}</div>
          <div className="stat-label">Fraud Flags</div>
          <div
            className="stat-change"
            style={{ color: "var(--accent-purple)" }}
          >
            {stats.critical_alerts} critical alerts
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">
            <Activity size={22} />
          </div>
          <div className="stat-value">{stats.avg_risk_score}</div>
          <div className="stat-label">Avg Risk Score</div>
          <div
            className="stat-change"
            style={{
              color:
                stats.avg_risk_score > 50
                  ? "var(--accent-red)"
                  : "var(--accent-green)",
            }}
          >
            {stats.entities_count} entities monitored
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2-1">
        {/* Monthly Trend */}
        <div className="card">
          <div className="card-header">
            <h3>Invoice & Fraud Trend</h3>
            <span
              className="card-badge"
              style={{
                background: "rgba(59,130,246,0.15)",
                color: "var(--accent-blue)",
              }}
            >
              Monthly
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={stats.monthly_trend}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="count"
                name="Total Invoices"
                stroke="#3b82f6"
                fill="url(#colorAmount)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="flagged"
                name="Flagged"
                stroke="#ef4444"
                fill="url(#colorFlagged)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Fraud by Type */}
        <div className="card">
          <div className="card-header">
            <h3>Fraud by Type</h3>
            <span
              className="card-badge"
              style={{
                background: "rgba(239,68,68,0.15)",
                color: "var(--accent-red)",
              }}
            >
              {stats.fraud_flags_count} flags
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={fraudPieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {fraudPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              justifyContent: "center",
            }}
          >
            {fraudPieData.map((entry, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  color: "#94a3b8",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: entry.color,
                  }}
                />
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2">
        {/* Tier Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3>Tier Breakdown</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tierData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
                formatter={(value, name) => [
                  name === "amount" ? formatMoney(value) : value,
                  name,
                ]}
              />
              <Bar
                dataKey="invoices"
                name="Invoices"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="card">
          <div className="card-header">
            <h3>Risk Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskPieData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#64748b"
                fontSize={12}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
              />
              <Bar dataKey="value" name="Invoices" radius={[0, 4, 4, 0]}>
                {riskPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="card">
        <div className="card-header">
          <h3>Recent Alerts</h3>
          <button
            className="btn btn-ghost"
            onClick={() => onNavigate("alerts")}
          >
            View All
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Alert</th>
                <th>Severity</th>
                <th>Type</th>
                <th>Exposure</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_alerts.slice(0, 6).map((alert) => (
                <tr key={alert.id}>
                  <td
                    style={{
                      color: "var(--text-primary)",
                      fontWeight: 500,
                      maxWidth: 300,
                    }}
                  >
                    {alert.title}
                  </td>
                  <td>
                    <span className={`badge ${alert.severity}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${alert.fraud_type}`}>
                      {FRAUD_LABELS[alert.fraud_type] || alert.fraud_type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {formatMoney(alert.total_exposure)}
                  </td>
                  <td>
                    <span className={`badge ${alert.status}`}>
                      {alert.status}
                    </span>
                  </td>
                  <td>{new Date(alert.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
