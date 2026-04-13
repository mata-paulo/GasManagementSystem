import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { signOut } from "firebase/auth";
import { setStationPresenceStatus, stampStationLastSeen } from "@/lib/data/agas";
import { parseStoredSession, type AuthUser, type Role, type StoredSession } from "@/lib/auth/authService";
import { auth as firebaseAuth } from "@/lib/firebase/client";

interface AuthState {
  user: AuthUser | null;
  role: Role | null;
  isAuthenticated: boolean;
}

interface AuthContextValue {
  auth: AuthState;
  login: (user: AuthUser, role: Role) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "frs_auth_session";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    role: null,       // "station" | "resident" | "admin" | null
    isAuthenticated: false,
  });
  // True while restoring session from localStorage on first load
  const [loading, setLoading] = useState<boolean>(true);

  // Restore session on mount
  useEffect(() => {
    const rawSession = localStorage.getItem(SESSION_KEY);
    if (rawSession) {
      const session = parseStoredSession(rawSession) as StoredSession | null;
      if (session) {
        setAuth({ user: session.user, role: session.role, isAuthenticated: true });
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!auth.isAuthenticated || auth.role !== "station" || typeof auth.user?.uid !== "string") {
      return;
    }

    const uid = auth.user.uid;

    // Do not force presenceStatus to "online" here — that overwrote an officer's "offline"
    // choice on every refresh and raced with manual Online/Offline toggles. Presence is
    // loaded from `accounts` via `fetchStationAccount` when the station portal hydrates.

    const heartbeat = window.setInterval(() => {
      void stampStationLastSeen(uid).catch(() => undefined);
    }, 60_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void stampStationLastSeen(uid).catch(() => undefined);
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [auth.isAuthenticated, auth.role, auth.user]);

  /**
   * Call after a successful login API response.
   * Persists the token and sets auth state.
   */
  const login = (user: AuthUser, role: Role): void => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ user, role, loginAt: new Date().toISOString() })
    );
    setAuth({ user, role, isAuthenticated: true });
  };

  /**
   * Clears all auth state and removes the persisted token.
   */
  const logout = (): void => {
    if (auth.role === "station" && typeof auth.user?.uid === "string") {
      void setStationPresenceStatus(auth.user.uid, "offline").catch(() => undefined);
    }
    void signOut(firebaseAuth).catch(() => undefined);
    localStorage.removeItem(SESSION_KEY);
    setAuth({ user: null, role: null, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

