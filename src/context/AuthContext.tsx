import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { validateToken } from "../services/authService";
import type { AuthUser, Role } from "../services/authService";

interface AuthState {
  user: AuthUser | null;
  role: Role | null;
  isAuthenticated: boolean;
}

interface AuthContextValue {
  auth: AuthState;
  login: (user: AuthUser, role: Role, token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "frs_auth_token";

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
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      const payload = validateToken(token);
      if (payload) {
        setAuth({ user: payload.user, role: payload.role, isAuthenticated: true });
      } else {
        // Token expired — clean up
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setLoading(false);
  }, []);

  /**
   * Call after a successful login API response.
   * Persists the token and sets auth state.
   */
  const login = (user: AuthUser, role: Role, token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
    setAuth({ user, role, isAuthenticated: true });
  };

  /**
   * Clears all auth state and removes the persisted token.
   */
  const logout = (): void => {
    localStorage.removeItem(TOKEN_KEY);
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

