// QR encoding format: [FIRST 3 CHARS][LAST 3 CHARS][EXCEL_SERIAL]
// Example: JOHSMI46111.8560

const EXCEL_EPOCH = new Date(1899, 11, 30).getTime(); // Dec 30, 1899
const QR_PREFIX = "AGAS1";
const QR_UID_PREFIX = "AGAS_UID";

type RichQrPayload = {
  uid?: string;
  firstName: string;
  lastName: string;
  plate?: string;
  barangay?: string;
  vehicleType?: string;
  gasType?: string;
  fuelAllocation?: number;
  fuelUsed?: number;
  registeredAt: string;
};

export interface DecodedQR {
  firstCode: string;
  lastCode: string;
  serial: string;
  date: Date;
  gasType: string | null;
  uid: string | null;
  plate: string | null;
  firstName: string | null;
  lastName: string | null;
  barangay: string | null;
  vehicleType: string | null;
  registeredAt: string | null;
  fuelAllocation: number | null;
  fuelUsed: number | null;
}

function namePart(name: string): string {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "");
  return clean.slice(0, 3).padEnd(3, "X");
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeQR(
  firstName: string,
  lastName: string,
  isoTimestamp: string,
  gasType?: string,
  uid?: string,
  plate?: string,
  vehicleType?: string,
  barangay?: string,
  fuelAllocation?: number,
  fuelUsed?: number,
): string {
  if (uid) {
    return `${QR_UID_PREFIX}|${uid}`;
  }

  const payload: RichQrPayload = {
    uid,
    firstName,
    lastName,
    plate: plate?.trim().toUpperCase(),
    barangay: barangay?.trim(),
    vehicleType: vehicleType?.trim(),
    gasType: gasType?.trim(),
    fuelAllocation,
    fuelUsed,
    registeredAt: isoTimestamp,
  };

  return `${QR_PREFIX}|${toBase64Url(JSON.stringify(payload))}`;
}

export function decodeQR(encoded: string): DecodedQR | null {
  const trimmed = encoded.trim();

  if (trimmed.startsWith(`${QR_UID_PREFIX}|`)) {
    const uid = trimmed.slice(QR_UID_PREFIX.length + 1).trim();
    if (!uid) return null;

    return {
      firstCode: "",
      lastCode: "",
      serial: "",
      date: new Date(0),
      gasType: null,
      uid,
      plate: null,
      firstName: null,
      lastName: null,
      barangay: null,
      vehicleType: null,
      registeredAt: null,
      fuelAllocation: null,
      fuelUsed: null,
    };
  }

  if (trimmed.startsWith(`${QR_PREFIX}|`)) {
    const payloadPart = trimmed.slice(QR_PREFIX.length + 1);
    try {
      const parsed = JSON.parse(fromBase64Url(payloadPart)) as RichQrPayload;
      if (!parsed || typeof parsed !== "object" || !parsed.firstName || !parsed.lastName || !parsed.registeredAt) {
        return null;
      }

      const firstCode = namePart(parsed.firstName);
      const lastCode = namePart(parsed.lastName);
      const serial = (new Date(parsed.registeredAt).getTime() - EXCEL_EPOCH) / 86400000;
      const serialLabel = Number.isFinite(serial) ? serial.toFixed(4) : "";
      const date = new Date(parsed.registeredAt);
      if (!serialLabel || Number.isNaN(date.getTime())) return null;

      return {
        firstCode,
        lastCode,
        serial: serialLabel,
        date,
        gasType: parsed.gasType || null,
        uid: parsed.uid || null,
        plate: parsed.plate ? parsed.plate.trim().toUpperCase() : null,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        barangay: parsed.barangay || null,
        vehicleType: parsed.vehicleType || null,
        registeredAt: parsed.registeredAt,
        fuelAllocation: typeof parsed.fuelAllocation === "number" ? parsed.fuelAllocation : null,
        fuelUsed: typeof parsed.fuelUsed === "number" ? parsed.fuelUsed : null,
      };
    } catch {
      return null;
    }
  }

  const [base, gasType, uid, plate] = trimmed.split("|");
  const match = base.match(/^([A-Z]{6})(\d+\.\d+)$/);
  if (!match) return null;
  const firstCode = match[1].slice(0, 3);
  const lastCode = match[1].slice(3, 6);
  const serial = parseFloat(match[2]);
  const date = new Date(EXCEL_EPOCH + serial * 86400000);
  return {
    firstCode,
    lastCode,
    serial: match[2],
    date,
    gasType: gasType || null,
    uid: uid || null,
    plate: plate ? plate.trim().toUpperCase() : null,
    firstName: null,
    lastName: null,
    barangay: null,
    vehicleType: null,
    registeredAt: date.toISOString(),
    fuelAllocation: null,
    fuelUsed: null,
  };
}

export function formatDecodedDate(date: Date): string {
  return date.toLocaleString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}
