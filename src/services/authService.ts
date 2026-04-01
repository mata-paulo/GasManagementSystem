/**
 * Auth Service — simulates backend API middleware validation.
 *
 * Unified login maps to: POST /api/auth/login
 * The backend inspects credentials, determines the role, and returns a token.
 *
 * Replace the mock logic with a real fetch() call when a backend is ready.
 * The return shape { success, user, role, token } stays the same.
 */

// ─── Shared types ─────────────────────────────────────────────────────────────
export type Role = "station" | "resident" | "admin";

export interface AuthUser {
  email?: string;
  role: Role;
  loginAt: string;
  firstName?: string;
  lastName?: string;
  plate?: string;
  [key: string]: unknown;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  role?: Role;
  token?: string;
  error?: string;
}

// ─── Mock user store (replace with real DB on backend) ───────────────────────
interface MockUser {
  email: string;
  password: string;
  role: Role;
}

const MOCK_USERS: MockUser[] = [
  { email: "admin@fuelsystem.gov",  password: "Admin@2024",    role: "admin"    },
  { email: "officer@station.com",   password: "Officer@2024",  role: "station"  },
  { email: "juan@gmail.com",        password: "Resident@2024", role: "resident" },
];

// ─── Token helpers ────────────────────────────────────────────────────────────
// Base64-encoded payload with 8-hour expiry.
// In production this would be a signed JWT issued by the backend.

interface TokenPayload {
  user: AuthUser;
  role: Role;
  exp: number;
}

function generateToken(user: AuthUser, role: Role): string {
  const payload: TokenPayload = { user, role, exp: Date.now() + 8 * 60 * 60 * 1000 };
  return btoa(JSON.stringify(payload));
}

export function validateToken(token: string): TokenPayload | null {
  try {
    const payload: TokenPayload = JSON.parse(atob(token));
    if (Date.now() > payload.exp) return null; // expired
    return payload;                             // { user, role, exp }
  } catch {
    return null;
  }
}

// ─── Unified login ────────────────────────────────────────────────────────────

export async function login({ email, password }: { email: string; password: string }): Promise<AuthResult> {
  // Simulated network latency — remove when using real fetch()
  await new Promise((r) => setTimeout(r, 600));

  if (!email?.trim() || !password?.trim()) {
    return { success: false, error: "All fields are required." };
  }

  // In production:
  // const res  = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  // const data = await res.json();
  // if (!res.ok) return { success: false, error: data.message };
  // return { success: true, user: data.user, role: data.role, token: data.token };

  const found = MOCK_USERS.find(
    (u) => u.email === email.trim().toLowerCase() && u.password === password
  );

  if (!found) {
    return { success: false, error: "Invalid email or password." };
  }

  const user: AuthUser = {
    email: found.email,
    role: found.role,
    loginAt: new Date().toISOString(),
  };

  return { success: true, user, role: found.role, token: generateToken(user, found.role) };
}
