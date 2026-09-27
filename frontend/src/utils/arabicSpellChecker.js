import { normalizeArabicForComparison } from './arabicTextNormalizer';

/**
 * Calculates the Levenshtein distance between two strings.
 * @param {string} a 
 * @param {string} b 
 * @returns {number}
 */
export const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

/**
 * Checks if two words are equivalent when normalized.
 * @param {string} word1 
 * @param {string} word2 
 * @returns {boolean}
 */
export const isEquivalent = (word1, word2) => {
  return normalizeArabicForComparison(word1) === normalizeArabicForComparison(word2);
};

/**
 * Calculates a similarity score based on edit distance and word length.
 * Closer to 1 means more similar.
 * @param {string} word1 
 * @param {string} word2 
 * @returns {number}
 */
export const calculateSimilarity = (word1, word2) => {
  const normalized1 = normalizeArabicForComparison(word1);
  const normalized2 = normalizeArabicForComparison(word2);
  
  if (normalized1 === normalized2) return 1;

  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  if (maxLength === 0) return 1;

  return 1 - (distance / maxLength);
};
