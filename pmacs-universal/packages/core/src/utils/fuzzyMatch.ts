/**
 * Fuzzy string matching utility
 * Replicates the FuzzyWuzzy behavior from original P-MACS
 */

import Fuse from 'fuse.js';

/**
 * Calculate similarity ratio between two strings (0-1)
 * Similar to fuzzywuzzy's ratio function
 */
export function similarityRatio(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const shorter = s1.length < s2.length ? s1 : s2;
    const longer = s1.length < s2.length ? s2 : s1;
    return shorter.length / longer.length;
  }

  // Levenshtein distance based similarity
  const matrix: number[][] = [];

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);

  return 1 - distance / maxLength;
}

/**
 * Check if two strings match with given threshold
 * Default threshold is 0.6 (60%) like original P-MACS
 */
export function fuzzyMatch(
  str1: string,
  str2: string,
  threshold: number = 0.6
): boolean {
  return similarityRatio(str1, str2) >= threshold;
}

/**
 * Find best matches in a list
 */
export function findBestMatches<T>(
  query: string,
  items: T[],
  key: keyof T | ((item: T) => string),
  threshold: number = 0.6,
  limit: number = 10
): Array<{ item: T; score: number }> {
  const getKey = typeof key === 'function' ? key : (item: T) => String(item[key]);

  const fuse = new Fuse(items, {
    keys: typeof key === 'function' ? [] : [key as string],
    getFn: typeof key === 'function' ? (item) => [getKey(item as T)] : undefined,
    threshold: 1 - threshold, // Fuse uses inverse threshold
    includeScore: true,
  });

  const results = fuse.search(query, { limit });

  return results
    .filter((r) => r.score !== undefined && r.score <= 1 - threshold)
    .map((r) => ({
      item: r.item,
      score: 1 - (r.score || 0),
    }));
}

/**
 * Normalize drug name for comparison
 * Handles common variations and typos
 */
export function normalizeDrugName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\b(mg|ml|mcg|iu|units?)\b/gi, '') // Remove common units
    .trim();
}

/**
 * Smart drug name matching that handles:
 * - Typos (Propfol -> Propofol)
 * - Partial names (Prop -> Propofol)
 * - Case variations
 * - Common abbreviations
 */
export function smartDrugMatch(
  query: string,
  drugName: string,
  threshold: number = 0.6
): boolean {
  const normalizedQuery = normalizeDrugName(query);
  const normalizedDrug = normalizeDrugName(drugName);

  // Exact match after normalization
  if (normalizedQuery === normalizedDrug) return true;

  // Query is contained in drug name (partial match)
  if (normalizedDrug.includes(normalizedQuery) && normalizedQuery.length >= 3) {
    return true;
  }

  // Fuzzy match
  return fuzzyMatch(normalizedQuery, normalizedDrug, threshold);
}

export default {
  similarityRatio,
  fuzzyMatch,
  findBestMatches,
  normalizeDrugName,
  smartDrugMatch,
};
