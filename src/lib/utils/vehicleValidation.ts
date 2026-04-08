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
 * - Converts spaces to dashes
 * - Uppercases, strips anything that isn't a letter, digit, or dash
 * - Enforces only ONE dash (strips subsequent ones)
 */
export function sanitizePlate(raw: string): string {
  let v = raw.replace(/ /g, "-").toUpperCase().replace(/[^A-Z0-9-]/g, "");
  v = v.replace(/^-+/, "");
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
  if (isGeneratorType(vehicleType)) return null;
  const trimmed = plate.trim().toUpperCase();
  if (!trimmed) return "Please enter the plate number.";
  if (!isValidPlate(trimmed)) return "Plate number must follow the format: ABC-1234 (letters, dash, numbers).";
  return null;
}

/**
 * Strips ALL non-alphanumeric characters for duplicate comparison.
 * "ABC-1234" → "ABC1234". Use when checking if two plates are the same vehicle.
 */
export function normalizePlateForComparison(plate: string): string {
  return plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

/**
 * Formats a plate for canonical storage: strips separators then inserts a
 * hyphen at the letter→digit boundary ("ABC 1234" → "ABC-1234").
 */
export function formatPlateForStorage(plate: string): string {
  const cleaned = plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const match = cleaned.match(/^([A-Z]+)([0-9]+)$/i);
  if (match) return `${match[1]}-${match[2]}`;
  return cleaned;
}
