import {Timestamp} from "firebase-admin/firestore";

const RESIDENT_FUEL_CYCLE_MS = 7 * 24 * 60 * 60 * 1000;
const QR_EXCEL_EPOCH = new Date(1899, 11, 30).getTime();
const LITERS_SCALE = 10 ** 4;

export function roundLiters(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return n;
  return Math.round(n * LITERS_SCALE) / LITERS_SCALE;
}

export function getWeekKey(date: Date): string {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  const year = start.getFullYear();
  const month = String(start.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(start.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}

function toDate(value: unknown): Date | undefined {
  if (value == null) return undefined;
  if (value instanceof Timestamp) {
    const d = value.toDate();
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

/** Excel serial date → Date (same anchor as frontend `agas.ts`). */
function dateFromQrSerial(value: unknown): Date | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const ms = value * 86400000 + QR_EXCEL_EPOCH;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function registeredAtToDate(data: Record<string, unknown>): Date | undefined {
  const direct = toDate(data.registeredAt);
  if (direct) return direct;
  return dateFromQrSerial(data.registeredAt as number);
}

export function getResidentFuelCycleKey(
  uid: string,
  registeredAt: Date | undefined,
  date: Date,
): string {
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
  return `${uid}:${cycleIndex}`;
}

export function getResidentTransactionCycleKey(
  uid: string,
  registeredAt: Date | undefined,
  occurredAt: Date | undefined,
  createdAt: Date | undefined,
): string {
  const txDate = occurredAt ?? createdAt;
  if (!txDate) return "";
  return getResidentFuelCycleKey(uid, registeredAt, txDate);
}

export function parseTransactionDoc(
  data: Record<string, unknown>,
): {liters: number; occurredAt?: Date; createdAt?: Date} {
  const liters = roundLiters(Number(data.liters) || 0);
  return {
    liters,
    occurredAt: toDate(data.occurredAt),
    createdAt: toDate(data.createdAt),
  };
}
