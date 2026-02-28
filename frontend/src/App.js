import React, { useState } from "react";
import {
  Shield,
  LayoutDashboard,
  FileText,
  AlertTriangle,
  Network,
  Bell,
  Scan,
} from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import FraudDetection from "./pages/FraudDetection";
import NetworkView from "./pages/NetworkView";
import Alerts from "./pages/Alerts";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "fraud", label: "Fraud Detection", icon: Scan },
  { id: "network", label: "Network Graph", icon: Network },
  { id: "alerts", label: "Alerts", icon: Bell, badge: true },
];

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [alertCount] = useState(4); // Critical alerts

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard onNavigate={setActivePage} />;
      case "invoices":
        return <Invoices />;
      case "fraud":
        return <FraudDetection />;
      case "network":
        return <NetworkView />;
      case "alerts":
        return <Alerts />;
      default:
        return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo">
            <Shield size={22} />
          </div>
          <div>
            <h1>IntelliTrace</h1>
            <span>SCF Fraud Detection</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => setActivePage(item.id)}
            >
              <item.icon size={18} />
              {item.label}
              {item.badge && alertCount > 0 && (
                <span className="badge">{alertCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status">
            <div className="status-dot" />
            All engines active
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">{renderPage()}</main>
    </div>
  );
}

export default App;
