import { useState } from "react";
import AuthLanding from "./pages/AuthLanding";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResidentLogin from "./pages/ResidentLogin";
import RegisterTypeSelect from "./pages/RegisterTypeSelect";
import StationRegister from "./pages/StationRegister";
import QRDisplay from "./pages/QRDisplay";
import Dashboard from "./pages/Dashboard";
import UserDashboard from "./pages/UserDashboard";
import QRScanner from "./pages/QRScanner";
import ValidationSuccess from "./pages/ValidationSuccess";
import ScanHistory from "./pages/ScanHistory";
import Settings from "./pages/Settings";
import NearbyStations from "./pages/NearbyStations";
import UserScanHistory from "./pages/UserScanHistory";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [officer, setOfficer] = useState(null);
  const [resident, setResident] = useState(null);
  const [scannedResident, setScannedResident] = useState(null);

  const handleOfficerTabChange = (tab) => {
    setActiveTab(tab);

    if (tab === "dashboard") setScreen("dashboard");
    else if (tab === "history") setScreen("history");
    else if (tab === "settings") setScreen("settings");
  };

  const handleUserTabChange = (tab) => {
    setActiveTab(tab);

    if (tab === "dashboard") setScreen("user-dashboard");
    else if (tab === "user-history") setScreen("user-history");
    else if (tab === "map") setScreen("map");
    else if (tab === "settings") setScreen("user-settings");
  };

  const handleStationLoginSuccess = (officerData) => {
    setOfficer(officerData);
    setScreen("dashboard");
    setActiveTab("dashboard");
  };

  const handleResidentLoginSuccess = (residentData) => {
    setResident(residentData);
    setScreen("user-dashboard");
    setActiveTab("dashboard");
  };

  const handleResidentRegisterSuccess = (residentData) => {
    setResident(residentData);
    setScreen("qr-display");
  };

  const handleStationRegisterSuccess = (stationData) => {
    setOfficer(stationData);
    setScreen("dashboard");
    setActiveTab("dashboard");
  };

  const handleScan = () => setScreen("scanner");
  const handleScanSuccess = (decoded) => {
    setScannedResident(decoded);
    setScreen("validation");
  };

  const handleValidationBack = () => {
    setScreen("dashboard");
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setOfficer(null);
    setResident(null);
    setScreen("landing");
    setActiveTab("dashboard");
  };

  if (screen === "admin") {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (screen === "landing") {
    return (
      <AuthLanding
        onStationLogin={() => setScreen("station-login")}
        onResidentLogin={() => setScreen("resident-login")}
        onRegister={() => setScreen("register-type")}
        onAdmin={() => setScreen("admin")}
      />
    );
  }

  if (screen === "station-login") {
    return (
      <Login
        onBack={() => setScreen("landing")}
        onSuccess={handleStationLoginSuccess}
      />
    );
  }

  if (screen === "resident-login") {
    return (
      <ResidentLogin
        onBack={() => setScreen("landing")}
        onSuccess={handleResidentLoginSuccess}
      />
    );
  }

  if (screen === "register-type") {
    return (
      <RegisterTypeSelect
        onBack={() => setScreen("landing")}
        onResidentRegister={() => setScreen("resident-register")}
        onStationRegister={() => setScreen("station-register")}
      />
    );
  }

  if (screen === "resident-register") {
    return (
      <Register
        onBack={() => setScreen("register-type")}
        onSuccess={handleResidentRegisterSuccess}
      />
    );
  }

  if (screen === "station-register") {
    return (
      <StationRegister
        onBack={() => setScreen("register-type")}
        onSuccess={handleStationRegisterSuccess}
      />
    );
  }

  if (screen === "qr-display") {
    return (
      <QRDisplay
        resident={resident}
        onDone={() => setScreen("user-dashboard")}
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
        officer={officer}
        scannedResident={scannedResident}
        onBack={handleValidationBack}
        activeTab={activeTab}
        onTabChange={handleOfficerTabChange}
      />
    );
  }

  if (screen === "history") {
    return (
      <ScanHistory
        officer={officer}
        activeTab={activeTab}
        onTabChange={handleOfficerTabChange}
      />
    );
  }

  if (screen === "settings") {
    return (
      <Settings
        officer={officer}
        activeTab={activeTab}
        onTabChange={handleOfficerTabChange}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === "user-settings") {
    return (
      <Settings
        officer={resident}
        activeTab={activeTab}
        onTabChange={handleUserTabChange}
        onLogout={handleLogout}
        tabs={[
          { id: "dashboard", icon: "dashboard", label: "Dashboard" },
          { id: "user-history", icon: "receipt_long", label: "Scan History" },
          { id: "map", icon: "map", label: "Map" },
          { id: "settings", icon: "account_circle", label: "Account" },
        ]}
      />
    );
  }

  if (screen === "user-history") {
    return (
      <UserScanHistory
        resident={resident}
        activeTab={activeTab}
        onTabChange={handleUserTabChange}
      />
    );
  }

  if (screen === "map") {
    return (
      <NearbyStations
        activeTab={activeTab}
        onTabChange={handleUserTabChange}
      />
    );
  }

  if (screen === "user-dashboard") {
    return (
      <UserDashboard
        resident={resident}
        activeTab={activeTab}
        onTabChange={handleUserTabChange}
        onShowQR={() => setScreen("qr-display")}
      />
    );
  }

  return (
    <Dashboard
      officer={officer}
      onScan={handleScan}
      activeTab={activeTab}
      onTabChange={handleOfficerTabChange}
    />
  );
}