import {
  GeoPoint,
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { AuthUser } from "@/lib/auth/authService";
import { auth, db } from "@/lib/firebase/client";
import type { DecodedQR } from "@/lib/qr/qrCodec";

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
  fuelPrices?: Record<string, number>;
  assignmentStatus?: string;
  presenceStatus?: string;
  lastSeenAt?: string;
  assignedAt?: string;
  inviteAcceptedAt?: string;
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
  stationInvites: StationInviteRecord[];
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
  sourceId: number;
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

export interface StationInviteRecord {
  id: string;
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  stationDirectoryId: string;
  stationSourceId?: number;
  stationName: string;
  brand?: string;
  barangay?: string;
  status: "pending" | "accepted";
  deliveryMethod?: string;
  emailStatus?: string;
  invitedByUid?: string;
  invitedAt?: string;
  inviteSentAt?: string;
  acceptedAt?: string;
  emailError?: string;
  updatedAt?: string;
}

export interface PendingInviteResponse extends StationInviteRecord {
  firstName: string;
  lastName: string;
  stationSourceId: number;
  stationName: string;
  brand: string;
  barangay: string;
  status: "pending";
  deliveryMethod: string;
  emailStatus: string;
  invitedAt: string;
}

export interface AssignStationUserInput {
  stationDirectoryId: string;
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
}

export interface ResidentAllocationSummary {
  transactions: DispenseTransaction[];
  fuelAllocation: number;
  usedLiters: number;
  remainingLiters: number;
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

  if (import.meta.env.DEV && useEmulators) {
    return `http://127.0.0.1:5001/${projectId}/${region}/assignStationUser`;
  }

  if (import.meta.env.DEV && projectId) {
    return `https://${region}-${projectId}.cloudfunctions.net/assignStationUser`;
  }

  return "/api/assignStationUser";
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
  const sourceId = asNumber(data.sourceId);
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
    sourceId == null ||
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
    sourceId,
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

function mapStationInviteRecord(id: string, data: Record<string, unknown>): StationInviteRecord | null {
  const uid = asString(data.uid);
  const email = asString(data.email);
  const stationDirectoryId = asString(data.stationDirectoryId);
  const stationName = asString(data.stationName);
  const status = asString(data.status);

  if (
    uid == null ||
    email == null ||
    stationDirectoryId == null ||
    stationName == null ||
    (status !== "pending" && status !== "accepted")
  ) {
    return null;
  }

  return {
    id,
    uid,
    email,
    firstName: asString(data.firstName),
    lastName: asString(data.lastName),
    stationDirectoryId,
    stationSourceId: asNumber(data.stationSourceId),
    stationName,
    brand: asString(data.brand),
    barangay: asString(data.barangay),
    status,
    deliveryMethod: asString(data.deliveryMethod),
    emailStatus: asString(data.emailStatus),
    invitedByUid: asString(data.invitedByUid),
    invitedAt: toIsoString(data.invitedAt),
    inviteSentAt: toIsoString(data.inviteSentAt),
    acceptedAt: toIsoString(data.acceptedAt),
    emailError: asString(data.emailError),
    updatedAt: toIsoString(data.updatedAt),
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

const STATION_ONLINE_THRESHOLD_MS = 2 * 60 * 1000;
const QR_EXCEL_EPOCH = new Date(1899, 11, 30).getTime();

export function isStationUserOnline(account: Partial<StationAccount>): boolean {
  if (account.role !== "station") return false;
  if (account.assignmentStatus !== "active") return false;
  if (account.presenceStatus && account.presenceStatus.toLowerCase() !== "online") return false;
  if (!account.lastSeenAt) return false;

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

function getResidentCycleTransactionLiters(
  resident: ResidentAccount | null | undefined,
  transactions: DispenseTransaction[],
  cycleKey = getResidentFuelCycleKey(resident),
): number {
  return Math.round(
    transactions
      .filter((transaction) => getResidentTransactionCycleKey(resident, transaction) === cycleKey)
      .reduce((sum, transaction) => sum + transaction.liters, 0) * 100,
  ) / 100;
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
    where("stationDirectoryId", "==", input.stationDirectoryId),
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
    where("stationDirectoryId", "==", input.stationDirectoryId),
    limit(1),
  ));

  const accountDoc = accountSnapshot.docs[0];
  if (!accountDoc) {
    return null;
  }

  const account = mapAccount(accountDoc.id, accountDoc.data() as Record<string, unknown>);
  if (!account || account.role !== "station") {
    return null;
  }

  return {
    uid: account.uid,
    email: account.email ?? normalizedEmail,
    firstName: account.firstName ?? input.firstName,
    lastName: account.lastName ?? input.lastName,
    stationDirectoryId: account.stationDirectoryId ?? input.stationDirectoryId,
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
  const [accountsSnapshot, transactionsSnapshot, stationDirectorySnapshot, stationInvitesSnapshot] = await Promise.all([
    getDocs(collection(db, "accounts")),
    getDocs(query(collection(db, "transactions"), limit(1000))),
    getDocs(collection(db, "stationDirectory")),
    getDocs(collection(db, "stationInvites")),
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
    .sort((a, b) => a.sourceId - b.sourceId);
  const stationInvites = stationInvitesSnapshot.docs
    .map((item) => mapStationInviteRecord(item.id, item.data() as Record<string, unknown>))
    .filter((item): item is StationInviteRecord => item != null)
    .sort((a, b) => (b.invitedAt ?? "").localeCompare(a.invitedAt ?? ""));

  return { residents, stations, admins, transactions, stationDirectory, stationInvites };
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
  return account?.role === "station" ? account : null;
}

export async function fetchStationDirectory(): Promise<StationDirectoryRecord[]> {
  const snapshot = await getDocs(collection(db, "stationDirectory"));
  return snapshot.docs
    .map((item) => mapStationDirectoryRecord(item.id, item.data() as Record<string, unknown>))
    .filter((item): item is StationDirectoryRecord => item != null)
    .sort((a, b) => a.sourceId - b.sourceId);
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
      ? matchingResidents.find((item) => item.plate?.trim().toUpperCase() === decoded.plate) ?? null
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

  await updateDoc(doc(db, "accounts", uid), {
    availableFuels: Object.keys(input.fuelInventory),
    fuelInventory: input.fuelInventory,
    fuelCapacities: input.fuelCapacities,
    fuelPrices: input.fuelPrices,
    updatedAt: serverTimestamp(),
  });

  return fetchStationAccount(uid);
}

export async function recordDispenseTransaction(
  input: RecordDispenseTransactionInput,
): Promise<RecordDispenseTransactionResult> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== input.stationUid) {
    throw new Error("You must be signed in as this station user to record a dispense transaction.");
  }

  const liters = Math.round(Number(input.liters) * 100) / 100;
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
  const fuelAllocation = getResidentFuelAllocation(resident);
  const usedLitersBefore = getResidentFuelUsed(resident, currentCycleKey);
  const remainingBefore = Math.max(fuelAllocation - usedLitersBefore, 0);
  if (liters > remainingBefore) {
    throw new Error("This fuel request exceeds the resident's weekly allocation.");
  }

  const amount = Math.round(liters * pricePerLiter * 100) / 100;
  const nextFuelInventory = {
    ...(station.fuelInventory ?? {}),
    [selectedFuel]: Math.round((availableInventory - liters) * 100) / 100,
  };
  const nextFuelUsed = Math.round((usedLitersBefore + liters) * 100) / 100;

  const transactionRef = doc(collection(db, "transactions"));
  const stationRef = doc(db, "accounts", station.uid);
  const residentRef = doc(db, "accounts", resident.uid);
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
    plate: resident.plate ?? "",
    vehicleType: resident.vehicleType ?? "",
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

  batch.update(residentRef, {
    fuelUsed: nextFuelUsed,
    fuelWeekKey: currentCycleKey,
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
      plate: resident.plate ?? "",
      vehicleType: resident.vehicleType ?? "",
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
      fuelUsed: nextFuelUsed,
      fuelWeekKey: currentCycleKey,
      updatedAt: createdAt.toISOString(),
    },
    station: {
      ...station,
      fuelInventory: nextFuelInventory,
      updatedAt: createdAt.toISOString(),
    },
    usedLiters: nextFuelUsed,
    remainingLiters: Math.max(Math.round((fuelAllocation - nextFuelUsed) * 100) / 100, 0),
  };
}

export async function assignStationUser(
  input: AssignStationUserInput,
): Promise<AssignedStationUserResult> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must be signed in as an admin to assign station users.");
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
      : "Failed to assign station user.");
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Assign station user returned an invalid response.");
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
        ? result.pendingInvite
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

  await updateDoc(accountRef, {
    assignmentStatus: "active",
    inviteAcceptedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const inviteRef = doc(db, "stationInvites", uid);
  const inviteSnap = await getDoc(inviteRef);
  if (inviteSnap.exists()) {
    await updateDoc(inviteRef, {
      status: "accepted",
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return true;
}
