import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth as firebaseAuth, db } from "@/lib/firebase/client";
import { useAuth } from "@/app/providers/AuthContext";
import { acceptPendingStationAssignment } from "@/lib/data/agas";
import ChangePassword from "@/features/account/pages/ChangePassword";
import Settings from "@/features/account/pages/Settings";
import AdminDashboard from "@/features/admin/pages/AdminDashboard";
import AuthLanding from "@/features/auth/pages/AuthLanding";
import Login from "@/features/auth/pages/Login";
import PasswordReset from "@/features/auth/pages/PasswordReset";
import Register from "@/features/auth/pages/Register";
import StationRegister from "@/features/auth/pages/StationRegister";
import NearbyStations from "@/features/resident/pages/NearbyStations";
import QRDisplay from "@/features/resident/pages/QRDisplay";
import UserDashboard from "@/features/resident/pages/UserDashboard";
import UserScanHistory from "@/features/resident/pages/UserScanHistory";
import Dashboard from "@/features/station/pages/Dashboard";
import OfficerSettings from "@/features/station/pages/OfficerSettings";
import QRScanner from "@/features/station/pages/QRScanner";
import ResidentWebPortal from "@/features/station/pages/ResidentWebPortal";
import ScanHistory from "@/features/station/pages/ScanHistory";
import StationFuelSetup from "@/features/station/pages/StationFuelSetup";
import ValidationSuccess from "@/features/station/pages/ValidationSuccess";
import RoleGuard from "@/shared/guards/RoleGuard";

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

const DESKTOP_BREAKPOINT = 1024;
const isDesktop = () => window.innerWidth >= DESKTOP_BREAKPOINT;

