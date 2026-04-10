import {
  GeoPoint,
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { AuthUser } from "@/lib/auth/authService";
import { auth, db } from "@/lib/firebase/client";
import type { DecodedQR } from "@/lib/qr/qrCodec";
import { roundLiters } from "@/utils/fuelVolume";

export const WEEKLY_FUEL_LIMIT = 20;

export interface ResidentAccount extends AuthUser {
  uid: string;
  role: "resident";
  firstName?: string;
  lastName?: string;
  barangay?: string;
  gasType?: string;
  // Multi-vehicle support (jevguio PR #4)
  vehicles?: Array<{ type: string; plate: string; gasType: string; fuelAllocated?: number; fuelUsed?: number; fuelWeekKey?: string }>;
  fuelAllocation?: number;
  fuelUsed?: number;
  fuelWeekKey?: string;
  registeredAt?: string;
  updatedAt?: string;
  status?: string;
}

export interface StationAccount extends AuthUser {
  uid: string;
  role: "station";
  brand?: string;
  barangay?: string;
  capacity?: string | number;
  stationDirectoryId?: string;
  stationSourceId?: number;
  stationCode?: string;
  stationName?: string;
  officerFirstName?: string;
  officerLastName?: string;
  availableFuels?: string[];
  fuelCapacities?: Record<string, number>;
  fuelInventory?: Record<string, number>;
  /** Lifetime dispensed liters per fuel type (from stationDirectory.fuels[].dispensed). */
  fuelDispensed?: Record<string, number>;
  /** Sum of all `fuelDispensed` values (liters). */
  fuelTotalDispensed?: number;
  fuelPrices?: Record<string, number>;
  assignmentStatus?: string;
  presenceStatus?: string;
  lastSeenAt?: string;
  assignedAt?: string;
  inviteAcceptedAt?: string;
  registeredAt?: string;
  updatedAt?: string;
  status?: string;
  lat?: number;
  lon?: number;
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
  stationId: string;
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
  amount: number;
  totalPaid: number;
  occurredAt: Date | null;
  createdAt: Date | null;
  weekKey: string;
  status: string;
}

export interface AdminDashboardData {
  residents: ResidentAccount[];
  stations: StationAccount[];
  admins: AdminAccount[];
  transactions: DispenseTransaction[];
  stationDirectory: StationDirectoryRecord[];
}

export interface StationBrandPrice {
  label: string;
  price: number;
}

export interface StationBrandColors {
  bg: string;
  text: string;
  dot: string;
}

export interface StationDirectoryRecord {
  id: string;
  name: string;
  brand: string;
  address: string;
  rating: number | null;
  hours: string;
  lat: number;
  lon: number;
  brandPrices: StationBrandPrice[];
  brandColors?: StationBrandColors;
  barangay?: string;
  officer?: string;
  capacity?: number;
  dispensed?: number;
  status?: string;
}

export interface AssignStationUserInput {
  stationDirectoryId?: string;
  email: string;
  /** Optional; if omitted, names are derived from the email local part on the server. */
  firstName?: string;
  lastName?: string;
}

export interface AssignedStationUserResult {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  stationDirectoryId: string;
  stationSourceId: number;
  stationName: string;
  assignedUserCount: number;
  assignmentStatus: string;
  inviteStatus: string;
  inviteEmailStatus: string;
  inviteEmailError?: string | null;
  inviteDeliveryMethod: string;
  isNewUser: boolean;
  pendingInvite?: PendingInviteResponse | null;
  /** Token registration flow: URL to open Station Register (also emailed via SMTP). */
  link?: string;
  token?: string;
  expiresAt?: string;
  /** Alias for `inviteEmailStatus` in token flow; modals often read `emailStatus`. */
  emailStatus?: "queued" | "sent" | "failed";
}

export interface ResidentAllocationSummary {
  transactions: DispenseTransaction[];
  fuelAllocation: number;
  usedLiters: number;
  remainingLiters: number;
}

function normalizePlateKey(value: string): string {
  return (value ?? "").trim().toUpperCase();
}

function getResidentVehicleByPlate(
  resident: ResidentAccount,
  plate: string,
): { type: string; plate: string; gasType: string; fuelAllocated?: number; fuelUsed?: number; fuelWeekKey?: string } | null {
  const target = normalizePlateKey(plate);
  const vehicles = Array.isArray(resident.vehicles) ? resident.vehicles : [];
  if (!target || vehicles.length === 0) return null;
  return vehicles.find((v) => normalizePlateKey(v.plate) === target) ?? null;
}

function getResidentVehicleFuelAllocation(
  resident: ResidentAccount,
  plate: string,
): number {
  const v = getResidentVehicleByPlate(resident, plate);
  const allocated = asNumber(v?.fuelAllocated);
  return allocated ?? WEEKLY_FUEL_LIMIT;
}

function getResidentVehicleFuelUsed(
  resident: ResidentAccount,
  plate: string,
  cycleKey = getResidentFuelCycleKey(resident),
): number {
  const v = getResidentVehicleByPlate(resident, plate);
  const storedUsed = asNumber(v?.fuelUsed) ?? 0;
  const storedWeekKey = asString(v?.fuelWeekKey);
  if (storedWeekKey === cycleKey) return storedUsed;
  // Backfill behavior: older/newer docs may have fuelUsed set but an empty/missing week key.
  // Treat that value as current-cycle usage so "remaining" updates correctly.
  if (!storedWeekKey && storedUsed > 0) return storedUsed;
  return 0;
}

function getResidentVehicleCycleTransactionLiters(
  resident: ResidentAccount | null | undefined,
  transactions: DispenseTransaction[],
  plate: string,
  cycleKey = getResidentFuelCycleKey(resident),
): number {
  const target = normalizePlateKey(plate);
  return roundLiters(
    transactions
      .filter((transaction) =>
        normalizePlateKey(transaction.plate) === target &&
        getResidentTransactionCycleKey(resident, transaction) === cycleKey
      )
      .reduce((sum, transaction) => sum + transaction.liters, 0),
  );
}

function buildResidentVehicleAllocationSummary(
  resident: ResidentAccount | null | undefined,
  transactions: DispenseTransaction[],
  plate: string,
): ResidentAllocationSummary {
  const currentCycleKey = getResidentFuelCycleKey(resident);
  if (!resident) {
    return { transactions, fuelAllocation: WEEKLY_FUEL_LIMIT, usedLiters: 0, remainingLiters: WEEKLY_FUEL_LIMIT };
  }

  const fuelAllocation = getResidentVehicleFuelAllocation(resident, plate);
  const usedStored = getResidentVehicleFuelUsed(resident, plate, currentCycleKey);
  const usedFromTx = getResidentVehicleCycleTransactionLiters(resident, transactions, plate, currentCycleKey);
  const usedLiters = Math.max(usedStored, usedFromTx);
  return {
    transactions,
    fuelAllocation,
    usedLiters,
    remainingLiters: Math.max(fuelAllocation - usedLiters, 0),
  };
}

export interface ResolvedResidentScan extends ResidentAllocationSummary {
  resident: ResidentAccount;
}

export interface SaveStationFuelSettingsInput {
  fuelInventory: Record<string, number>;
  fuelCapacities: Record<string, number>;
  fuelPrices: Record<string, number>;
}

export interface RecordDispenseTransactionInput {
  stationUid: string;
  residentUid: string;
  liters: number;
  fuelType: string;
  /** Plate of the specific vehicle being fueled (from QR scan). Falls back to resident.vehicles[0].plate if omitted. */
  plate?: string;
  /** Vehicle type of the specific vehicle being fueled (from QR scan). */
  vehicleType?: string;
}

export interface RecordDispenseTransactionResult {
  transaction: DispenseTransaction;
  resident: ResidentAccount;
  station: StationAccount;
  usedLiters: number;
  remainingLiters: number;
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

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asBrandPriceArray(value: unknown): StationBrandPrice[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const label = asString((entry as {label?: unknown}).label);
      const price = asNumber((entry as {price?: unknown}).price);
      return label && price != null ? {label, price} : null;
    })
    .filter((entry): entry is StationBrandPrice => entry != null);
}

