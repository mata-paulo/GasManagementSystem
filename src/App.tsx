import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import RoleGuard from "./components/RoleGuard";
import AuthLanding from "./pages/AuthLanding";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StationRegister from "./pages/StationRegister";
import QRDisplay from "./pages/QRDisplay";
import Dashboard from "./pages/Dashboard";
import StationFuelSetup from "./pages/StationFuelSetup";
import UserDashboard from "./pages/UserDashboard";
import QRScanner from "./pages/QRScanner";
import ValidationSuccess from "./pages/ValidationSuccess";
import ScanHistory from "./pages/ScanHistory";
import Settings from "./pages/Settings";
import NearbyStations from "./pages/NearbyStations";
import UserScanHistory from "./pages/UserScanHistory";
import AdminDashboard from "./pages/AdminDashboard";

// ─── Splash shown while restoring session from localStorage ──────────────────
function SplashScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-primary-container gap-4">
      <span
        className="material-symbols-outlined text-yellow-400 icon-fill text-[64px]"
      >
        local_gas_station
      </span>
      <p className="text-white/70 text-sm font-semibold tracking-wide">
        A.G.A.S
      </p>
    </div>
  );
}

export default function App() {
  const { auth, login, logout, loading } = useAuth();

  const [screen, setScreen] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [officer, setOfficer] = useState(null);
  const [resident, setResident] = useState(null);
  const [scannedResident, setScannedResident] = useState(null);

  // Once auth state is restored, route to the correct portal
  useEffect(() => {
    if (loading) return;

    // Direct link support: ?register=station  → opens station registration
    const params = new URLSearchParams(window.location.search);
    if (params.get("register") === "station") {
      setScreen("station-register");
      return;
    }

    if (!auth.isAuthenticated) {
      setScreen("landing");
      return;
    }
    if (auth.role === "station") {
      setOfficer(auth.user);
      setScreen("dashboard");
    } else if (auth.role === "resident") {
      setResident(auth.user);
      setScreen("user-dashboard");
    } else if (auth.role === "admin") {
      setScreen("admin");
    } else {
      setScreen("landing");
    }
  }, [loading]);

  // ─── Tab navigation ────────────────────────────────────────────────────────
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

  // ─── Unified login — routes each role to its own portal ───────────────────
  const handleLoginSuccess = (user, token, role) => {
    login(user, role, token);
    if (role === "station") {
      setOfficer(user);
      setScreen("dashboard");
      setActiveTab("dashboard");
    } else if (role === "resident") {
      setResident(user);
      setScreen("user-dashboard");
      setActiveTab("dashboard");
    } else if (role === "admin") {
      setScreen("admin");
    }
  };

  // ─── Register handlers ─────────────────────────────────────────────────────
  const handleResidentRegisterSuccess = (residentData) => {
    setResident(residentData);
    login(residentData, "resident", undefined);
    setScreen("user-dashboard");
    setActiveTab("dashboard");
  };

  const handleStationRegisterSuccess = (stationData) => {
    setOfficer(stationData);
    setScreen("dashboard");
    setActiveTab("dashboard");
  };

  // ─── Scanner ───────────────────────────────────────────────────────────────
  const handleScan = () => setScreen("scanner");
  const handleScanSuccess = (decoded) => {
    setScannedResident(decoded);
    setScreen("validation");
  };
  const handleValidationBack = () => {
    setScreen("dashboard");
    setActiveTab("dashboard");
  };

  // ─── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    setOfficer(null);
    setResident(null);
    setScreen("landing");
    setActiveTab("dashboard");
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading || screen === null) return <SplashScreen />;

  // ── Public screens ──────────────────────────────────────────────────────────
  if (screen === "landing") {
    return (
      <AuthLanding
        onLogin={() => setScreen("login")}
        onResidentRegister={() => setScreen("resident-register")}
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

  if (screen === "station-register") {
    return (
      <StationRegister
        onBack={() => setScreen("landing")}
        onSuccess={handleStationRegisterSuccess}
      />
    );
  }

  if (screen === "resident-register") {
    return (
      <Register
        onBack={() => setScreen("landing")}
        onSuccess={handleResidentRegisterSuccess}
      />
    );
  }

  // ── Protected screens — each guarded to its own role ───────────────────────

  if (screen === "admin") {
    return (
      <RoleGuard requiredRole="admin" onDeny={() => setScreen("landing")}>
        <AdminDashboard onLogout={handleLogout} />
      </RoleGuard>
    );
  }

  if (screen === "qr-display") {
    return (
      <RoleGuard requiredRole="resident" onDeny={() => setScreen("landing")}>
        <QRDisplay
          resident={resident}
          onDone={() => setScreen("user-dashboard")}
        />
      </RoleGuard>
    );
  }

  if (screen === "scanner") {
    return (
      <RoleGuard requiredRole="station" onDeny={() => setScreen("landing")}>
        <QRScanner onClose={handleValidationBack} onSuccess={handleScanSuccess} />
      </RoleGuard>
    );
  }

  if (screen === "validation") {
    return (
      <RoleGuard requiredRole="station" onDeny={() => setScreen("landing")}>
        <ValidationSuccess
          officer={officer}
          scannedResident={scannedResident}
          onBack={handleValidationBack}
          activeTab={activeTab}
          onTabChange={handleOfficerTabChange}
        />
      </RoleGuard>
    );
  }

  if (screen === "history") {
    return (
      <RoleGuard requiredRole="station" onDeny={() => setScreen("landing")}>
        <ScanHistory
          officer={officer}
          activeTab={activeTab}
          onTabChange={handleOfficerTabChange}
        />
      </RoleGuard>
    );
  }

  if (screen === "settings") {
    return (
      <RoleGuard requiredRole="station" onDeny={() => setScreen("landing")}>
        <Settings
          officer={officer}
          activeTab={activeTab}
          onTabChange={handleOfficerTabChange}
          onLogout={handleLogout}
        />
      </RoleGuard>
    );
  }

  if (screen === "user-settings") {
    return (
      <RoleGuard requiredRole="resident" onDeny={() => setScreen("landing")}>
        <Settings
          officer={resident}
          activeTab={activeTab}
          onTabChange={handleUserTabChange}
          onLogout={handleLogout}
          onShowQR={() => setScreen("qr-display")}
          tabs={[
            { id: "dashboard", icon: "dashboard", label: "Dashboard" },
            { id: "user-history", icon: "receipt_long", label: "Scan History" },
            { id: "map", icon: "map", label: "Map" },
            { id: "settings", icon: "account_circle", label: "Account" },
          ]}
        />
      </RoleGuard>
    );
  }

  if (screen === "user-history") {
    return (
      <RoleGuard requiredRole="resident" onDeny={() => setScreen("landing")}>
        <UserScanHistory
          resident={resident}
          activeTab={activeTab}
          onTabChange={handleUserTabChange}
        />
      </RoleGuard>
    );
  }

  if (screen === "map") {
    return (
      <RoleGuard requiredRole="resident" onDeny={() => setScreen("landing")}>
        <NearbyStations activeTab={activeTab} onTabChange={handleUserTabChange} />
      </RoleGuard>
    );
  }

  if (screen === "user-dashboard") {
    return (
      <RoleGuard requiredRole="resident" onDeny={() => setScreen("landing")}>
        <UserDashboard
          resident={resident}
          activeTab={activeTab}
          onTabChange={handleUserTabChange}
          onShowQR={() => setScreen("qr-display")}
        />
      </RoleGuard>
    );
  }

  if (screen === "fuel-setup") {
    return (
      <RoleGuard requiredRole="station" onDeny={() => setScreen("landing")}>
        <StationFuelSetup
          officer={officer}
          onBack={() => {
            setScreen("dashboard");
            setActiveTab("dashboard");
          }}
          onSave={(payload) => {
            const total = Object.values(payload.fuelCapacities).reduce((a, b) => a + b, 0);
            setOfficer((prev) =>
              prev
                ? {
                    ...prev,
                    fuelCapacities: payload.fuelCapacities,
                    fuelPrices: payload.fuelPrices,
                    availableFuels: Object.keys(payload.fuelCapacities),
                    capacity: total,
                  }
                : prev
            );
            setScreen("dashboard");
            setActiveTab("dashboard");
          }}
        />
      </RoleGuard>
    );
  }

  // Default: station dashboard
  return (
    <RoleGuard requiredRole="station" onDeny={() => setScreen("landing")}>
      <Dashboard
        officer={officer}
        onScan={handleScan}
        onEditFuels={() => setScreen("fuel-setup")}
        activeTab={activeTab}
        onTabChange={handleOfficerTabChange}
      />
    </RoleGuard>
  );
}
