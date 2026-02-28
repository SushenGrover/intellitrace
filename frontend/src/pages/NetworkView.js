import React, { useState, useEffect, useRef, useCallback } from "react";
import { analyticsAPI } from "../api";
import {
  Network,
  AlertTriangle,
  RefreshCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const ENTITY_COLORS = {
  buyer: "#3b82f6",
  supplier: "#10b981",
  lender: "#f59e0b",
};

const TIER_COLORS = {
  tier_1: "#10b981",
  tier_2: "#06b6d4",
  tier_3: "#8b5cf6",
};

function NetworkView() {
  const [network, setNetwork] = useState(null);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);
  const [nodePositions, setNodePositions] = useState({});

  useEffect(() => {
    Promise.all([analyticsAPI.network(), analyticsAPI.entities()])
      .then(([netRes, entRes]) => {
        setNetwork(netRes.data);
        setEntities(entRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Calculate positions using a force-directed-like layout
  useEffect(() => {
    if (!network || !network.nodes.length) return;

    const positions = {};
    const width = 900;
    const height = 560;
    const centerX = width / 2;
    const centerY = height / 2;

    // Group by type and tier
    const buyers = network.nodes.filter((n) => n.entity_type === "buyer");
    const tier1 = network.nodes.filter((n) => n.tier === "tier_1");
    const tier2 = network.nodes.filter((n) => n.tier === "tier_2");
    const tier3 = network.nodes.filter((n) => n.tier === "tier_3");
    const lenders = network.nodes.filter((n) => n.entity_type === "lender");

    // Position buyers at top
    buyers.forEach((n, i) => {
      positions[n.id] = {
        x: centerX + (i - (buyers.length - 1) / 2) * 180,
        y: 70,
      };
    });

    // Tier 1 in upper-middle
    tier1.forEach((n, i) => {
      positions[n.id] = {
        x: 100 + (i * (width - 200)) / Math.max(tier1.length - 1, 1),
        y: 190,
      };
    });

    // Tier 2 in lower-middle
    tier2.forEach((n, i) => {
      positions[n.id] = {
        x: 120 + (i * (width - 240)) / Math.max(tier2.length - 1, 1),
        y: 320,
      };
    });

    // Tier 3 at bottom
    tier3.forEach((n, i) => {
      positions[n.id] = {
        x: 150 + (i * (width - 300)) / Math.max(tier3.length - 1, 1),
        y: 440,
      };
    });

    // Lenders on the right
    lenders.forEach((n, i) => {
      positions[n.id] = {
        x: width - 60,
        y: 150 + i * 130,
      };
    });

    setNodePositions(positions);
  }, [network]);

  const getRiskColor = (score) => {
    if (score >= 75) return "#ef4444";
    if (score >= 50) return "#f97316";
    if (score >= 25) return "#f59e0b";
    return "#10b981";
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Building network graph...</span>
      </div>
    );
  }

  if (!network) {
    return (
      <div className="loading">
        <span>Unable to load network data.</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Supply Chain Network</h2>
          <p>Graph topology with carousel detection & community analysis</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
          >
            <ZoomIn size={16} />
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
          >
            <ZoomOut size={16} />
          </button>
        </div>
      </div>

      <div className="grid-2-1">
        {/* Network SVG */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="network-container" style={{ height: 560 }}>
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${900} ${560}`}
              style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
                </marker>
                <marker
                  id="arrowhead-red"
                  markerWidth="10"
                  markerHeight="7"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                </marker>
              </defs>

              {/* Edges */}
              {network.edges.map((edge, i) => {
                const from = nodePositions[edge.source];
                const to = nodePositions[edge.target];
                if (!from || !to) return null;

                const isHighRisk = edge.risk_score > 60;
                const isCarousel = network.carousel_cycles.some(
                  (cycle) =>
                    cycle.includes(edge.source) && cycle.includes(edge.target),
                );

                return (
                  <line
                    key={i}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={
                      isCarousel
                        ? "#ef4444"
                        : isHighRisk
                          ? "#f97316"
                          : "#334155"
                    }
                    strokeWidth={isCarousel ? 2.5 : isHighRisk ? 1.8 : 1}
                    strokeDasharray={isCarousel ? "6,3" : "none"}
                    markerEnd={
                      isCarousel ? "url(#arrowhead-red)" : "url(#arrowhead)"
                    }
                    opacity={0.7}
                  />
                );
              })}

              {/* Nodes */}
              {network.nodes.map((node) => {
                const pos = nodePositions[node.id];
                if (!pos) return null;

                const baseColor =
                  node.entity_type === "lender"
                    ? ENTITY_COLORS.lender
                    : TIER_COLORS[node.tier] || ENTITY_COLORS[node.entity_type];

                const isSelected = selectedNode?.id === node.id;
                const radius = Math.max(14, Math.min(28, node.size));

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Risk glow */}
                    {node.risk_score > 50 && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius + 6}
                        fill="none"
                        stroke={getRiskColor(node.risk_score)}
                        strokeWidth={2}
                        opacity={0.4}
                      />
                    )}
                    {/* Node circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius}
                      fill={baseColor}
                      stroke={isSelected ? "#fff" : "transparent"}
                      strokeWidth={isSelected ? 3 : 0}
                      opacity={0.9}
                    />
                    {/* Label */}
                    <text
                      x={pos.x}
                      y={pos.y + radius + 14}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize={9}
                      fontWeight={500}
                    >
                      {node.name.length > 16
                        ? node.name.substring(0, 14) + "…"
                        : node.name}
                    </text>
                    {/* Risk score inside */}
                    <text
                      x={pos.x}
                      y={pos.y + 4}
                      textAnchor="middle"
                      fill="white"
                      fontSize={10}
                      fontWeight={700}
                    >
                      {node.risk_score > 0 ? Math.round(node.risk_score) : ""}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="network-legend">
              <div className="legend-item">
                <div
                  className="legend-dot"
                  style={{ background: ENTITY_COLORS.buyer }}
                />
                Buyer
              </div>
              <div className="legend-item">
                <div
                  className="legend-dot"
                  style={{ background: TIER_COLORS.tier_1 }}
                />
                Tier 1 Supplier
              </div>
              <div className="legend-item">
                <div
                  className="legend-dot"
                  style={{ background: TIER_COLORS.tier_2 }}
                />
                Tier 2 Supplier
              </div>
              <div className="legend-item">
                <div
                  className="legend-dot"
                  style={{ background: TIER_COLORS.tier_3 }}
                />
                Tier 3 Supplier
              </div>
              <div className="legend-item">
                <div
                  className="legend-dot"
                  style={{ background: ENTITY_COLORS.lender }}
                />
                Lender
              </div>
              <div className="legend-item" style={{ marginTop: 6 }}>
                <div
                  style={{
                    width: 20,
                    height: 2,
                    background: "#ef4444",
                    borderTop: "2px dashed #ef4444",
                  }}
                />
                Carousel Cycle
              </div>
            </div>
          </div>
        </div>

        {/* Entity Detail / Stats */}
        <div>
          {/* Selected Node */}
          {selectedNode && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <h3>{selectedNode.name}</h3>
                <span
                  className={`badge ${selectedNode.risk_score >= 75 ? "critical" : selectedNode.risk_score >= 50 ? "high" : selectedNode.risk_score >= 25 ? "medium" : "low"}`}
                >
                  Risk: {Math.round(selectedNode.risk_score)}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                <p>
                  <strong>Type:</strong> {selectedNode.entity_type}
                </p>
                {selectedNode.tier && (
                  <p>
                    <strong>Tier:</strong>{" "}
                    {selectedNode.tier.replace("tier_", "Tier ")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Carousel Cycles */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h3>Carousel Cycles</h3>
              <span className="badge critical">
                {network.carousel_cycles.length}
              </span>
            </div>
            {network.carousel_cycles.length > 0 ? (
              network.carousel_cycles.map((cycle, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(239,68,68,0.05)",
                    border: "1px solid rgba(239,68,68,0.15)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--accent-red)",
                      marginBottom: 4,
                    }}
                  >
                    <AlertTriangle size={12} /> Cycle #{i + 1}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {cycle
                      .map((id) => {
                        const node = network.nodes.find((n) => n.id === id);
                        return node?.name || `#${id}`;
                      })
                      .join(" → ")}{" "}
                    → ↻
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                No carousel cycles detected
              </p>
            )}
          </div>

          {/* Communities */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h3>Communities</h3>
              <span
                className="badge"
                style={{
                  background: "rgba(59,130,246,0.15)",
                  color: "var(--accent-blue)",
                }}
              >
                {network.communities.length}
              </span>
            </div>
            {network.communities.slice(0, 5).map((comm, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 4,
                  }}
                >
                  Cluster #{i + 1} ({comm.length} entities)
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {comm
                    .slice(0, 6)
                    .map((id) => {
                      const node = network.nodes.find((n) => n.id === id);
                      return node?.name || `#${id}`;
                    })
                    .join(", ")}
                  {comm.length > 6 ? ` +${comm.length - 6} more` : ""}
                </div>
              </div>
            ))}
          </div>

          {/* High Risk Entities */}
          <div className="card">
            <div className="card-header">
              <h3>Highest Risk Entities</h3>
            </div>
            {entities
              .filter((e) => e.risk_score > 30)
              .sort((a, b) => b.risk_score - a.risk_score)
              .slice(0, 8)
              .map((entity) => (
                <div
                  key={entity.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(51,65,85,0.5)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {entity.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {entity.entity_type} ·{" "}
                      {entity.tier?.replace("tier_", "Tier ") || "N/A"} ·{" "}
                      {entity.country}
                    </div>
                  </div>
                  <span
                    className={`risk-score ${entity.risk_score >= 75 ? "risk-critical" : entity.risk_score >= 50 ? "risk-high" : "risk-medium"}`}
                  >
                    <span className="risk-dot" />
                    {entity.risk_score}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetworkView;
