import { normalizeArabicForComparison, isArabicWord, extractArabicWords } from './arabicTextNormalizer';
import { ARABIC_DICTIONARY, ARABIC_DICTIONARY_SET } from './arabicDictionary';
import { isAcademicTerm } from './academicTerms';
import { levenshteinDistance, calculateSimilarity } from './arabicSpellChecker';

/**
 * High-confidence threshold for suggestions.
 * e.g., 0.75 means 75% similarity.
 */
const SIMILARITY_THRESHOLD = 0.75;

/**
 * Helper to get a unique list of words from a context string/array.
 * @param {string|string[]} context 
 * @returns {Set<string>}
 */
const extractContextWords = (context) => {
  const words = new Set();
  if (!context) return words;

  if (typeof context === 'string') {
    extractArabicWords(context).forEach(w => words.add(w));
  } else if (Array.isArray(context)) {
    context.forEach(str => {
      extractArabicWords(str).forEach(w => words.add(w));
    });
  }
  return words;
};

/**
 * Finds the best suggestion for a given word.
 * Returns null if no good suggestion is found or if the word is already valid.
 * @param {string} word 
 * @param {string|string[]} projectContext - Context words from the project (e.g. existing titles)
 * @returns {string|null} - The suggested correct word, or null
 */
export const getBestSuggestion = (word, projectContext = '') => {
  if (!word || !isArabicWord(word)) return null;
  if (word.length <= 2) return null; // Too short to correct safely

  const normalizedInput = normalizeArabicForComparison(word);

  // 1. Is it already valid?
  if (ARABIC_DICTIONARY_SET.has(word) || ARABIC_DICTIONARY_SET.has(normalizedInput)) {
    return null;
  }
  if (isAcademicTerm(word) || isAcademicTerm(normalizedInput)) {
    return null;
  }

  const contextWordsSet = extractContextWords(projectContext);
  
  // Exclude the word itself from context check
  contextWordsSet.delete(word);
  
  // If normalized version exists in context, no need to correct (or maybe we suggest the exact context word? Let's leave as valid for now to be safe against over-correction)
  if (contextWordsSet.has(word)) {
    return null;
  }

  // Combine dictionary and context for search pool
  const searchPool = Array.from(new Set([...ARABIC_DICTIONARY, ...Array.from(contextWordsSet)]));

  let bestSuggestion = null;
  let highestSimilarity = 0;
  let lowestDistance = Infinity;

  for (const candidate of searchPool) {
    if (candidate.length <= 2) continue;

    const normalizedCandidate = normalizeArabicForComparison(candidate);
    
    // Quick length filter to optimize
    if (Math.abs(normalizedInput.length - normalizedCandidate.length) > 2) {
      continue;
    }

    const distance = levenshteinDistance(normalizedInput, normalizedCandidate);
    
    // We only care if edit distance is 1 or 2 for it to be a likely typo
    if (distance > 2) continue;

    const similarity = calculateSimilarity(normalizedInput, normalizedCandidate);

    if (similarity > highestSimilarity && similarity >= SIMILARITY_THRESHOLD) {
      highestSimilarity = similarity;
      lowestDistance = distance;
      bestSuggestion = candidate;
    } else if (similarity === highestSimilarity && similarity >= SIMILARITY_THRESHOLD) {
      // Tie breaker: prefer academic terms or context words over general dictionary
      if (isAcademicTerm(candidate) || contextWordsSet.has(candidate)) {
         bestSuggestion = candidate;
      }
    }
  }

  // If distance is 2, ensure it's a very long word to avoid false positives
  if (lowestDistance === 2 && normalizedInput.length <= 4) {
    return null;
  }

  return bestSuggestion;
};

/**
 * Analyzes a full text and returns a list of suggestions.
 * @param {string} text 
 * @param {string|string[]} projectContext 
 * @returns {Array<{original: string, suggestion: string, index: number, length: number}>}
 */
export const suggestCorrectionsForText = (text, projectContext = '') => {
  if (!text) return [];

  const results = [];
  const regex = /[\u0621-\u064A\u0660-\u0669]+/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const word = match[0];
    const suggestion = getBestSuggestion(word, projectContext);
    
    if (suggestion && suggestion !== word) {
      results.push({
        original: word,
        suggestion,
        index: match.index,
        length: word.length
      });
    }
  }

  return results;
};
