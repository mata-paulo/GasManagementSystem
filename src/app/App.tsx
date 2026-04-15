import { useCallback, useState, useEffect } from "react";
import type { AuthUser } from "@/lib/auth/authService";
import { useAuth } from "@/app/providers/AuthContext";
import {
  acceptPendingStationAssignment,
  fetchResidentAccount,
  fetchStationAccount,
  saveStationFuelSettings,
} from "@/lib/data/agas";
import { syncResidentFuelCycleCallable } from "@/lib/firebase/syncResidentFuelCycle";
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
import {
  getStationPath,
  getStationTabFromPath,
  type StationNavId,
} from "@/shared/navigation/stationRoutes";

function stationTabToScreen(tab: StationNavId): "dashboard" | "history" | "settings" | "fuel-setup" {
  if (tab === "history") return "history";
  if (tab === "fuel-pricing") return "fuel-setup";
  if (tab === "settings") return "settings";
  return "dashboard";
}

function residentTabToScreen(tab: string): "user-dashboard" | "user-history" | "map" | "user-settings" {
  if (tab === "user-history") return "user-history";
  if (tab === "map") return "map";
  if (tab === "settings") return "user-settings";
  return "user-dashboard";
}

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
  const [inviteLinkState, setInviteLinkState] = useState<{
    email: string;
    inviteFlow: "full" | "password";
    prefill: {
      brand: string;
      barangay: string;
      firstName: string;
      lastName: string;
      stationCode: string;
    };
  } | null>(null);

  const refreshPortalUser = useCallback(async () => {
    const uid = typeof auth.user?.uid === "string" ? auth.user.uid : "";
    if (!uid) return;

    if (auth.role === "station") {
      const nextOfficer = await fetchStationAccount(uid);
      if (nextOfficer) {
        setOfficer(nextOfficer);
        setLastUpdated(nextOfficer.updatedAt ? new Date(nextOfficer.updatedAt) : null);
      }
      return;
    }

    if (auth.role === "resident") {
      await syncResidentFuelCycleCallable().catch(() => undefined);
      const nextResident = await fetchResidentAccount(uid);
      if (nextResident) {
        setResident(nextResident);
      }
    }
  }, [auth.role, auth.user]);

  const syncStationLocation = useCallback((tab: StationNavId, replace = false) => {
    const nextPath = getStationPath(tab);
    const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
    if (currentPath === nextPath) return;

    const historyMethod = replace ? "replaceState" : "pushState";
    window.history[historyMethod]({}, "", nextPath);
  }, []);

  const navigateStation = useCallback((tab: StationNavId, replace = false) => {
    setActiveTab(tab);
    setScreen(stationTabToScreen(tab));
    syncStationLocation(tab, replace);
  }, [syncStationLocation]);

  // Switch resident between web and mobile portal on resize without refresh
  useEffect(() => {
    if (auth.role !== "resident" || !auth.isAuthenticated) return;

    const RESIDENT_SCREENS = new Set(["resident-web", "user-dashboard", "user-history", "map", "user-settings", "qr-display"]);

    const handleResize = () => {
      setScreen((prev) => {
        if (!RESIDENT_SCREENS.has(prev)) return prev;
        if (prev === "qr-display") return prev;
        if (isDesktop()) return "resident-web";
        if (prev === "resident-web") return residentTabToScreen(activeTab);
        return prev;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab, auth.role, auth.isAuthenticated]);

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
    const resetMode = params.get("mode") === "resetPassword";
    const oobParam = params.get("oobCode");
    if (resetMode && oobParam) {
      if (auth.isAuthenticated) {
        window.history.replaceState({}, "", window.location.pathname);
      } else if (params.get("stationInvite") === "1") {
        setOobCode(oobParam);
        const inviteFlow =
          params.get("inviteFlow") === "password" ? "password" : "full";
        setInviteLinkState({
          email: params.get("inviteEmail")?.trim().toLowerCase() ?? "",
          inviteFlow,
          prefill: {
            brand: params.get("prefillBrand") ?? "",
            barangay: params.get("prefillBarangay") ?? "",
            firstName: params.get("prefillFirst") ?? "",
            lastName: params.get("prefillLast") ?? "",
            stationCode: params.get("prefillStationCode") ?? "",
          },
        });
        setScreen(
          inviteFlow === "password" ? "station-invite-password" : "station-invite-setup",
        );
        return;
      } else {
        setOobCode(oobParam);
        setScreen("password-reset");
        return;
      }
    }

    if (!auth.isAuthenticated) {
      setScreen("landing");
      return;
    }
    if (auth.role === "station") {
      setOfficer(auth.user);
      const pending =
        typeof auth.user?.assignmentStatus === "string" &&
        auth.user.assignmentStatus === "pending";
      if (pending) {
        setScreen("station-onboarding");
      } else {
        const stationTab = getStationTabFromPath(window.location.pathname) ?? "dashboard";
        navigateStation(stationTab, true);
      }
    } else if (auth.role === "resident") {
      setResident(auth.user);
      setScreen(isDesktop() ? "resident-web" : "user-dashboard");
    } else if (auth.role === "admin") {
      setScreen("admin");
    } else {
      setScreen("landing");
    }
  }, [loading, auth.isAuthenticated, auth.role, auth.user, navigateStation]);

  useEffect(() => {
    if (loading || !auth.isAuthenticated || !auth.role || typeof auth.user?.uid !== "string") {
      return;
    }

    void refreshPortalUser().catch(() => undefined);
  }, [auth.isAuthenticated, auth.role, auth.user, loading, refreshPortalUser]);

  useEffect(() => {
    if (loading || !auth.isAuthenticated || auth.role !== "station") return;
    const uid = typeof auth.user?.uid === "string" ? auth.user.uid : "";
    const assignmentStatus =
      typeof auth.user?.assignmentStatus === "string" ? auth.user.assignmentStatus : "";
    if (!uid || assignmentStatus !== "pending") return;

    let cancelled = false;
    void acceptPendingStationAssignment(uid).then((accepted) => {
      if (!accepted || cancelled) return;
      void refreshPortalUser().catch(() => undefined);
    }).catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [loading, auth.isAuthenticated, auth.role, auth.user, refreshPortalUser]);

  useEffect(() => {
    const handlePopState = () => {
      if (auth.role !== "station") return;

      const stationTab = getStationTabFromPath(window.location.pathname);
      if (!stationTab) return;

      setActiveTab(stationTab);
      setScreen(stationTabToScreen(stationTab));
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [auth.role]);

  // ─── Tab navigation ────────────────────────────────────────────────────────
  const handleOfficerTabChange = (tab) => {
    if (tab === "dashboard" || tab === "history" || tab === "settings" || tab === "fuel-pricing") {
      navigateStation(tab);
    }
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
      const pending =
        typeof user?.assignmentStatus === "string" && user.assignmentStatus === "pending";
      if (pending) {
        setScreen("station-onboarding");
        setActiveTab("dashboard");
      } else {
        navigateStation("dashboard", true);
      }
    } else if (role === "resident") {
      setResident(user);
      const nextTab = "dashboard";
      setActiveTab(nextTab);
      setScreen(isDesktop() ? "resident-web" : residentTabToScreen(nextTab));
    } else if (role === "admin") {
      setScreen("admin");
    }
  };

  // ─── Register handlers ─────────────────────────────────────────────────────
  const handleResidentRegisterSuccess = (residentData) => {
    setResident(residentData);
    login(residentData, "resident");
    const nextTab = "dashboard";
    setActiveTab(nextTab);
    setScreen(window.innerWidth >= 1024 ? "resident-web" : residentTabToScreen(nextTab));
  };

  const handleStationRegisterSuccess = async (stationData) => {
    const stationUser = stationData as AuthUser;
    login(stationUser, "station");
    setOfficer(stationUser);
    navigateStation("dashboard", true);
  };

  // ─── Scanner ───────────────────────────────────────────────────────────────
  const handleScan = () => setScreen("scanner");
  const handleScanSuccess = (decoded) => {
    setScannedResident(decoded);
    setScreen("validation");
  };
  const handleValidationBack = () => {
    navigateStation("dashboard");
  };
  const handleDispenseSuccess = async () => {
    await refreshPortalUser();
    setLastUpdated(new Date());
    navigateStation("dashboard");
  };

  // ─── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    setOfficer(null);
    setResident(null);
    setOobCode(null);
    setInviteLinkState(null);
    if (window.location.pathname.startsWith("/admin")) {
      window.history.replaceState({}, "", "/");
    } else if (auth.role === "station") {
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

  if (screen === "station-invite-password" && inviteLinkState) {
    return (
      <PasswordReset
        oobCode={oobCode}
        stationInviteEmail={inviteLinkState.email}
        onStationInviteSession={async (user) => {
          login(user, "station");
          setOfficer(user);
          window.history.replaceState({}, "", window.location.pathname);
          setOobCode(null);
          setInviteLinkState(null);
          setActiveTab("dashboard");
          setScreen("dashboard");
        }}
        onBack={() => {
          window.history.replaceState({}, "", window.location.pathname);
          setOobCode(null);
          setInviteLinkState(null);
          setScreen("landing");
        }}
      />
    );
  }

  if (screen === "station-invite-setup" && inviteLinkState) {
    return (
      <StationRegister
        mode="inviteLink"
        inviteOobCode={oobCode}
        inviteEmail={inviteLinkState.email}
        invitePrefill={inviteLinkState.prefill}
        onBack={() => {
          window.history.replaceState({}, "", window.location.pathname);
          setOobCode(null);
          setInviteLinkState(null);
          setScreen("landing");
        }}
        onInviteSession={async (user) => {
          login(user, "station");
          setOfficer(user);
          window.history.replaceState({}, "", window.location.pathname);
          setOobCode(null);
          setInviteLinkState(null);
          setActiveTab("dashboard");
          setScreen("dashboard");
        }}
      />
    );
  }

  if (screen === "station-onboarding") {
    return (
      <RoleGuard requiredRole="station" onDeny={() => setScreen("landing")}>
        <StationRegister
          mode="onboarding"
          onBack={handleLogout}
          onComplete={async () => {
            const uid = typeof auth.user?.uid === "string" ? auth.user.uid : "";
            if (uid) {
              await acceptPendingStationAssignment(uid);
            }
            const base = officer ?? auth.user;
            if (base && typeof base === "object") {
              const next = {...base, assignmentStatus: "active"};
              login(next, "station");
              setOfficer(next);
            }
            setScreen("dashboard");
          }}
        />
      </RoleGuard>
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
          onDispenseSuccess={() => void handleDispenseSuccess()}
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
          onShowQR={() => {
            const v = (resident?.vehicles ?? [])[selectedVehicle] ?? (resident?.vehicles ?? [])[0];
            setActiveVehicle(v ?? null);
            setScreen("qr-display");
          }}
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
          onShowQR={() => {
            const v = (resident?.vehicles ?? [])[selectedVehicle] ?? (resident?.vehicles ?? [])[0];
            setActiveVehicle(v ?? null);
            setScreen("qr-display");
          }}
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
          activeTab={activeTab}
          onTabChange={handleOfficerTabChange}
          onLogout={handleLogout}
          onBack={() => {
            navigateStation("dashboard");
          }}
          onSave={async (payload) => {
            if (typeof officer?.uid === "string") {
              const nextOfficer = await saveStationFuelSettings(officer.uid, payload);
              if (nextOfficer) {
                setOfficer(nextOfficer);
                setLastUpdated(nextOfficer.updatedAt ? new Date(nextOfficer.updatedAt) : new Date());
              }
            }
            navigateStation("dashboard");
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
        onEditFuels={() => { setScreen("fuel-setup"); setActiveTab("fuel-pricing"); }}
        activeTab={activeTab}
        onTabChange={handleOfficerTabChange}
        lastUpdated={lastUpdated}
        onLogout={handleLogout}
        onPresenceSaved={() => void refreshPortalUser()}
      />
    </RoleGuard>
  );
}