export default function App() {
  const { auth, login, logout, loading } = useAuth();

  const [screen, setScreen] = useState(null);
  const [prevScreen, setPrevScreen] = useState<string>("landing");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [officer, setOfficer] = useState(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [resident, setResident] = useState(null);
  const [activeVehicle, setActiveVehicle] = useState<{ plate?: string; vehicleType?: string; gasType?: string } | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<number>(0);
  const [scannedResident, setScannedResident] = useState(null);
  const [oobCode, setOobCode] = useState<string | null>(null);

  // Switch resident between web and mobile portal on resize without refresh
  useEffect(() => {
    if (auth.role !== "resident" || !auth.isAuthenticated) return;

    const RESIDENT_SCREENS = new Set(["resident-web", "user-dashboard", "user-history", "map", "user-settings", "qr-display"]);

    const handleResize = () => {
      setScreen((prev) => {
        if (!RESIDENT_SCREENS.has(prev)) return prev;
        return isDesktop() ? "resident-web" : "user-dashboard";
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [auth.role, auth.isAuthenticated]);

  // Once auth state is restored, route to the correct portal
  useEffect(() => {
    if (loading) return;

    // Direct link support: ?register=station  → opens station registration
    // Direct link support: ?screen=change-password → opens change password
    const params = new URLSearchParams(window.location.search);
    if (params.get("register") === "station") {
      setPrevScreen("landing");
      setScreen("station-register");
      return;
    }
    if (params.get("screen") === "change-password") {
      setScreen("change-password");
      return;
    }

    // Password reset deep link: ?mode=resetPassword&oobCode=...
    if (params.get("mode") === "resetPassword" && params.get("oobCode")) {
      setOobCode(params.get("oobCode"));
      setScreen("password-reset");
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
      setScreen(isDesktop() ? "resident-web" : "user-dashboard");
    } else if (auth.role === "admin") {
      setScreen("admin");
    } else {
      setScreen("landing");
    }
  }, [loading, auth.isAuthenticated, auth.role, auth.user]);

  useEffect(() => {
    if (loading || !auth.isAuthenticated || auth.role !== "station") return;
    const uid = typeof auth.user?.uid === "string" ? auth.user.uid : "";
    const assignmentStatus =
      typeof auth.user?.assignmentStatus === "string" ? auth.user.assignmentStatus : "";
    if (!uid || assignmentStatus !== "pending") return;

    let cancelled = false;
    void acceptPendingStationAssignment(uid).then((accepted) => {
      if (!accepted || cancelled) return;
      setOfficer((prev) => (prev ? { ...prev, assignmentStatus: "active" } : prev));
    }).catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [loading, auth.isAuthenticated, auth.role, auth.user]);

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
  const handleLoginSuccess = (user, role) => {
    if (!role) {
      setScreen("login");
      return;
    }
    login(user, role);
    if (role === "station") {
      setOfficer(user);
      setScreen("dashboard");
      setActiveTab("dashboard");
    } else if (role === "resident") {
      setResident(user);
      setScreen(isDesktop() ? "resident-web" : "user-dashboard");
      setActiveTab("dashboard");
    } else if (role === "admin") {
      setScreen("admin");
    }
  };

  // ─── Register handlers ─────────────────────────────────────────────────────
  const handleResidentRegisterSuccess = (residentData) => {
    setResident(residentData);
    login(residentData, "resident");
    setScreen("user-dashboard");
    setActiveTab("dashboard");
  };

  const handleStationRegisterSuccess = async (stationData) => {
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, stationData.googleEmail, stationData.password);
      const uid = cred.user.uid;
      const firestoreData: Record<string, unknown> = {
        uid,
        role: "station",
        email: stationData.googleEmail,
        officerFirstName: stationData.officerFirstName,
        officerLastName:  stationData.officerLastName,
        brand:            stationData.brand,
        barangay:         stationData.barangay,
        availableFuels:   stationData.availableFuels,
        fuelCapacities:   stationData.fuelCapacities,
        assignmentStatus: "active",
        status:           "online",
        registeredAt:     serverTimestamp(),
      };
      if (stationData.lat != null && stationData.lon != null) {
        firestoreData.lat = stationData.lat;
        firestoreData.lon = stationData.lon;
      }
      await setDoc(doc(db, "accounts", uid), firestoreData);
      setOfficer({ ...stationData, uid });
    } catch {
      // Fallback: still enter dashboard in demo/emulator mode
      setOfficer(stationData);
    }
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
    if (window.location.pathname.startsWith("/admin")) {
      window.history.replaceState({}, "", "/");
    }
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
        onResidentRegister={() => { setPrevScreen("landing"); setScreen("resident-register"); }}
      />
    );
  }

  if (screen === "login") {
    return (
      <Login
        onBack={() => setScreen("landing")}
        onSuccess={handleLoginSuccess}
        onRegister={() => { setPrevScreen("login"); setScreen("resident-register"); }}
      />
    );
  }

  if (screen === "station-register") {
    return (
      <StationRegister
        onBack={() => setScreen(prevScreen)}
        onSuccess={handleStationRegisterSuccess}
        onSignIn={() => setScreen("login")}
      />
    );
  }

  if (screen === "resident-web") {
    return (
      <RoleGuard requiredRole="resident" onDeny={() => setScreen("landing")}>
        <ResidentWebPortal resident={resident} onLogout={handleLogout} onChangePassword={() => setScreen("change-password")} />
      </RoleGuard>
    );
  }

  if (screen === "resident-register") {
    return (
      <Register
        onBack={() => setScreen(prevScreen)}
        onSuccess={handleResidentRegisterSuccess}
        onSignIn={() => setScreen("login")}
      />
    );
  }

  if (screen === "password-reset") {
    return (
      <PasswordReset
        oobCode={oobCode}
        onBack={() => {
          // Clean up the URL query params so the reset screen doesn't reappear on refresh
          window.history.replaceState({}, "", window.location.pathname);
          setOobCode(null);
          setScreen("login");
        }}
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
          activeVehicle={activeVehicle}
          onDone={() => { setActiveVehicle(null); setScreen("user-dashboard"); }}
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
          onLogout={handleLogout}
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
          onScan={handleScan}
          onLogout={handleLogout}
        />
      </RoleGuard>
    );
  }

  if (screen === "settings") {
    return (
      <RoleGuard requiredRole="station" onDeny={() => setScreen("landing")}>
        <OfficerSettings
          officer={officer}
          activeTab={activeTab}
          onTabChange={handleOfficerTabChange}
          onLogout={handleLogout}
          onChangePassword={() => setScreen("change-password")}
        />
      </RoleGuard>
    );
  }

  if (screen === "change-password") {
    const returnScreen =
      auth.role === "resident" ? "user-settings" : auth.role === "admin" ? "admin" : "settings";
    return (
      <ChangePassword onSuccess={() => setScreen(returnScreen)} onBack={() => setScreen(returnScreen)} />
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
          onChangePassword={() => setScreen("change-password")}
          onUpdateProfile={(updated) => setResident((prev) => ({ ...prev, ...updated }))}
          selectedVehicle={selectedVehicle}
          onSelectVehicle={setSelectedVehicle}
          tabs={[
            { id: "dashboard", icon: "dashboard", label: "Dashboard" },
            { id: "user-history", icon: "receipt_long", label: "Transactions" },
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
          selectedVehicle={selectedVehicle}
          activeTab={activeTab}
          onTabChange={handleUserTabChange}
          onShowQR={() => setScreen("qr-display")}
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
          selectedVehicle={selectedVehicle}
          onSelectVehicle={setSelectedVehicle}
          onShowQR={(v) => { setActiveVehicle(v ?? null); setScreen("qr-display"); }}
          onUpdateResident={(updated) => setResident((prev) => ({ ...prev, ...updated }))}
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
            setOfficer((prev) =>
              prev
                ? {
                    ...prev,
                    fuelInventory: payload.fuelInventory,
                    fuelCapacities: payload.fuelCapacities,
                    fuelPrices: payload.fuelPrices,
                    availableFuels: Object.keys(payload.fuelInventory),
                  }
                : prev
            );
            setLastUpdated(new Date());
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
        lastUpdated={lastUpdated}
        onLogout={handleLogout}
      />
    </RoleGuard>
  );
}

