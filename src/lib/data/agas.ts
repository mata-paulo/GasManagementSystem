import {
  GeoPoint,
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { AuthUser } from "@/lib/auth/authService";
import { auth, db } from "@/lib/firebase/client";

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
      status: typeof data.status === "string" ? data.status : undefined,
    };
  }

  if (role === "station") {
    return {
      ...base,
      role,
      brand: typeof data.brand === "string" ? data.brand : undefined,
      barangay: typeof data.barangay === "string" ? data.barangay : undefined,
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

const STATION_ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

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

export async function fetchStationDirectory(): Promise<StationDirectoryRecord[]> {
  const snapshot = await getDocs(collection(db, "stationDirectory"));
  return snapshot.docs
    .map((item) => mapStationDirectoryRecord(item.id, item.data() as Record<string, unknown>))
    .filter((item): item is StationDirectoryRecord => item != null)
    .sort((a, b) => a.sourceId - b.sourceId);
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
