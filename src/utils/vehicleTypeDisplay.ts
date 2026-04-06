/**
 * Title-case each word for UI labels (e.g. `motorcycle` → `Motorcycle`, `pick up` → `Pick Up`).
 * ASCII/Unicode-safe; avoids regex word boundaries that miss non-Latin letters.
 */
export function formatVehicleTypeDisplayLabel(raw: unknown): string {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const first = word.charAt(0).toLocaleUpperCase("en-US");
      const rest = word.slice(1).toLocaleLowerCase("en-US");
      return first + rest;
    })
    .join(" ");
}
