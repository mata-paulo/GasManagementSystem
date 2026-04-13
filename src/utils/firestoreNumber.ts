/**
 * Firestore Web SDK encodes `Number.isInteger(n)` as int64 and other finite numbers as double.
 * Use this when you want monetary/volume fields to consistently use doubleValue (e.g. exports,
 * emulator inspection) without changing arithmetic — non-integers pass through unchanged.
 *
 * Mirrors `toFirestoreDouble` in `functions/src/utils/validators.ts` (zero stays `0`).
 */
export function ensureFirestoreDouble(n: number): number {
  if (!Number.isFinite(n) || !Number.isInteger(n)) return n;
  if (n === 0) return 0;
  const buf = new Float64Array(1);
  buf[0] = n;
  const bytes = new Uint8Array(buf.buffer);
  let carry = 1;
  for (let i = 0; carry && i < 8; i++) {
    const sum = bytes[i] + carry;
    bytes[i] = sum & 0xff;
    carry = sum >> 8;
  }
  return buf[0];
}
