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
