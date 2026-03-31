// QR encoding format: [FIRST 3 CHARS][LAST 3 CHARS][EXCEL_SERIAL]
// Example: JOHSMI46111.8560

const EXCEL_EPOCH = new Date(1899, 11, 30).getTime(); // Dec 30, 1899

function namePart(name) {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "");
  return clean.slice(0, 3).padEnd(3, "X");
}

export function encodeQR(firstName, lastName, isoTimestamp) {
  const fn = namePart(firstName);
  const ln = namePart(lastName);
  const serial = (new Date(isoTimestamp).getTime() - EXCEL_EPOCH) / 86400000;
  return `${fn}${ln}${serial.toFixed(4)}`;
}

export function decodeQR(encoded) {
  const match = encoded.trim().match(/^([A-Z]{6})(\d+\.\d+)$/);
  if (!match) return null;
  const firstCode = match[1].slice(0, 3);
  const lastCode = match[1].slice(3, 6);
  const serial = parseFloat(match[2]);
  const date = new Date(EXCEL_EPOCH + serial * 86400000);
  return { firstCode, lastCode, serial: match[2], date };
}

export function formatDecodedDate(date) {
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
