import { useState } from "react";
import AuthLanding from "./pages/AuthLanding";
import Login from "./pages/Login";
import Register from "./pages/Register";
import QRDisplay from "./pages/QRDisplay";
import Dashboard from "./pages/Dashboard";
import QRScanner from "./pages/QRScanner";
import ValidationSuccess from "./pages/ValidationSuccess";
import ScanHistory from "./pages/ScanHistory";
import Settings from "./pages/Settings";

// screens: "landing" | "login" | "register" | "qr-display" |
//          "dashboard" | "scanner" | "validation" | "history" | "settings"

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [officer, setOfficer] = useState(null);       // logged-in officer
  const [resident, setResident] = useState(null);     // just-registered resident

  // Auth handlers
  const handleLoginSuccess = (officerData) => {
    setOfficer(officerData);
    setScreen("dashboard");
    setActiveTab("dashboard");
  };

  const handleRegisterSuccess = (residentData) => {
    setResident(residentData);
    setScreen("qr-display");
  };

  // Tab / nav
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "dashboard") setScreen("dashboard");
    else if (tab === "history") setScreen("history");
    else if (tab === "settings") setScreen("settings");
  };

  // Scanner flow
  const handleScan = () => setScreen("scanner");
  const handleScanSuccess = () => setScreen("validation");
  const handleValidationBack = () => {
    setScreen("dashboard");
    setActiveTab("dashboard");
  };

  // Logout
  const handleLogout = () => {
    setOfficer(null);
    setResident(null);
    setScreen("landing");
    setActiveTab("dashboard");
  };

  // --- Render ---
  if (screen === "landing") {
    return (
      <AuthLanding
        onLogin={() => setScreen("login")}
        onRegister={() => setScreen("register")}
      />
    );
  }

  if (screen === "login") {
    return (
      <Login
        onBack={() => setScreen("landing")}
        onSuccess={handleLoginSuccess}
      />
    );
  }

  if (screen === "register") {
    return (
      <Register
        onBack={() => setScreen("landing")}
        onSuccess={handleRegisterSuccess}
      />
    );
  }

  if (screen === "qr-display") {
    return (
      <QRDisplay
        resident={resident}
        onDone={() => setScreen("landing")}
      />
    );
  }

  if (screen === "scanner") {
    return (
      <QRScanner
        onClose={handleValidationBack}
        onSuccess={handleScanSuccess}
      />
    );
  }

  if (screen === "validation") {
    return (
      <ValidationSuccess
        onBack={handleValidationBack}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    );
  }

  if (screen === "history") {
    return (
      <ScanHistory activeTab={activeTab} onTabChange={handleTabChange} />
    );
  }

  if (screen === "settings") {
    return (
      <Settings
        officer={officer}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
      />
    );
  }

  // Default: dashboard
  return (
    <Dashboard
      officer={officer}
      onScan={handleScan}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  );
}
