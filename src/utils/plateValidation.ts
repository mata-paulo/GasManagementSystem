/**
 * Plate number validation & canonicalization.
 *
 * Philippine plates are strictly ASCII A-Z + 0-9.
 * Separators (dash, space, underscore, dot) are allowed for readability but
 * stripped before storage. Any non-ASCII character (Cyrillic homoglyphs,
 * fullwidth digits/letters, etc.) is rejected outright to prevent
 * uniqueness bypass and injection attacks.
 */

/** Characters allowed as separators (stripped during canonicalization). */
const SEPARATOR_RE = /[\s\-_./\\&]+/g;

/** After stripping separators, only ASCII A-Z 0-9 should remain. */
const ASCII_ALNUM_ONLY = /^[A-Z0-9]+$/;

/**
 * Detects non-ASCII characters that could be homoglyph attacks.
 * Returns the first offending character, or null if clean.
 */
export function detectHomoglyph(plate: string): string | null {
  for (const ch of plate) {
    const code = ch.codePointAt(0) ?? 0;
    // Allow printable ASCII (space through tilde)
    if (code >= 0x20 && code <= 0x7e) continue;
    return ch;
  }
  return null;
}

/**
 * Canonicalize a plate for storage and uniqueness comparison.
 * - Trims whitespace
 * - Uppercases
 * - Strips separators (dash, space, underscore, dot, ampersand, slashes)
 * - Returns the canonical form or null if invalid
 */
export function canonicalizePlate(raw: string): string | null {
  const stripped = raw.trim().toUpperCase().replace(SEPARATOR_RE, "");
  if (!stripped) return null;
  if (!ASCII_ALNUM_ONLY.test(stripped)) return null;
  return stripped;
}

/**
 * Validate a plate string and return an error message, or null if valid.
 */
export function validatePlate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "Plate is required.";

  const homoglyph = detectHomoglyph(trimmed);
  if (homoglyph) {
    return `Plate contains an invalid character "${homoglyph}". Use only letters (A-Z) and numbers (0-9).`;
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
