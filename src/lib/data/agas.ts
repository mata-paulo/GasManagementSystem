import { Timestamp, collection, getDocs, limit, query } from "firebase/firestore";
import type { AuthUser } from "@/lib/auth/authService";
import { db } from "@/lib/firebase/client";

export const WEEKLY_FUEL_LIMIT = 20;

export interface ResidentAccount extends AuthUser {
  uid: string;
  role: "resident";
  firstName?: string;
  lastName?: string;
  plate?: string;
  barangay?: string;
  vehicleType?: string;
  gasType?: string;
  registeredAt?: string;
  updatedAt?: string;
  status?: string;
}

export interface StationAccount extends AuthUser {
  uid: string;
  role: "station";
  brand?: string;
  barangay?: string;
  stationCode?: string;
  stationName?: string;
  officerFirstName?: string;
  officerLastName?: string;
  availableFuels?: string[];
  fuelCapacities?: Record<string, number>;
  fuelInventory?: Record<string, number>;
  fuelPrices?: Record<string, number>;
  registeredAt?: string;
  updatedAt?: string;
  status?: string;
}

export interface AdminAccount extends AuthUser {
  uid: string;
  role: "admin";
  firstName?: string;
  lastName?: string;
  registeredAt?: string;
  updatedAt?: string;
}

export interface DispenseTransaction {
  id: string;
  residentUid: string;
  stationUid: string;
  residentName: string;
  stationName: string;
  stationBrand: string;
  residentBarangay: string;
  stationBarangay: string;
  plate: string;
  vehicleType: string;
  liters: number;
  fuelType: string;
  pricePerLiter: number;
  totalPaid: number;
  createdAt: Date | null;
  weekKey: string;
  status: string;
}

export interface AdminDashboardData {
  residents: ResidentAccount[];
  stations: StationAccount[];
  admins: AdminAccount[];
  transactions: DispenseTransaction[];
}

type AccountRecord = ResidentAccount | StationAccount | AdminAccount;
type AccountRole = AccountRecord["role"];
type AccountDisplayRecord = Partial<AccountRecord> & {
  email?: string;
  firstName?: string;
  lastName?: string;
  brand?: string;
  barangay?: string;
  stationCode?: string;
  stationName?: string;
};

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function toIsoString(value: unknown): string | undefined {
  return toDate(value)?.toISOString();
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function asNumberMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, raw]) => {
      const parsed = asNumber(raw);
      return parsed == null ? null : [key, parsed] as const;
    })
    .filter(Boolean) as Array<readonly [string, number]>;

  return Object.fromEntries(entries);
}

function mapRole(value: unknown): AccountRole | null {
  return value === "resident" || value === "station" || value === "admin" ? value : null;
}

function mapBaseAccount(uid: string, data: Record<string, unknown>) {
  return {
    uid,
    email: typeof data.email === "string" ? data.email : undefined,
    firstName: typeof data.firstName === "string" ? data.firstName : undefined,
    lastName: typeof data.lastName === "string" ? data.lastName : undefined,
    registeredAt: toIsoString(data.registeredAt),
    updatedAt: toIsoString(data.updatedAt),
    loginAt: "",
  };
}

function mapAccount(uid: string, data: Record<string, unknown>): AccountRecord | null {
  const role = mapRole(data.role);
  if (!role) return null;

  const base = mapBaseAccount(uid, data);

  if (role === "resident") {
    return {
      ...base,
      role,
      plate: typeof data.plate === "string" ? data.plate : undefined,
      barangay: typeof data.barangay === "string" ? data.barangay : undefined,
      vehicleType: typeof data.vehicleType === "string" ? data.vehicleType : undefined,
      gasType: typeof data.gasType === "string" ? data.gasType : undefined,
      status: typeof data.status === "string" ? data.status : undefined,
    };
  }

  if (role === "station") {
    return {
      ...base,
      role,
      brand: typeof data.brand === "string" ? data.brand : undefined,
      barangay: typeof data.barangay === "string" ? data.barangay : undefined,
      stationCode: typeof data.stationCode === "string" ? data.stationCode : undefined,
      stationName: typeof data.stationName === "string" ? data.stationName : undefined,
      officerFirstName: typeof data.officerFirstName === "string" ? data.officerFirstName : undefined,
      officerLastName: typeof data.officerLastName === "string" ? data.officerLastName : undefined,
      availableFuels: asStringArray(data.availableFuels),
      fuelCapacities: asNumberMap(data.fuelCapacities),
      fuelInventory: asNumberMap(data.fuelInventory),
      fuelPrices: asNumberMap(data.fuelPrices),
      status: typeof data.status === "string" ? data.status : "online",
    };
  }

  return {
    ...base,
    role,
  };
}

