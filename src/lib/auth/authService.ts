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

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function asNumberMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, raw]) => {
        const parsed = typeof raw === "number" ? raw : Number(raw);
        return Number.isFinite(parsed) ? [key, parsed] as const : null;
      })
      .filter((entry): entry is readonly [string, number] => entry != null)
  );
}

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
    const stationSourceIdRaw =
      typeof data.stationSourceId === "number" ? data.stationSourceId : Number(data.stationSourceId ?? NaN);
    const stationSourceId = Number.isFinite(stationSourceIdRaw) ? stationSourceIdRaw : undefined;

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
      fuelAllocation:
        typeof data.fuelAllocation === "number" ? data.fuelAllocation : Number(data.fuelAllocation ?? 20),
      fuelUsed:
        typeof data.fuelUsed === "number" ? data.fuelUsed : Number(data.fuelUsed ?? 0),
      fuelWeekKey:
        typeof data.fuelWeekKey === "string" ? data.fuelWeekKey : undefined,
      registeredAt,
      brand: data.brand as string | undefined,
      stationCode: data.stationCode as string | undefined,
      stationName: data.stationName as string | undefined,
      stationDirectoryId: data.stationDirectoryId as string | undefined,
      stationSourceId,
      officerFirstName: data.officerFirstName as string | undefined,
      officerLastName: data.officerLastName as string | undefined,
      availableFuels: asStringArray(data.availableFuels),
      fuelCapacities: asNumberMap(data.fuelCapacities),
      fuelInventory: asNumberMap(data.fuelInventory),
      fuelPrices: asNumberMap(data.fuelPrices),
      assignmentStatus: data.assignmentStatus as string | undefined,
      presenceStatus: data.presenceStatus as string | undefined,
      lastSeenAt:
        data.lastSeenAt instanceof Timestamp
          ? data.lastSeenAt.toDate().toISOString()
          : typeof data.lastSeenAt === "string"
            ? data.lastSeenAt
            : undefined,
      assignedAt:
        data.assignedAt instanceof Timestamp
          ? data.assignedAt.toDate().toISOString()
          : typeof data.assignedAt === "string"
            ? data.assignedAt
            : undefined,
      inviteAcceptedAt:
        data.inviteAcceptedAt instanceof Timestamp
          ? data.inviteAcceptedAt.toDate().toISOString()
          : typeof data.inviteAcceptedAt === "string"
            ? data.inviteAcceptedAt
            : undefined,
      status: data.status as string | undefined,
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
