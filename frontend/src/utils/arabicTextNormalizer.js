/**
 * Arabic Text Normalizer for spell checking and typo detection.
 * This normalization is strictly for comparison purposes and should NOT be used
 * to replace the user's original text directly.
 */

// Regex for Arabic Diacritics (Tashkeel)
const TASHKEEL_REGEX = /[\u0617-\u061A\u064B-\u0652]/g;
// Regex for Tatweel (Kashida)
const TATWEEL_REGEX = /\u0640/g;

/**
 * Normalizes an Arabic word for fuzzy comparison.
 * - Removes diacritics
 * - Removes tatweel
 * - Normalizes Alef forms (أ, إ, آ) -> ا
 * - Normalizes Teh Marbuta (ة) -> ه
 * - Normalizes Alef Maksura (ى) -> ي (or vice versa, but consistent)
 * @param {string} text - The input Arabic text
 * @returns {string} The normalized text
 */
export const normalizeArabicForComparison = (text) => {
  if (!text) return '';

  return text
    // Remove Tashkeel
    .replace(TASHKEEL_REGEX, '')
    // Remove Tatweel
    .replace(TATWEEL_REGEX, '')
    // Normalize Alef
    .replace(/[أإآ]/g, 'ا')
    // Normalize Teh Marbuta to Heh
    .replace(/ة/g, 'ه')
    // Normalize Alef Maksura to Yeh
    .replace(/ى/g, 'ي');
};

/**
 * Normalizes punctuation and spaces to cleanly extract words.
 * @param {string} text 
 * @returns {string[]}
 */
export const extractArabicWords = (text) => {
  if (!text) return [];
  // Match contiguous Arabic characters
  const words = text.match(/[\u0621-\u064A\u0660-\u0669]+/g);
  return words || [];
};

/**
 * Checks if a word consists solely of Arabic letters.
 * @param {string} word 
 * @returns {boolean}
 */
export const isArabicWord = (word) => {
  return /^[\u0621-\u064A\u0660-\u0669]+$/.test(word);
};