function mapTransaction(id: string, data: Record<string, unknown>): DispenseTransaction {
  return {
    id,
    residentUid: typeof data.residentUid === "string" ? data.residentUid : "",
    stationUid: typeof data.stationUid === "string" ? data.stationUid : "",
    residentName: typeof data.residentName === "string" ? data.residentName : "",
    stationName: typeof data.stationName === "string" ? data.stationName : "",
    stationBrand: typeof data.stationBrand === "string" ? data.stationBrand : "",
    residentBarangay: typeof data.residentBarangay === "string" ? data.residentBarangay : "",
    stationBarangay: typeof data.stationBarangay === "string" ? data.stationBarangay : "",
    plate: typeof data.plate === "string" ? data.plate : "",
    vehicleType: typeof data.vehicleType === "string" ? data.vehicleType : "",
    liters: asNumber(data.liters) ?? 0,
    fuelType: typeof data.fuelType === "string" ? data.fuelType : "",
    pricePerLiter: asNumber(data.pricePerLiter) ?? 0,
    totalPaid: asNumber(data.totalPaid) ?? 0,
    createdAt: toDate(data.createdAt),
    weekKey: typeof data.weekKey === "string" ? data.weekKey : "",
    status: typeof data.status === "string" ? data.status : "dispensed",
  };
}

export function getWeekKey(date = new Date()): string {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  return start.toISOString().slice(0, 10);
}

export function getAccountDisplayName(
  account: AccountDisplayRecord,
): string {
  if (account.role === "station") {
    return (
      account.stationName ||
      [account.brand, account.barangay, "Station"].filter(Boolean).join(" ") ||
      account.stationCode ||
      "Station"
    );
  }

  return [account.firstName, account.lastName].filter(Boolean).join(" ").trim() || account.email || "User";
}

function sortTransactions(items: DispenseTransaction[]): DispenseTransaction[] {
  return [...items].sort((a, b) => {
    const aTime = a.createdAt?.getTime() ?? 0;
    const bTime = b.createdAt?.getTime() ?? 0;
    return bTime - aTime;
  });
}

function sortAccounts<T extends AccountRecord>(items: T[]): T[] {
  return [...items].sort((a, b) => getAccountDisplayName(a).localeCompare(getAccountDisplayName(b)));
}

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const [accountsSnapshot, transactionsSnapshot] = await Promise.all([
    getDocs(collection(db, "accounts")),
    getDocs(query(collection(db, "transactions"), limit(1000))),
  ]);

  const accounts = accountsSnapshot.docs
    .map((item) => mapAccount(item.id, item.data() as Record<string, unknown>))
    .filter((item): item is AccountRecord => item != null);

  const residents = sortAccounts(
    accounts.filter((item): item is ResidentAccount => item.role === "resident"),
  );
  const stations = sortAccounts(
    accounts.filter((item): item is StationAccount => item.role === "station"),
  );
  const admins = sortAccounts(
    accounts.filter((item): item is AdminAccount => item.role === "admin"),
  );
  const transactions = sortTransactions(
    transactionsSnapshot.docs.map((item) => mapTransaction(item.id, item.data() as Record<string, unknown>)),
  );

  return { residents, stations, admins, transactions };
}
