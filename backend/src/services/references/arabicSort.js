/**
 * Arabic Reference Sorting & Grouping Utility
 * Dedicated academic sorting module supporting 'ال' prefix handling,
 * diacritics stripping, Alef variants normalization, and deterministic alphabetical ordering.
 */

const ARABIC_DIACRITICS_REGEX = /[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g;
const ARABIC_TATWEEL = /\u0640/g;

/**
 * Returns the text representation to sort by, preferring author if available.
 * @param {object} ref - Reference object
 * @returns {string} - Target text for sorting
 */
function getReferenceSortTarget(ref, options = {}) {
  if (!ref) return '';
  if (typeof ref === 'string') return ref;

  if (options.sortBy === 'book') {
    return (ref.book || ref.displayText || ref.author || '').trim();
  }

  // Prefer author/name field if the existing data model identifies it
  if (ref.author && typeof ref.author === 'string' && ref.author.trim()) {
    const authorTrimmed = ref.author.trim();
    const bookTrimmed = (ref.book || '').trim();
    return bookTrimmed ? `${authorTrimmed} ${bookTrimmed}` : authorTrimmed;
  }

  return (ref.book || ref.displayText || '').trim();
}

/**
 * Generates a normalized sorting key for Arabic bibliographic entries
 * @param {string} text - Raw title or author name
 * @param {object} options - Config options { ignoreAl: true }
 * @returns {string} - Clean sort key
 */
function getArabicSortKey(text, options = { ignoreAl: true }) {
  if (!text || typeof text !== 'string') return '';
  let str = text.trim();

  // Strip diacritics & tatweel
  str = str.replace(ARABIC_DIACRITICS_REGEX, '').replace(ARABIC_TATWEEL, '');

  // Strip leading quotation marks, braces, brackets, and punctuation
  str = str.replace(/^["'«»()[\]{}.,،:;؛\s]+/, '').trim();

  // If ignoreAl is enabled, strip leading 'ال' (or 'وال', 'بال', 'كال', 'فال', 'لل') for sorting key ONLY
  if (options.ignoreAl !== false) {
    str = str.replace(/^(?:ال|وال|فال|بال|كال|لل)/, '');
  }

  // Normalize all Alef variants (أ, إ, آ, ٱ, ء) to simple 'ا' for consistent comparison
  str = str.replace(/[أإآٱء]/g, 'ا');

  // Normalize taa marbuta & alif maqsoora
  str = str.replace(/ة/g, 'ه');
  str = str.replace(/ى/g, 'ي');

  return str.trim();
}

/**
 * Returns the primary Arabic index letter for grouping
 * @param {string} text - Reference title or string
 * @param {object} options
 * @returns {string} - Single Arabic letter (e.g. 'أ', 'ب', 'ك')
 */
function getArabicFirstLetter(text, options = { ignoreAl: true }) {
  const sortKey = getArabicSortKey(text, options);
  if (!sortKey) return 'أخرى';

  const firstChar = sortKey.charAt(0);
  if (/[اأإآٱء]/.test(firstChar)) return 'أ';
  if (/[\u0621-\u064A]/.test(firstChar)) return firstChar;
  return 'أخرى';
}

/**
 * Compares two Arabic strings alphabetically using Arabic collation
 */
function compareArabic(a, b, options = { ignoreAl: true }) {
  const keyA = getArabicSortKey(a, options);
  const keyB = getArabicSortKey(b, options);
  const cmp = keyA.localeCompare(keyB, 'ar', { sensitivity: 'base' });
  if (cmp !== 0) return cmp;
  // Deterministic tie-breaker on original string
  return (a || '').localeCompare(b || '', 'ar');
}

/**
 * Sorts array of reference objects by Arabic alphabetical order
 * @param {Array<Object>} references
 * @param {object} options
 * @returns {Array<Object>}
 */
function sortReferencesArabic(references, options = { ignoreAl: true }) {
  if (!Array.isArray(references)) return [];
  return [...references].sort((a, b) => {
    const textA = getReferenceSortTarget(a, options);
    const textB = getReferenceSortTarget(b, options);
    return compareArabic(textA, textB, options);
  });
}

/**
 * Groups references into an object keyed by Arabic letter
 * e.g. { "أ": [...], "ب": [...], "ك": [...] }
 * Only letters containing references are present.
 * @param {Array<Object>} references
 * @param {object} options
 * @returns {Object.<string, Array<Object>>}
 */
function groupReferencesByArabicLetter(references, options = { ignoreAl: true }) {
  const sorted = sortReferencesArabic(references, options);
  const grouped = {};

  sorted.forEach((ref, index) => {
    const text = getReferenceSortTarget(ref, options);
    const letter = getArabicFirstLetter(text, options);

    if (!grouped[letter]) {
      grouped[letter] = [];
    }

    grouped[letter].push({
      ...ref,
      letterGroup: letter,
      order: index + 1
    });
  });

  return grouped;
}

/**
 * Formats a clean continuous numbered list for the bibliography
 * @param {Array<Object>} references
 * @param {object} options
 * @returns {Array<Object>}
 */
function formatContinuousBibliography(references, options = { ignoreAl: true }) {
  const sorted = sortReferencesArabic(references, options);
  return sorted.map((ref, idx) => ({
    ...ref,
    order: idx + 1,
    sortKey: getArabicSortKey(getReferenceSortTarget(ref, options), options)
  }));
}

module.exports = {
  getReferenceSortTarget,
  getArabicSortKey,
  getArabicFirstLetter,
  compareArabic,
  sortReferencesArabic,
  groupReferencesByArabicLetter,
  formatContinuousBibliography
};
