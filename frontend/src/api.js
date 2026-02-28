import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
};

export const invoiceAPI = {
  list: (params) => api.get("/invoices/", { params }),
  get: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post("/invoices/", data),
  summary: () => api.get("/invoices/stats/summary"),
};

export const fraudAPI = {
  scan: () => api.post("/fraud/scan"),
  flags: (params) => api.get("/fraud/flags", { params }),
  exposure: () => api.get("/fraud/exposure"),
};

export const analyticsAPI = {
  network: () => api.get("/analytics/network"),
  entities: () => api.get("/analytics/entities"),
  riskScores: () => api.post("/analytics/risk-scores"),
};

export const alertAPI = {
  list: (params) => api.get("/alerts/", { params }),
  get: (id) => api.get(`/alerts/${id}`),
  updateStatus: (id, status) =>
    api.patch(`/alerts/${id}/status?new_status=${status}`),
  summary: () => api.get("/alerts/stats/summary"),
};

export default api;
