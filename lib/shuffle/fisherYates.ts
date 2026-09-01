/**
 * Fisher-Yates (Knuth) Shuffle Algorithm
 * Ensures an unbiased, uniformly distributed permutation of array elements.
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Shuffles question options while preserving unique option IDs and correct keys.
 */
export function shuffleOptions<T extends { id: string; text: string }>(options: T[]): T[] {
  return fisherYatesShuffle(options);
}