function asBrandColors(value: unknown): StationBrandColors | undefined {
  if (!value || typeof value !== "object") return undefined;
  const bg = asString((value as {bg?: unknown}).bg);
  const text = asString((value as {text?: unknown}).text);
  const dot = asString((value as {dot?: unknown}).dot);
  return bg && text && dot ? {bg, text, dot} : undefined;
}

function asGeoPoint(value: unknown): GeoPoint | null {
  return value instanceof GeoPoint ? value : null;
}

function getFunctionsRegion(): string {
  return import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION ??
    import.meta.env.VITE_PUBLIC_FIREBASE_FUNCTIONS_REGION ??
    "asia-southeast1";
}

function getProjectId(): string {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ??
    import.meta.env.VITE_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("Missing Firebase project ID.");
  }
  return projectId;
}

function getAssignStationUserUrl(): string {
  const overrideUrl = import.meta.env.VITE_ASSIGN_STATION_USER_URL ??
    import.meta.env.VITE_PUBLIC_ASSIGN_STATION_USER_URL;
  if (overrideUrl) {
    return overrideUrl;
  }

  const region = getFunctionsRegion();
  const projectId = getProjectId();
  const useEmulators =
    import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true" ||
    import.meta.env.VITE_PUBLIC_USE_EMULATOR === "true";

  // Production `vite build` sets DEV=false; hosting emulator still needs direct Functions URLs when emulators are on.
  if (useEmulators) {
    return `http://127.0.0.1:5001/${projectId}/${region}/assignStationUser`;
  }

  if (import.meta.env.DEV && projectId) {
    return `https://${region}-${projectId}.cloudfunctions.net/assignStationUser`;
  }

  return "/api/assignStationUser";
}

function getValidateStationRegistrationTokenUrl(token: string): string {
  const region = getFunctionsRegion();
  const projectId = getProjectId();
  const useEmulators =
    import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true" ||
    import.meta.env.VITE_PUBLIC_USE_EMULATOR === "true";

  const base = useEmulators
    ? `http://127.0.0.1:5001/${projectId}/${region}/validateStationRegistrationToken`
    : import.meta.env.DEV
      ? `https://${region}-${projectId}.cloudfunctions.net/validateStationRegistrationToken`
      : "/api/validateStationRegistrationToken";

  const qs = new URLSearchParams({token});
  return `${base}?${qs.toString()}`;
}

function getFinalizeStationRegistrationUrl(): string {
  const region = getFunctionsRegion();
  const projectId = getProjectId();
  const useEmulators =
    import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true" ||
    import.meta.env.VITE_PUBLIC_USE_EMULATOR === "true";

  if (useEmulators) {
    return `http://127.0.0.1:5001/${projectId}/${region}/finalizeStationRegistration`;
  }
  if (import.meta.env.DEV && projectId) {
    return `https://${region}-${projectId}.cloudfunctions.net/finalizeStationRegistration`;
  }
  return "/api/finalizeStationRegistration";
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
      barangay: typeof data.barangay === "string" ? data.barangay : undefined,
      gasType: typeof data.gasType === "string" ? data.gasType : undefined,
      vehicles: Array.isArray(data.vehicles)
        ? (data.vehicles as Array<{ type: string; plate: string; gasType: string; fuelAllocated?: number; fuelUsed?: number; fuelWeekKey?: string }>)
        : undefined,
      // Legacy vehicle2* fields intentionally ignored (vehicles[] is source of truth).
      fuelAllocation: asNumber(data.fuelAllocation) ?? WEEKLY_FUEL_LIMIT,
      fuelUsed: asNumber(data.fuelUsed) ?? 0,
      fuelWeekKey: asString(data.fuelWeekKey),
      status: typeof data.status === "string" ? data.status : undefined,
    };
  }

  if (role === "station") {
    return {
      ...base,
      role,
      brand: typeof data.brand === "string" ? data.brand : undefined,
      barangay: typeof data.barangay === "string" ? data.barangay : undefined,
      capacity: asNumber(data.capacity),
      stationDirectoryId: typeof data.stationDirectoryId === "string" ? data.stationDirectoryId : undefined,
      stationSourceId: asNumber(data.stationSourceId),
      stationCode: typeof data.stationCode === "string" ? data.stationCode : undefined,
      stationName: typeof data.stationName === "string" ? data.stationName : undefined,
      officerFirstName: typeof data.officerFirstName === "string" ? data.officerFirstName : undefined,
      officerLastName: typeof data.officerLastName === "string" ? data.officerLastName : undefined,
      availableFuels: asStringArray(data.availableFuels),
      fuelCapacities: asNumberMap(data.fuelCapacities),
      fuelInventory: asNumberMap(data.fuelInventory),
      fuelPrices: asNumberMap(data.fuelPrices),
      assignmentStatus: typeof data.assignmentStatus === "string" ? data.assignmentStatus : undefined,
      presenceStatus: typeof data.presenceStatus === "string" ? data.presenceStatus : undefined,
      lastSeenAt: toIsoString(data.lastSeenAt),
      assignedAt: toIsoString(data.assignedAt),
      inviteAcceptedAt: toIsoString(data.inviteAcceptedAt),
      status: typeof data.status === "string" ? data.status : "online",
      lat: asNumber(data.lat),
      lon: asNumber(data.lon),
    };
  }

  return {
    ...base,
    role,
  };
}

function mapTransaction(id: string, data: Record<string, unknown>): DispenseTransaction {
  const occurredAt = toDate(data.occurredAt) ?? toDate(data.createdAt);
  const amount = asNumber(data.amount) ?? asNumber(data.totalPaid) ?? 0;
  return {
    id,
    residentUid: typeof data.residentUid === "string" ? data.residentUid : "",
    stationUid: typeof data.stationUid === "string" ? data.stationUid : "",
    stationId: typeof data.stationId === "string" ? data.stationId : "",
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
    amount,
    totalPaid: amount,
    occurredAt,
    createdAt: occurredAt,
    weekKey: typeof data.weekKey === "string" ? data.weekKey : "",
    status: typeof data.status === "string" ? data.status : "dispensed",
  };
}

