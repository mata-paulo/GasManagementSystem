/**
 * Computes Levenshtein edit distance between two strings.
 * Used to catch misspellings of banned/special vehicle type keywords.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

/**
 * Returns true if any word in `value` is within edit distance 2 of `keyword`
 * AND the word is at least half the length of the keyword (to avoid short false positives).
 */
function wordMatchesKeyword(value: string, keyword: string): boolean {
  const words = value.toLowerCase().trim().split(/\s+/);
  const minLen = Math.floor(keyword.length / 2);
  return words.some(
    (word) => word.length >= minLen && levenshtein(word, keyword) <= 2
  );
}

/** True if the vehicle type string resembles "container" (exact or misspelled). */
export function isContainerType(value: string): boolean {
  return wordMatchesKeyword(value, "container");
}

/** True if the vehicle type string resembles "generator" (exact or misspelled). */
export function isGeneratorType(value: string): boolean {
  return wordMatchesKeyword(value, "generator");
}

/**
 * Philippine plate number format: 2–4 letters, a dash, then 3–5 digits.
 * e.g. ABC-1234, AB-123, ABCD-12345
 * Returns true if valid.
 */
export function isValidPlate(value: string): boolean {
  return /^[A-Z]{2,4}-\d{3,5}$/.test(value.trim().toUpperCase());
}

/**
 * Sanitizes a plate number input on every keystroke:
 * - Uppercases
 * - Strips leading dashes or non-letter characters before the first letter
 * - Only allows letters, digits, and ONE dash
 * - Strips any character that isn't a letter, digit, or dash
 */
export function sanitizePlate(raw: string): string {
  // Convert spaces to dashes, then uppercase and strip anything that isn't a letter, digit, or dash
  let v = raw.replace(/ /g, "-").toUpperCase().replace(/[^A-Z0-9-]/g, "");
  // Remove leading dashes
  v = v.replace(/^-+/, "");
  // Keep only the first dash; remove any subsequent dashes
  const firstDash = v.indexOf("-");
  if (firstDash !== -1) {
    v = v.slice(0, firstDash + 1) + v.slice(firstDash + 1).replace(/-/g, "");
  }
  return v;
}

/**
 * Returns an error message if the plate is invalid, or null if it's fine.
 * Skips validation entirely for generator serial numbers.
 */
export function plateError(plate: string, vehicleType: string): string | null {
  if (isGeneratorType(vehicleType)) return null; // serial numbers have no fixed format
  const trimmed = plate.trim().toUpperCase();
  if (!trimmed) return "Please enter the plate number.";
  if (!isValidPlate(trimmed)) return "Plate number must follow the format: ABC-1234 (letters, dash, numbers).";
  return null;
}
