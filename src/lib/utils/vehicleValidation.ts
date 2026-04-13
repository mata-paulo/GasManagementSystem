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
 * Philippine plate number: any 2–7 ASCII alphanumeric characters.
 * Covers all LTO formats after separators are removed (e.g. ABC1234, FA03101, 1234567).
 */
export function isValidPlate(value: string): boolean {
  const stripped = value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  return /^[A-Z0-9]{2,7}$/.test(stripped);
}

/**
 * Sanitizes a plate number input on every keystroke:
 * - Uppercases
 * - Strips anything that isn't ASCII alphanumeric
 * - Caps at 7 alphanumeric characters (max Philippine plate length)
 */
export function sanitizePlate(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
}

/**
 * Returns an error message if the plate is invalid, or null if it's fine.
 * Skips validation entirely for generator serial numbers.
 */
export function plateError(plate: string, vehicleType: string): string | null {
  if (isGeneratorType(vehicleType)) return null;
  const trimmed = plate.trim();
  if (!trimmed) return "Please enter the plate number.";
  if (!/^[A-Z0-9]+$/i.test(trimmed)) return "Plate can only contain letters and numbers (no spaces or symbols).";
  if (!isValidPlate(trimmed)) return "Plate must be 2–7 alphanumeric characters (e.g. ABC1234).";
  return null;
}

/**
 * Strips ALL non-alphanumeric characters for duplicate comparison.
 * Example: "ABC1234" stays "ABC1234". Use when checking if two plates are the same vehicle.
 */
export function normalizePlateForComparison(plate: string): string {
  return plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

/**
 * Formats a plate for canonical storage: strips all separators, uppercase.
 * Example: "ABC1234" → "ABC1234", "FA0-3101" → "FA03101"
 */
export function formatPlateForStorage(plate: string): string {
  return plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}
