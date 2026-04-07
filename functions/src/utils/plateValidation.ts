/**
 * Plate number validation & canonicalization (backend mirror).
 *
 * Mirror of src/utils/plateValidation.ts for Cloud Functions use.
 * Philippine plates are strictly ASCII A-Z + 0-9.
 */

const SEPARATOR_RE = /[\s\-_./\\&]+/g;
const ASCII_ALNUM_ONLY = /^[A-Z0-9]+$/;

/** Detects non-ASCII characters (homoglyph attacks). Returns first offender or null. */
export function detectHomoglyph(plate: string): string | null {
  for (const ch of plate) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x20 && code <= 0x7e) continue;
    return ch;
  }
  return null;
}

/** Canonicalize plate for storage: uppercase, strip separators. Returns null if invalid. */
export function canonicalizePlate(raw: string): string | null {
  const stripped = raw.trim().toUpperCase().replace(SEPARATOR_RE, "");
  if (!stripped) return null;
  if (!ASCII_ALNUM_ONLY.test(stripped)) return null;
  return stripped;
}

/** Validate plate. Returns error message or null if valid. */
export function validatePlate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "Plate is required.";

  const homoglyph = detectHomoglyph(trimmed);
  if (homoglyph) {
    return `Plate contains an invalid character. Use only letters (A-Z) and numbers (0-9).`;
  }

  const canonical = canonicalizePlate(trimmed);
  if (!canonical) {
    return "Plate must contain only letters (A-Z) and numbers (0-9).";
  }

  if (canonical.length > 10) {
    return "Plate must be at most 10 characters.";
  }

  return null;
}
