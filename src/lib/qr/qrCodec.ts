// QR encoding format: [FIRST 3 CHARS][LAST 3 CHARS][EXCEL_SERIAL]
// Example: JOHSMI46111.8560

const EXCEL_EPOCH = new Date(1899, 11, 30).getTime(); // Dec 30, 1899

export interface DecodedQR {
  firstCode: string;
  lastCode: string;
  serial: string;
  date: Date;
  gasType: string | null;
}

function namePart(name: string): string {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "");
  return clean.slice(0, 3).padEnd(3, "X");
}

export function encodeQR(firstName: string, lastName: string, isoTimestamp: string, gasType?: string): string {
  const fn = namePart(firstName);
  const ln = namePart(lastName);
  const serial = (new Date(isoTimestamp).getTime() - EXCEL_EPOCH) / 86400000;
  const base = `${fn}${ln}${serial.toFixed(4)}`;
  return gasType ? `${base}|${gasType}` : base;
}

export function decodeQR(encoded: string): DecodedQR | null {
  const [base, gasType] = encoded.trim().split("|");
  const match = base.match(/^([A-Z]{6})(\d+\.\d+)$/);
  if (!match) return null;
  const firstCode = match[1].slice(0, 3);
  const lastCode = match[1].slice(3, 6);
  const serial = parseFloat(match[2]);
  const date = new Date(EXCEL_EPOCH + serial * 86400000);
  return { firstCode, lastCode, serial: match[2], date, gasType: gasType || null };
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