function mapStationDirectoryRecord(id: string, data: Record<string, unknown>): StationDirectoryRecord | null {
  const name = asString(data.name);
  const brand = asString(data.brand);
  const address = asString(data.address);
  const hours = asString(data.hours);
  const lat = asNumber(data.lat);
  const lon = asNumber(data.lon);
  const location = asGeoPoint(data.location);

  const resolvedLat = lat ?? location?.latitude;
  const resolvedLon = lon ?? location?.longitude;

  if (
    name == null ||
    brand == null ||
    address == null ||
    hours == null ||
    resolvedLat == null ||
    resolvedLon == null
  ) {
    return null;
  }

  return {
    id,
    name,
    brand,
    address,
    rating: asNumber(data.rating) ?? null,
    hours,
    lat: resolvedLat,
    lon: resolvedLon,
    brandPrices: asBrandPriceArray(data.brandPrices),
    brandColors: asBrandColors(data.brandColors),
    barangay: asString(data.barangay),
    officer: asString(data.officer),
    capacity: asNumber(data.capacity),
    dispensed: asNumber(data.dispensed),
    status: asString(data.status),
  };
}

export function getWeekKey(date = new Date()): string {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  const year = start.getFullYear();
  const month = String(start.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(start.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}

const RESIDENT_FUEL_CYCLE_MS = 7 * 24 * 60 * 60 * 1000;

function getResidentFuelCycleKey(
  account: ResidentAccount | null | undefined,
  date = new Date(),
): string {
  const registeredAt = toDate(account?.registeredAt);
  if (!registeredAt) {
    return getWeekKey(date);
  }

  const targetTime = date.getTime();
  const anchorTime = registeredAt.getTime();
  if (!Number.isFinite(targetTime) || !Number.isFinite(anchorTime)) {
    return getWeekKey(date);
  }

  const elapsed = Math.max(targetTime - anchorTime, 0);
  const cycleIndex = Math.floor(elapsed / RESIDENT_FUEL_CYCLE_MS);
  return `${account?.uid ?? "resident"}:${cycleIndex}`;
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

function stationFuelPricesToBrandPrices(
  fuelPrices: Record<string, number> | undefined,
): StationBrandPrice[] {
  if (!fuelPrices) return [];

  return Object.entries(fuelPrices)
    .filter(([, price]) => Number.isFinite(price))
    .map(([label, price]) => ({
      label,
      price: Math.round(price * 100) / 100,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Admin "online" if lastSeenAt is newer than this (heartbeat runs every 60s while the app is open). */
const STATION_ONLINE_THRESHOLD_MS = 5 * 60 * 1000;
const QR_EXCEL_EPOCH = new Date(1899, 11, 30).getTime();

export function isStationUserOnline(account: Partial<StationAccount>): boolean {
  if (account.role !== "station") return false;
  if ((account.assignmentStatus ?? "active") !== "active") return false;
  if (account.presenceStatus && account.presenceStatus.toLowerCase() !== "online") return false;
  // If presenceStatus is explicitly "online" but lastSeenAt is missing, trust the explicit status.
  if (!account.lastSeenAt) return account.presenceStatus?.toLowerCase() === "online";

  const lastSeen = new Date(account.lastSeenAt);
  if (Number.isNaN(lastSeen.getTime())) return false;

  return Date.now() - lastSeen.getTime() <= STATION_ONLINE_THRESHOLD_MS;
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

function getQrNamePart(value: string | undefined): string {
  return (value ?? "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3)
    .padEnd(3, "X");
}

function getQrSerial(value: unknown): string | null {
  const date = toDate(value);
  if (!date) return null;

  const serial = (date.getTime() - QR_EXCEL_EPOCH) / 86400000;
  return Number.isFinite(serial) ? serial.toFixed(4) : null;
}

function normalizeFuelType(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function isFuelTypeCompatible(vehicleFuel: string | undefined, selectedFuel: string | undefined): boolean {
  const v = normalizeFuelType(vehicleFuel);
  const s = normalizeFuelType(selectedFuel);
  if (!v || !s) return true;

  // Exact or substring matches first.
  if (v === s) return true;
  if (v.includes(s) || s.includes(v)) return true;

  const isDiesel = (x: string) => x.includes("diesel");
  const isKerosene = (x: string) => x.includes("kerosene");
  const isGasolineCategory = (x: string) =>
    x.includes("gasoline") || x.includes("petrol") || x.includes("unleaded") || x.includes("regular") || x.includes("(91)") || x.includes("(95)") || x.includes("(97)") || x.includes("premium");

  // Diesel categories
  if (isDiesel(v)) return isDiesel(s);
  // Kerosene is distinct
  if (isKerosene(v)) return isKerosene(s);
  // Gasoline category (resident often stores "Gasoline", station uses "Regular/Unleaded (91)" etc.)
  if (isGasolineCategory(v)) return !isDiesel(s) && !isKerosene(s) && isGasolineCategory(s);

  // Unknown category: keep strict.
  return false;
}

// TODO [per-vehicle allocation]: Currently fuel allocation is account-level (one limit shared
// across all vehicles). To make it per-vehicle, store allocation inside each vehicle object:
//   vehicles: [{ type, plate, gasType, fuelAllocation: 20 }, ...]
// Then this function should accept a plate/vehicle index and read from that entry.
// The remaining fuel per vehicle can be calculated from transactions filtered by plate
// (transactions already record the plate field), so no extra Firestore field is needed
// for tracking usage — just sum transactions for the current cycle where plate matches.
function getResidentFuelAllocation(account: ResidentAccount | null | undefined): number {
  return asNumber(account?.fuelAllocation) ?? WEEKLY_FUEL_LIMIT;
}

function getResidentFuelWeekKey(account: ResidentAccount | null | undefined): string | undefined {
  return asString(account?.fuelWeekKey);
}

function getResidentFuelUsed(
  account: ResidentAccount | null | undefined,
  cycleKey = getResidentFuelCycleKey(account),
): number {
  const storedFuelUsed = asNumber(account?.fuelUsed) ?? 0;
  const storedWeekKey = getResidentFuelWeekKey(account);
  return storedWeekKey === cycleKey ? storedFuelUsed : 0;
}

function getResidentTransactionCycleKey(
  resident: ResidentAccount | null | undefined,
  transaction: DispenseTransaction,
): string {
  if (transaction.occurredAt) {
    return getResidentFuelCycleKey(resident, transaction.occurredAt);
  }

  if (transaction.createdAt) {
    return getResidentFuelCycleKey(resident, transaction.createdAt);
  }

  return "";
}

// TODO [per-vehicle allocation]: To calculate remaining fuel per vehicle, add a `plate`
// parameter and filter transactions by both cycleKey AND plate. Each transaction already
// stores the vehicle plate, so:
//   .filter(tx => tx.plate === targetPlate && getCycleKey(tx) === cycleKey)
function getResidentCycleTransactionLiters(
  resident: ResidentAccount | null | undefined,
  transactions: DispenseTransaction[],
  cycleKey = getResidentFuelCycleKey(resident),
): number {
  return roundLiters(
    transactions
      .filter((transaction) => getResidentTransactionCycleKey(resident, transaction) === cycleKey)
      .reduce((sum, transaction) => sum + transaction.liters, 0),
  );
}

function buildResidentAllocationSummary(
  resident: ResidentAccount | null | undefined,
  transactions: DispenseTransaction[],
): ResidentAllocationSummary {
  const currentCycleKey = getResidentFuelCycleKey(resident);
  const usedLiters = Math.max(
    getResidentFuelUsed(resident, currentCycleKey),
    getResidentCycleTransactionLiters(resident, transactions, currentCycleKey),
  );
  const fuelAllocation = getResidentFuelAllocation(resident);
  return {
    transactions,
    fuelAllocation,
    usedLiters,
    remainingLiters: Math.max(fuelAllocation - usedLiters, 0),
  };
}

async function fetchTransactionsByField(
  field: "residentUid" | "stationUid",
  uid: string,
): Promise<DispenseTransaction[]> {
  if (!uid) return [];

  const snapshot = await getDocs(query(
    collection(db, "transactions"),
    where(field, "==", uid),
    limit(500),
  ));

  return sortTransactions(
    snapshot.docs.map((item) => mapTransaction(item.id, item.data() as Record<string, unknown>)),
  );
}

async function recoverAssignedStationUserResult(
  input: AssignStationUserInput,
): Promise<AssignedStationUserResult | null> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const inviteSnapshot = await getDocs(query(
    collection(db, "stationInvites"),
    where("email", "==", normalizedEmail),
    ...(typeof input.stationDirectoryId === "string" && input.stationDirectoryId.trim()
      ? [where("stationDirectoryId", "==", input.stationDirectoryId)]
      : []),
    limit(1),
  ));

  const inviteDoc = inviteSnapshot.docs[0];
  if (inviteDoc) {
    const invite = mapStationInviteRecord(inviteDoc.id, inviteDoc.data() as Record<string, unknown>);
    if (invite) {
      return {
        uid: invite.uid,
        email: invite.email,
        firstName: invite.firstName ?? input.firstName ?? "",
        lastName: invite.lastName ?? input.lastName ?? "",
        stationDirectoryId: invite.stationDirectoryId,
        stationSourceId: invite.stationSourceId ?? 0,
        stationName: invite.stationName,
        assignedUserCount: 0,
        assignmentStatus: "pending",
        inviteStatus: invite.status,
        inviteEmailStatus: invite.emailStatus ?? "queued",
        inviteEmailError: invite.emailError ?? null,
        inviteDeliveryMethod: invite.deliveryMethod ?? "unknown",
        isNewUser: false,
        pendingInvite: {
          ...invite,
          firstName: invite.firstName ?? input.firstName ?? "",
          lastName: invite.lastName ?? input.lastName ?? "",
          stationSourceId: invite.stationSourceId ?? 0,
          stationName: invite.stationName,
          brand: invite.brand ?? "",
          barangay: invite.barangay ?? "",
          status: "pending",
          acceptUrl: invite.acceptUrl ?? "",
          deliveryMethod: invite.deliveryMethod ?? "unknown",
          emailStatus: invite.emailStatus ?? "queued",
          invitedAt: invite.invitedAt ?? new Date().toISOString(),
        },
      };
    }
  }

  const accountSnapshot = await getDocs(query(
    collection(db, "accounts"),
    where("email", "==", normalizedEmail),
    ...(typeof input.stationDirectoryId === "string" && input.stationDirectoryId.trim()
      ? [where("stationDirectoryId", "==", input.stationDirectoryId)]
      : []),
    limit(10),
  ));

  const candidates = accountSnapshot.docs
    .map((d) => mapAccount(d.id, d.data() as Record<string, unknown>))
    .filter((a): a is StationAccount => a != null && a.role === "station");

  const account =
    (typeof input.stationDirectoryId === "string" && input.stationDirectoryId.trim()
      ? candidates.find((a) => a.stationDirectoryId === input.stationDirectoryId)
      : candidates.find((a) => a.assignmentStatus === "pending")) ??
    candidates[0] ??
    null;

  if (!account) {
    return null;
  }

  return {
    uid: account.uid,
    email: account.email ?? normalizedEmail,
    firstName: account.firstName ?? input.firstName,
    lastName: account.lastName ?? input.lastName,
    stationDirectoryId: account.stationDirectoryId ?? input.stationDirectoryId ?? "",
    stationSourceId: account.stationSourceId ?? 0,
    stationName: account.stationName ?? "Station",
    assignedUserCount: 0,
    assignmentStatus: account.assignmentStatus ?? "active",
    inviteStatus: account.assignmentStatus ?? "active",
    inviteEmailStatus: "not-applicable",
    inviteEmailError: null,
    inviteDeliveryMethod: "unknown",
    isNewUser: false,
    pendingInvite: null,
  };
}

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const [accountsSnapshot, transactionsSnapshot, stationDirectorySnapshot] = await Promise.all([
    getDocs(collection(db, "accounts")),
    getDocs(query(collection(db, "transactions"), limit(1000))),
    getDocs(collection(db, "stationDirectory")),
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
  const stationDirectory = stationDirectorySnapshot.docs
    .map((item) => mapStationDirectoryRecord(item.id, item.data() as Record<string, unknown>))
    .filter((item): item is StationDirectoryRecord => item != null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return { residents, stations, admins, transactions, stationDirectory };
}

export async function fetchAccountByUid(uid: string): Promise<AccountRecord | null> {
  if (!uid) return null;

  const snapshot = await getDoc(doc(db, "accounts", uid));
  if (!snapshot.exists()) {
    return null;
  }

  return mapAccount(snapshot.id, snapshot.data() as Record<string, unknown>);
}

export async function fetchResidentAccount(uid: string): Promise<ResidentAccount | null> {
  const account = await fetchAccountByUid(uid);
  return account?.role === "resident" ? account : null;
}

export async function fetchStationAccount(uid: string): Promise<StationAccount | null> {
  const account = await fetchAccountByUid(uid);
  if (account?.role !== "station") return null;

  const directoryId = account.stationDirectoryId ?? account.uid;
  try {
    const snap = await getDoc(doc(db, "stationDirectory", directoryId));
    if (!snap.exists()) return account;
    const data = snap.data() as Record<string, unknown>;
    const fuelsRaw = data.fuels;
    const fuels = Array.isArray(fuelsRaw)
      ? fuelsRaw
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const label = typeof (item as { label?: unknown }).label === "string"
              ? (item as { label: string }).label
              : "";
            const capacityLiters = asNumber((item as { capacityLiters?: unknown }).capacityLiters) ?? 0;
            const price = asNumber((item as { price?: unknown }).price) ?? 0;
            const hasCurrentCapacity = (item as { currentCapacity?: unknown }).currentCapacity != null;
            // Backward-compat:
            // - Old docs used `dispensed` as "current inventory"
            // - New docs use `currentCapacity` as current inventory, and `dispensed` as lifetime total
            const currentCapacity =
              asNumber((item as { currentCapacity?: unknown }).currentCapacity) ??
              asNumber((item as { dispensed?: unknown }).dispensed) ??
              0;
            const dispensed =
              hasCurrentCapacity
                ? (asNumber((item as { dispensed?: unknown }).dispensed) ?? 0)
                : 0;
            return label.trim()
              ? { label: label.trim(), capacityLiters, price, currentCapacity, dispensed }
              : null;
          })
          .filter((v): v is { label: string; capacityLiters: number; price: number; currentCapacity: number; dispensed: number } => v != null)
      : [];

    // If account no longer carries fuel definitions, derive from stationDirectory.fuels
    const derivedAvailableFuels = fuels.map((f) => f.label);
    const derivedFuelCapacities = Object.fromEntries(fuels.map((f) => [f.label, f.capacityLiters]));
    const derivedFuelPrices = Object.fromEntries(fuels.map((f) => [f.label, f.price]));
    const derivedFuelInventory = Object.fromEntries(fuels.map((f) => [f.label, f.currentCapacity]));
    const derivedFuelDispensed = Object.fromEntries(fuels.map((f) => [f.label, f.dispensed]));
    const derivedFuelTotalDispensed = fuels.reduce((sum, f) => sum + (Number.isFinite(f.dispensed) ? f.dispensed : 0), 0);

    return {
      ...account,
      availableFuels:
        Array.isArray(account.availableFuels) && account.availableFuels.length > 0
          ? account.availableFuels
          : derivedAvailableFuels,
      fuelCapacities:
        account.fuelCapacities && Object.keys(account.fuelCapacities).length > 0
          ? account.fuelCapacities
          : derivedFuelCapacities,
      fuelPrices:
        account.fuelPrices && Object.keys(account.fuelPrices).length > 0
          ? account.fuelPrices
          : derivedFuelPrices,
      // Source of truth: stationDirectory.fuels[].currentCapacity
      fuelInventory: derivedFuelInventory,
      fuelDispensed:
        account.fuelDispensed && Object.keys(account.fuelDispensed).length > 0
          ? account.fuelDispensed
          : derivedFuelDispensed,
      fuelTotalDispensed:
        typeof account.fuelTotalDispensed === "number"
          ? account.fuelTotalDispensed
          : derivedFuelTotalDispensed,
    };
  } catch {
    return account;
  }
}

export async function fetchStationDirectory(): Promise<StationDirectoryRecord[]> {
  const [directorySnapshot, pinnedAccountsSnapshot] = await Promise.all([
    getDocs(collection(db, "stationDirectory")),
    getDocs(query(
      collection(db, "accounts"),
      where("role", "==", "station"),
    )),
  ]);

  const directoryRecords = directorySnapshot.docs
    .map((item) => mapStationDirectoryRecord(item.id, item.data() as Record<string, unknown>))
    .filter((item): item is StationDirectoryRecord => item != null);

  const stationAccounts = pinnedAccountsSnapshot.docs
    .map((item) => mapAccount(item.id, item.data() as Record<string, unknown>))
    .filter((item): item is StationAccount => item?.role === "station");

  const stationAccountsByDirectoryId = new Map<string, StationAccount>();
  stationAccounts.forEach((account) => {
    if (!account.stationDirectoryId) return;

    const existing = stationAccountsByDirectoryId.get(account.stationDirectoryId);
    if (!existing) {
      stationAccountsByDirectoryId.set(account.stationDirectoryId, account);
      return;
    }

    const existingUpdated = new Date(existing.updatedAt ?? existing.lastSeenAt ?? existing.registeredAt ?? 0).getTime();
    const nextUpdated = new Date(account.updatedAt ?? account.lastSeenAt ?? account.registeredAt ?? 0).getTime();
    if (nextUpdated >= existingUpdated) {
      stationAccountsByDirectoryId.set(account.stationDirectoryId, account);
    }
  });

  const enrichedDirectoryRecords = directoryRecords.map((record) => {
    const account = stationAccountsByDirectoryId.get(record.id);
    if (!account) return record;

    const officerName =
      [account.officerFirstName, account.officerLastName].filter(Boolean).join(" ").trim() ||
      record.officer;
    const liveBrandPrices = stationFuelPricesToBrandPrices(account.fuelPrices);

    return {
      ...record,
      name: account.stationName ?? record.name,
      brand: account.brand ?? record.brand,
      lat: asNumber(account.lat) ?? record.lat,
      lon: asNumber(account.lon) ?? record.lon,
      barangay: account.barangay ?? record.barangay,
      officer: officerName,
      status: account.status ?? account.presenceStatus ?? record.status,
      capacity:
        Object.values(account.fuelCapacities ?? {}).reduce((sum, value) => sum + value, 0) || record.capacity,
      brandPrices: liveBrandPrices.length > 0 ? liveBrandPrices : record.brandPrices,
    } satisfies StationDirectoryRecord;
  });

  // Build StationDirectoryRecord entries from station accounts that pinned their location
  const pinnedRecords: StationDirectoryRecord[] = pinnedAccountsSnapshot.docs
    .map((item, idx) => {
      const account = mapAccount(item.id, item.data() as Record<string, unknown>);
      if (account?.role !== "station") return null;

      const lat = asNumber(account.lat);
      const lon = asNumber(account.lon);
      if (lat == null || lon == null) return null;
      const officerName =
        [account.officerFirstName, account.officerLastName].filter(Boolean).join(" ").trim() || undefined;
      const data = {
        stationName: account.stationName,
        brand: account.brand,
        stationCode: account.stationCode,
        barangay: account.barangay,
        status: account.status ?? account.presenceStatus,
      };
      return {
        id: item.id,
        sourceId: account.stationSourceId ?? 90000 + idx,
        name: (data.stationName as string | undefined) || [(data.brand as string), "Station –", (data.stationCode as string)].filter(Boolean).join(" "),
        brand: (data.brand as string) || "",
        address: (data.barangay as string) || "",
        rating: null,
        hours: "See station",
        lat,
        lon,
        brandPrices: stationFuelPricesToBrandPrices(account.fuelPrices),
        barangay: data.barangay as string | undefined,
        officer: officerName,
        capacity: Object.values(account.fuelCapacities ?? {}).reduce((sum, value) => sum + value, 0) || undefined,
        status: (data.status as string) || "online",
      } satisfies StationDirectoryRecord;
    })
    .filter((r) => r !== null) as StationDirectoryRecord[];

  // Merge: pinned account records only added if their id isn't already in the directory
  const directoryIds = new Set(enrichedDirectoryRecords.map((r) => r.id));
  const merged = [
    ...enrichedDirectoryRecords,
    ...pinnedRecords.filter((r) => !directoryIds.has(r.id)),
  ];

  return merged.sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchResidentTransactions(uid: string): Promise<DispenseTransaction[]> {
  return fetchTransactionsByField("residentUid", uid);
}

export async function fetchStationTransactions(uid: string): Promise<DispenseTransaction[]> {
  return fetchTransactionsByField("stationUid", uid);
}

export async function fetchResidentAllocationSummary(uid: string): Promise<ResidentAllocationSummary> {
  const resident = await fetchResidentAccount(uid);
  let transactions: DispenseTransaction[] = [];

  try {
    transactions = await fetchResidentTransactions(uid);
  } catch {
    transactions = [];
  }

  return buildResidentAllocationSummary(resident, transactions);
}

export function subscribeResidentAllocationSummary(
  uid: string,
  onNext: (summary: ResidentAllocationSummary) => void,
  onError?: (error: Error) => void,
): () => void {
  if (!uid) {
    onNext(buildResidentAllocationSummary(null, []));
    return () => undefined;
  }

  let resident: ResidentAccount | null = null;
  let transactions: DispenseTransaction[] = [];
  let residentReady = false;
  let transactionsReady = false;

  const emitSummary = () => {
    if (!residentReady && !transactionsReady) return;
    onNext(buildResidentAllocationSummary(resident, transactions));
  };

  const unsubscribeResident = onSnapshot(
    doc(db, "accounts", uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        resident = null;
      } else {
        const account = mapAccount(snapshot.id, snapshot.data() as Record<string, unknown>);
        resident = account?.role === "resident" ? account : null;
      }

      residentReady = true;
      emitSummary();
    },
    (error) => {
      onError?.(error);
    },
  );

  const unsubscribeTransactions = onSnapshot(
    query(
      collection(db, "transactions"),
      where("residentUid", "==", uid),
      limit(500),
    ),
    (snapshot) => {
      transactions = sortTransactions(
        snapshot.docs.map((item) => mapTransaction(item.id, item.data() as Record<string, unknown>)),
      );
      transactionsReady = true;
      emitSummary();
    },
    (error) => {
      onError?.(error);
    },
  );

  return () => {
    unsubscribeResident();
    unsubscribeTransactions();
  };
}

export function subscribeResidentVehicleAllocationSummary(
  uid: string,
  plate: string,
  onNext: (summary: ResidentAllocationSummary) => void,
  onError?: (error: Error) => void,
): () => void {
  if (!uid) {
    onNext(buildResidentVehicleAllocationSummary(null, [], plate));
    return () => undefined;
  }

  let resident: ResidentAccount | null = null;
  let transactions: DispenseTransaction[] = [];
  let residentReady = false;
  let transactionsReady = false;

  const emitSummary = () => {
    if (!residentReady && !transactionsReady) return;
    onNext(buildResidentVehicleAllocationSummary(resident, transactions, plate));
  };

  const unsubscribeResident = onSnapshot(
    doc(db, "accounts", uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        resident = null;
      } else {
        const account = mapAccount(snapshot.id, snapshot.data() as Record<string, unknown>);
        resident = account?.role === "resident" ? account : null;
      }
      residentReady = true;
      emitSummary();
    },
    (error) => onError?.(error),
  );

  const unsubscribeTransactions = onSnapshot(
    query(
      collection(db, "transactions"),
      where("residentUid", "==", uid),
      limit(500),
    ),
    (snapshot) => {
      transactions = sortTransactions(
        snapshot.docs.map((item) => mapTransaction(item.id, item.data() as Record<string, unknown>)),
      );
      transactionsReady = true;
      emitSummary();
    },
    (error) => onError?.(error),
  );

  return () => {
    unsubscribeResident();
    unsubscribeTransactions();
  };
}

export function subscribeResidentAccount(
  uid: string,
  onNext: (resident: ResidentAccount | null) => void,
  onError?: (error: Error) => void,
): () => void {
  if (!uid) {
    onNext(null);
    return () => undefined;
  }

  return onSnapshot(
    doc(db, "accounts", uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onNext(null);
        return;
      }

      const account = mapAccount(snapshot.id, snapshot.data() as Record<string, unknown>);
      onNext(account?.role === "resident" ? account : null);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function resolveResidentFromQR(decoded: DecodedQR): Promise<ResolvedResidentScan | null> {
  if (decoded.uid) {
    const resident = await fetchResidentAccount(decoded.uid);
    if (resident) {
      const allocation = buildResidentAllocationSummary(resident, []);
      return {
        resident,
        transactions: allocation.transactions,
        fuelAllocation: allocation.fuelAllocation,
        usedLiters: allocation.usedLiters,
        remainingLiters: allocation.remainingLiters,
      };
    }
  }

  const residentsSnapshot = await getDocs(query(
    collection(db, "accounts"),
    where("role", "==", "resident"),
    limit(500),
  ));

  const candidates = residentsSnapshot.docs
    .map((item) => mapAccount(item.id, item.data() as Record<string, unknown>))
    .filter((item): item is ResidentAccount => item?.role === "resident");

  const matchingResidents = candidates.filter((item) => {
    const firstCodeMatches = getQrNamePart(item.firstName) === decoded.firstCode;
    const lastCodeMatches = getQrNamePart(item.lastName) === decoded.lastCode;
    const gasTypeMatches =
      !decoded.gasType ||
      !item.gasType ||
      normalizeFuelType(item.gasType) === normalizeFuelType(decoded.gasType);

    return firstCodeMatches && lastCodeMatches && gasTypeMatches;
  });

  const resident =
    matchingResidents.find((item) => getQrSerial(item.registeredAt) === decoded.serial) ??
    (decoded.plate
      ? matchingResidents.find((item) => (item.vehicles ?? []).some((v) => (v.plate || "").trim().toUpperCase() === decoded.plate)) ?? null
      : (matchingResidents.length === 1 ? matchingResidents[0] : null));

  if (!resident) {
    return null;
  }

  const allocation = await fetchResidentAllocationSummary(resident.uid);
  return {
    resident,
    transactions: allocation.transactions,
    fuelAllocation: allocation.fuelAllocation,
    usedLiters: allocation.usedLiters,
    remainingLiters: allocation.remainingLiters,
  };
}

export async function saveStationFuelSettings(
  uid: string,
  input: SaveStationFuelSettingsInput,
): Promise<StationAccount | null> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    throw new Error("You must be signed in as this station user to update fuel settings.");
  }

  const directoryId = uid;
  const prevSnap = await getDoc(doc(db, "stationDirectory", directoryId));
  const prevDispensedByFuel: Record<string, number> = {};
  if (prevSnap.exists()) {
    const prevData = prevSnap.data() as Record<string, unknown>;
    const prevFuels = Array.isArray(prevData.fuels) ? prevData.fuels : [];
    for (const item of prevFuels) {
      if (!item || typeof item !== "object") continue;
      const label = typeof (item as { label?: unknown }).label === "string" ? (item as { label: string }).label : "";
      if (!label.trim()) continue;
      // Only treat `dispensed` as lifetime if the doc is already on the new shape.
      const hasCurrentCapacity = (item as { currentCapacity?: unknown }).currentCapacity != null;
      const lifetime = hasCurrentCapacity ? (asNumber((item as { dispensed?: unknown }).dispensed) ?? 0) : 0;
      prevDispensedByFuel[label.trim()] = lifetime;
    }
  }

  const fuels = Object.keys(input.fuelInventory).map((label) => ({
    label,
    capacityLiters: Number(input.fuelCapacities[label] ?? 0),
    currentCapacity: Number(input.fuelInventory[label] ?? 0),
    dispensed: Number(prevDispensedByFuel[label] ?? 0),
    price: Number(input.fuelPrices[label] ?? 0),
  }));

  await updateDoc(doc(db, "stationDirectory", directoryId), {
    fuels,
    updatedAt: serverTimestamp(),
  });

  return fetchStationAccount(uid);
}

/** Keeps lastSeenAt fresh without overwriting manual presenceStatus (offline). */
export async function stampStationLastSeen(uid: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== uid) return;

  await setDoc(
    doc(db, "accounts", uid),
    {
      lastSeenAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function setStationPresenceStatus(
  uid: string,
  status: "online" | "offline",
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    throw new Error("You must be signed in as this station user to update presence.");
  }

  await setDoc(
    doc(db, "accounts", uid),
    {
      presenceStatus: status,
      lastSeenAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function recordDispenseTransaction(
  input: RecordDispenseTransactionInput,
): Promise<RecordDispenseTransactionResult> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== input.stationUid) {
    throw new Error("You must be signed in as this station user to record a dispense transaction.");
  }

  const liters = roundLiters(Number(input.liters));
  if (!Number.isFinite(liters) || liters <= 0) {
    throw new Error("Liters must be greater than zero.");
  }

  const [station, resident] = await Promise.all([
    fetchStationAccount(input.stationUid),
    fetchResidentAccount(input.residentUid),
  ]);

  if (!station) {
    throw new Error("Station account was not found.");
  }

  if (!resident) {
    throw new Error("Resident account was not found.");
  }

  const selectedFuel = input.fuelType.trim();
  const pricePerLiter = station.fuelPrices?.[selectedFuel];
  if (!Number.isFinite(pricePerLiter)) {
    throw new Error("Selected fuel is not configured for this station.");
  }

  const availableInventory = Number(station.fuelInventory?.[selectedFuel] ?? 0);
  if (availableInventory < liters) {
    throw new Error("Not enough station inventory for this dispense.");
  }

  const createdAt = new Date();
  const currentCycleKey = getResidentFuelCycleKey(resident, createdAt);
  // Use the specific vehicle plate/type from QR scan, falling back to first registered vehicle.
  const txPlate = input.plate?.trim().toUpperCase() || resident.vehicles?.[0]?.plate || "";
  const txVehicleType = input.vehicleType?.trim() || "";

  // Validate transaction fields match a registered vehicle (when vehicles[] is present).
  const matchedVehicle = txPlate ? getResidentVehicleByPlate(resident, txPlate) : null;
  if (matchedVehicle) {
    if (txVehicleType && matchedVehicle.type && txVehicleType.trim() !== matchedVehicle.type.trim()) {
      throw new Error("Vehicle type does not match the registered vehicle for this plate.");
    }
    if (!isFuelTypeCompatible(matchedVehicle.gasType, selectedFuel)) {
      throw new Error("Fuel type does not match the registered vehicle for this plate.");
    }
  } else if (Array.isArray(resident.vehicles) && resident.vehicles.length > 0 && txPlate) {
    throw new Error("Scanned plate is not registered under this resident account.");
  }

  const fuelAllocation = txPlate ? getResidentVehicleFuelAllocation(resident, txPlate) : getResidentFuelAllocation(resident);
  const usedLitersBefore = txPlate ? getResidentVehicleFuelUsed(resident, txPlate, currentCycleKey) : getResidentFuelUsed(resident, currentCycleKey);
  const remainingBefore = Math.max(fuelAllocation - usedLitersBefore, 0);
  if (liters > remainingBefore) {
    throw new Error("This fuel request exceeds the vehicle's remaining allocation.");
  }

  const amount = Math.round(liters * pricePerLiter * 100) / 100;
  const nextFuelInventory = {
    ...(station.fuelInventory ?? {}),
    [selectedFuel]: roundLiters(availableInventory - liters),
  };
  const nextFuelUsed = roundLiters(usedLitersBefore + liters);

  const transactionRef = doc(collection(db, "transactions"));
  const stationRef = doc(db, "accounts", station.uid);
  const residentRef = doc(db, "accounts", resident.uid);
  const stationDirectoryRef = doc(db, "stationDirectory", station.stationDirectoryId ?? station.uid);
  const batch = writeBatch(db);

  batch.set(transactionRef, {
    residentUid: resident.uid,
    stationUid: station.uid,
    stationId: station.stationDirectoryId ?? station.uid,
    residentName: getAccountDisplayName(resident),
    stationName: station.stationName ?? getAccountDisplayName(station),
    stationBrand: station.brand ?? "",
    residentBarangay: resident.barangay ?? "",
    stationBarangay: station.barangay ?? "",
    plate: txPlate,
    vehicleType: txVehicleType,
    liters,
    fuelType: selectedFuel,
    pricePerLiter,
    amount,
    totalPaid: amount,
    occurredAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    weekKey: getWeekKey(createdAt),
    status: "dispensed",
  });

  batch.update(stationRef, {
    fuelInventory: nextFuelInventory,
    updatedAt: serverTimestamp(),
  });

  // Update stationDirectory fuel stats (currentCapacity + lifetime dispensed).
  const directorySnap = await getDoc(stationDirectoryRef);
  if (directorySnap.exists()) {
    const dirData = directorySnap.data() as Record<string, unknown>;
    const fuelsRaw = Array.isArray(dirData.fuels) ? dirData.fuels : [];
    const nextFuels = fuelsRaw
      .map((item) => {
        if (!item || typeof item !== "object") return item;
        const label = typeof (item as { label?: unknown }).label === "string" ? (item as { label: string }).label.trim() : "";
        if (!label) return item;

        const hasCurrentCapacity = (item as { currentCapacity?: unknown }).currentCapacity != null;
        const currentCapacity =
          asNumber((item as { currentCapacity?: unknown }).currentCapacity) ??
          asNumber((item as { dispensed?: unknown }).dispensed) ??
          0;
        const lifetimeDispensed =
          hasCurrentCapacity
            ? (asNumber((item as { dispensed?: unknown }).dispensed) ?? 0)
            : 0;

        if (label !== selectedFuel) {
          // Normalize shape to include currentCapacity without changing semantics.
          return {
            ...item,
            currentCapacity,
            dispensed: lifetimeDispensed,
          };
        }

        return {
          ...item,
          currentCapacity: roundLiters(Math.max(currentCapacity - liters, 0)),
          dispensed: roundLiters(lifetimeDispensed + liters),
        };
      });

    batch.update(stationDirectoryRef, {
      fuels: nextFuels,
      updatedAt: serverTimestamp(),
    });
  }

  batch.update(residentRef, {
    ...(txPlate
      ? {
          vehicles: (resident.vehicles ?? []).map((v) => {
            if (normalizePlateKey(v.plate) !== normalizePlateKey(txPlate)) return v;
            return {
              ...v,
              fuelUsed: nextFuelUsed,
              fuelWeekKey: currentCycleKey,
            };
          }),
        }
      : {
          fuelUsed: nextFuelUsed,
          fuelWeekKey: currentCycleKey,
        }),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  return {
    transaction: {
      id: transactionRef.id,
      residentUid: resident.uid,
      stationUid: station.uid,
      stationId: station.stationDirectoryId ?? station.uid,
      residentName: getAccountDisplayName(resident),
      stationName: station.stationName ?? getAccountDisplayName(station),
      stationBrand: station.brand ?? "",
      residentBarangay: resident.barangay ?? "",
      stationBarangay: station.barangay ?? "",
      plate: txPlate,
      vehicleType: txVehicleType,
      liters,
      fuelType: selectedFuel,
      pricePerLiter,
      amount,
      totalPaid: amount,
      occurredAt: createdAt,
      createdAt,
      weekKey: getWeekKey(createdAt),
      status: "dispensed",
    },
    resident: {
      ...resident,
      fuelAllocation,
      ...(txPlate
        ? {
            vehicles: (resident.vehicles ?? []).map((v) => {
              if (normalizePlateKey(v.plate) !== normalizePlateKey(txPlate)) return v;
              return {
                ...v,
                fuelUsed: nextFuelUsed,
                fuelWeekKey: currentCycleKey,
              };
            }),
          }
        : {
            fuelUsed: nextFuelUsed,
            fuelWeekKey: currentCycleKey,
          }),
      updatedAt: createdAt.toISOString(),
    },
    station: {
      ...station,
      fuelInventory: nextFuelInventory,
      updatedAt: createdAt.toISOString(),
    },
    usedLiters: nextFuelUsed,
    remainingLiters: Math.max(roundLiters(fuelAllocation - nextFuelUsed), 0),
  };
}

export async function assignStationUser(
  input: AssignStationUserInput,
): Promise<AssignedStationUserResult> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must be signed in as an admin to send station invites.");
  }

  const token = await currentUser.getIdToken();
  const response = await fetch(getAssignStationUserUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message;
    throw new Error(typeof message === "string" && message.trim()
      ? message
      : "Failed to send station invite.");
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Station invite returned an invalid response.");
  }

  const raw = payload as Record<string, unknown>;

  // Token + link + SMTP status (current Cloud Function contract)
  if (
    typeof raw.link === "string" &&
    typeof raw.token === "string" &&
    typeof raw.email === "string"
  ) {
    const emailStatus =
      raw.emailStatus === "sent" || raw.emailStatus === "failed" || raw.emailStatus === "queued"
        ? raw.emailStatus
        : "queued";
    const uid = typeof raw.uid === "string" ? raw.uid : "";
    return {
      uid,
      email: raw.email,
      firstName: typeof raw.firstName === "string" ? raw.firstName : (input.firstName ?? ""),
      lastName: typeof raw.lastName === "string" ? raw.lastName : (input.lastName ?? ""),
      stationDirectoryId: "",
      stationSourceId: 0,
      stationName: "Station Registration",
      assignedUserCount: 0,
      assignmentStatus: "pending",
      inviteStatus: "pending",
      inviteEmailStatus: emailStatus,
      inviteEmailError: typeof raw.emailError === "string" ? raw.emailError : null,
      inviteDeliveryMethod: "smtp-html",
      isNewUser: true,
      pendingInvite: null,
      link: raw.link,
      token: raw.token,
      expiresAt: typeof raw.expiresAt === "string" ? raw.expiresAt : undefined,
      emailStatus,
    };
  }

  const result = payload as Partial<AssignedStationUserResult>;
  if (
    typeof result.uid !== "string" ||
    typeof result.email !== "string" ||
    typeof result.stationDirectoryId !== "string" ||
    typeof result.stationName !== "string" ||
    typeof result.assignmentStatus !== "string"
  ) {
    const recovered = await recoverAssignedStationUserResult(input);
    if (recovered) {
      return recovered;
    }
    throw new Error("Assign station user returned an incomplete response.");
  }

  const normalized: AssignedStationUserResult = {
    uid: result.uid,
    email: result.email,
    firstName: typeof result.firstName === "string" ? result.firstName : (input.firstName ?? ""),
    lastName: typeof result.lastName === "string" ? result.lastName : (input.lastName ?? ""),
    stationDirectoryId: result.stationDirectoryId,
    stationSourceId: typeof result.stationSourceId === "number" ? result.stationSourceId : 0,
    stationName: result.stationName,
    assignedUserCount: typeof result.assignedUserCount === "number" ? result.assignedUserCount : 0,
    assignmentStatus: result.assignmentStatus,
    inviteStatus: typeof result.inviteStatus === "string" ? result.inviteStatus : result.assignmentStatus,
    inviteEmailStatus:
      typeof result.inviteEmailStatus === "string"
        ? result.inviteEmailStatus
        : result.assignmentStatus === "pending"
          ? "failed"
          : "not-applicable",
    inviteEmailError:
      result.assignmentStatus === "pending" && typeof result.inviteEmailStatus !== "string"
        ? "The deployed function returned an older invite response. Deploy the latest Functions and Hosting."
        : (typeof result.inviteEmailError === "string" ? result.inviteEmailError : null),
    inviteDeliveryMethod:
      typeof result.inviteDeliveryMethod === "string"
        ? result.inviteDeliveryMethod
        : result.assignmentStatus === "pending"
          ? "unknown"
          : "none",
    isNewUser: typeof result.isNewUser === "boolean" ? result.isNewUser : false,
    pendingInvite:
      result.pendingInvite && typeof result.pendingInvite === "object"
        ? {
            ...(result.pendingInvite as unknown as Record<string, unknown>),
            acceptUrl:
              typeof (result.pendingInvite as {acceptUrl?: unknown}).acceptUrl === "string"
                ? (result.pendingInvite as {acceptUrl: string}).acceptUrl
                : "",
          } as PendingInviteResponse
        : result.assignmentStatus === "pending"
          ? {
              id: result.uid,
              uid: result.uid,
              email: result.email,
              firstName: typeof result.firstName === "string" ? result.firstName : (input.firstName ?? ""),
              lastName: typeof result.lastName === "string" ? result.lastName : (input.lastName ?? ""),
              stationDirectoryId: result.stationDirectoryId,
              stationSourceId: typeof result.stationSourceId === "number" ? result.stationSourceId : 0,
              stationName: result.stationName,
              brand: "",
              barangay: "",
              status: "pending",
              acceptUrl: "",
              deliveryMethod:
                typeof result.inviteDeliveryMethod === "string" ? result.inviteDeliveryMethod : "unknown",
              emailStatus:
                typeof result.inviteEmailStatus === "string" ? result.inviteEmailStatus : "failed",
              invitedAt: new Date().toISOString(),
              emailError:
                typeof result.inviteEmailStatus === "string"
                  ? (typeof result.inviteEmailError === "string" ? result.inviteEmailError : null)
                  : "The deployed function returned an older invite response. Deploy the latest Functions and Hosting.",
            }
          : null,
  };

  return normalized;
}

export async function validateStationRegistrationToken(token: string): Promise<{expiresAt: string}> {
  const trimmed = token.trim();
  if (!trimmed) throw new Error("No registration token provided.");

  const response = await fetch(getValidateStationRegistrationTokenUrl(trimmed), {method: "GET"});
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message;
    throw new Error(typeof message === "string" && message.trim() ? message : "Token validation failed.");
  }
  if (!payload || typeof payload !== "object") {
    throw new Error("Token validation returned an invalid response.");
  }
  if ((payload as {valid?: unknown}).valid === true) {
    const expiresAt = (payload as {expiresAt?: unknown}).expiresAt;
    if (typeof expiresAt !== "string" || !expiresAt.trim()) {
      throw new Error("Token validation returned an invalid expiry.");
    }
    return {expiresAt};
  }
  const reason = (payload as {reason?: unknown}).reason;
  throw new Error(typeof reason === "string" && reason.trim()
    ? reason
    : "Invalid registration token.");
}

export async function finalizeStationRegistrationToken(registrationToken: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("You must be signed in to finalize registration.");
  const token = await currentUser.getIdToken();

  const response = await fetch(getFinalizeStationRegistrationUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({token: registrationToken}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message;
    throw new Error(typeof message === "string" && message.trim() ? message : "Failed to finalize registration.");
  }
}

export async function acceptPendingStationAssignment(uid: string): Promise<boolean> {
  const accountRef = doc(db, "accounts", uid);
  const accountSnap = await getDoc(accountRef);
  if (!accountSnap.exists()) {
    return false;
  }

  const data = accountSnap.data() as Record<string, unknown>;
  if (data.role !== "station" || data.assignmentStatus !== "pending") {
    return false;
  }

  const inviteRef = doc(db, "stationInvites", uid);
  const inviteSnap = await getDoc(inviteRef);
  if (inviteSnap.exists()) {
    const inviteData = inviteSnap.data() as Record<string, unknown>;
    const expiresAtRaw = inviteData.expiresAt;
    const expiresAt =
      expiresAtRaw instanceof Timestamp
        ? expiresAtRaw.toDate()
        : typeof expiresAtRaw === "string"
          ? new Date(expiresAtRaw)
          : null;
    if (expiresAt && Number.isFinite(expiresAt.getTime()) && Date.now() > expiresAt.getTime()) {
      // Invite expired — admin must resend to reset expiry.
      return false;
    }
  }

  await updateDoc(accountRef, {
    assignmentStatus: "active",
    inviteAcceptedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (inviteSnap.exists()) {
    await updateDoc(inviteRef, {
      status: "accepted",
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return true;
}
