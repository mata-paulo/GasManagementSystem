/**
 * Auth Service — Firebase Auth + Firestore-backed login.
 *
 * Unified login:
 * - sign in with Firebase Auth (email + password)
 * - fetch the user's profile/role from Firestore `accounts/{uid}`
 * - return { success, user, role, token }
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
  error?: string;
}

// ─── Session helpers (stored alongside token) ─────────────────────────────────
export interface StoredSession {
  user: AuthUser;
  role: Role;
  loginAt: string;
}

export function parseStoredSession(raw: string): StoredSession | null {
  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.role) return null;
    if (!parsed.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ─── Unified login ────────────────────────────────────────────────────────────
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

export async function login({ email, password }: { email: string; password: string }): Promise<AuthResult> {
  if (!email?.trim() || !password?.trim()) {
    return { success: false, error: "All fields are required." };
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const uid = cred.user.uid;

    const snap = await getDoc(doc(db, "accounts", uid));
    if (!snap.exists()) {
      return { success: false, error: "Account profile not found. Please contact support." };
    }

    const data = snap.data() as Record<string, unknown>;
    const role = data.role as Role | undefined;
    if (role !== "resident" && role !== "station" && role !== "admin") {
      return { success: false, error: "Account role is invalid. Please contact support." };
    }

    const registeredAtRaw = data.registeredAt as unknown;
    const registeredAt =
      registeredAtRaw instanceof Timestamp
        ? registeredAtRaw.toDate().toISOString()
        : typeof registeredAtRaw === "string"
          ? registeredAtRaw
          : undefined;

    const user: AuthUser = {
      uid,
      email: (data.email as string | undefined) ?? normalizedEmail,
      role,
      loginAt: new Date().toISOString(),
      firstName: data.firstName as string | undefined,
      lastName: data.lastName as string | undefined,
      plate: data.plate as string | undefined,
      barangay: data.barangay as string | undefined,
      vehicleType: data.vehicleType as string | undefined,
      gasType: data.gasType as string | undefined,
      registeredAt,
    };

    return { success: true, user, role };
  } catch (err: unknown) {
    const msg =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: string }).code)
        : "";
    if (msg === "auth/invalid-email") return { success: false, error: "Invalid email address." };
    if (msg === "auth/user-not-found" || msg === "auth/wrong-password" || msg === "auth/invalid-credential") {
      return { success: false, error: "Invalid email or password." };
    }
    if (msg === "auth/too-many-requests") {
      return { success: false, error: "Too many attempts. Please try again later." };
    }
    return { success: false, error: "Login failed. Please try again." };
  }
}
