/** Liters: 4 dp balances station pricing (2 dp) without the drift of 2 dp on volume. */
export const FUEL_LITERS_DECIMAL_PLACES = 4;

const LITERS_SCALE = 10 ** FUEL_LITERS_DECIMAL_PLACES;

export function roundLiters(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return n;
  return Math.round(n * LITERS_SCALE) / LITERS_SCALE;
}

/** Max 4 dp, trim trailing zeros (for UI and CSV). */
export function formatLitersQuantity(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const s = roundLiters(value).toFixed(FUEL_LITERS_DECIMAL_PLACES);
  return s.replace(/0+$/, "").replace(/\.$/, "") || "0";
}
