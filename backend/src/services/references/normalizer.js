/**
 * Reference Normalizer
 * Rule: Strip volume (ج / جزء / مجلد) and page (ص / صفحة / صـ) numbers while retaining 
 * the exact user footnote text without adding, inferring, or dropping content.
 */

/**
 * Strips volume and page citations from Arabic reference strings,
 * while strictly retaining all surrounding user-written text.
 *
 * @param {string} str - Raw reference or footnote string
 * @returns {string} - Clean string without volume and page numbers
 */
function stripVolumeAndPage(str) {
  if (!str || typeof str !== 'string') return '';
  let res = str;

  // 1. Parenthesized combined volume/page citations:
  // e.g. (ج 1 / ص 566), (ج1، ص424), (1/424), (جـ 3، صـ 187), (ص 424), (ج 1), (الجزء 1، ص 50)
  const parenVolPage = /\(\s*(?:(?:ال(?:جزء|مجلد)|جزء|مجلد|مج|جـ|ج)[\s\:\/\.\-–]*(?:[\d\u0660-\u0669]+|الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|الحادي\s*عشر|الثاني\s*عشر)[\s\d\-–\u0660-\u0669]*|[,\s،\/\.\-–]*|(?:ال(?:صفحة)|صفحة|ص\s*ص|ص\.ص|صـ|ص)[\s\:\/\.\-–]*(?:[\d\u0660-\u0669]+)[\s\d\-–\u0660-\u0669]*(?:\s*(?:وما\s*بعدها|فما\s*بعدها|وما\s*يليها|وما\s*بعده|فما\s*بعد))?|[\d\u0660-\u0669]+[\s]*\/[\s]*[\d\u0660-\u0669]+)+\s*\)/gi;
  res = res.replace(parenVolPage, '');

  // 2. Combined slash volume/page: 1/424 or (1/424) or ج1/ص424
  const slashVolPage = /(?:^|[^\u0600-\u06FF])(?:(?:ج|جزء)\s*)?[\d\u0660-\u0669]+[\s]*\/[\s]*(?:(?:ص|صفحة)\s*)?[\d\u0660-\u0669]+/gi;
  res = res.replace(slashVolPage, (match) => {
    return match[0].match(/[\u0600-\u06FF]/) ? match : '';
  });

  // 3. Volume patterns:
  // Examples: ج 1, ج1, ج: 1, ج/ 1, جزء 1, الجزء 1, الجزء الأول, مجلد 2, المجلد 2, مج 1, جـ 3, ج١
  const volPattern = /(?:^|[^\u0600-\u06FF])(?:ال(?:جزء|مجلد)|جزء|مجلد|مج|جـ|ج)(?:[\s\:\/\.\-–]*[\d\u0660-\u0669]+|[\s\:\/\.\-–]+(?:الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|الحادي\s*عشر|الثاني\s*عشر)[\s\d\-–\u0660-\u0669]*)/gi;
  res = res.replace(volPattern, (match) => {
    return match[0].match(/[\u0600-\u06FF]/) ? match : '';
  });

  // 4. Page patterns:
  // Examples: ص 566, ص566, ص: 566, ص/ 566, ص. 566, صـ 566, ص ص 566, ص.ص 566, صفحة 566, الصفحة 566, ص 50-55, ص 566 وما بعدها, ص٤٢٤
  const pagePattern = /(?:^|[^\u0600-\u06FF])(?:ال(?:صفحة)|صفحة|ص\s*ص|ص\.ص|صـ|ص)(?:[\s\:\/\.\-–]*[\d\u0660-\u0669]+)[\s\d\-–\u0660-\u0669]*(?:\s*(?:وما\s*بعدها|فما\s*بعدها|وما\s*يليها|وما\s*بعده|فما\s*بعد))?/gi;
  res = res.replace(pagePattern, (match) => {
    return match[0].match(/[\u0600-\u06FF]/) ? match : '';
  });

  // Clean empty parentheses or brackets left behind
  res = res.replace(/\(\s*\)/g, '');
  res = res.replace(/\[\s*\]/g, '');

  // Clean double commas or lingering punctuation inside
  res = res.replace(/[,،]\s*[,،]+/g, '، ');
  res = res.replace(/[,،]\s+/g, '، ');
  res = res.replace(/[ ]{2,}/g, ' ');

  // Clean trailing and leading punctuation, dots, dashes, commas
  res = res.replace(/[,،\s\.\-–]+$/, '').replace(/^[،,\s\.\-–]+/, '').trim();

  return res;
}

/**
 * Format reference item for bibliography rendering:
 * Strictly returns stripped displayText or book without inventing separators or fields.
 */
function formatReferenceForDisplay(ref) {
  if (!ref) return '';
  if (typeof ref === 'string') return stripVolumeAndPage(ref);
  const text = ref.displayText || ref.book || '';
  return stripVolumeAndPage(text);
}

/**
 * Generates normalized string key for deduplication comparison
 */
function generateNormalizedKey(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u0640]/g, '') // diacritics & tatweel
    .replace(/[أإآٱء]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\w\u0600-\u06FF]/g, '') // strip punctuation and whitespace for key comparison
    .trim();
}

/**
 * Normalizes a reference object or footnote text, removing volume and page
 * while preserving the user's written text verbatim (including repetitions).
 */
function normalizeReference(rawRef) {
  if (!rawRef) return null;

  let rawFootnote = '';
  let sourceText = '';

  if (typeof rawRef === 'string') {
    rawFootnote = rawRef;
    sourceText = rawRef;
  } else {
    rawFootnote = rawRef.rawFootnote || rawRef.text || '';
    sourceText = rawRef.displayText || rawRef.book || rawRef.text || rawRef.rawFootnote || '';
  }

  // Remove leading marker numbering if present like (1) or [1] or 1.
  let text = sourceText.replace(/^\s*(?:\(\d+\)|\[\d+\]|\d+[\.\-\)]\s*)/, '').trim();

  // Strip ONLY volume and page indications
  const cleanText = stripVolumeAndPage(text);
  if (!cleanText) return null;

  const normalizedKey = generateNormalizedKey(cleanText);

  return {
    book: cleanText,
    author: (rawRef && typeof rawRef === 'object' && rawRef.author) ? stripVolumeAndPage(rawRef.author) : '',
    publisher: (rawRef && typeof rawRef === 'object' && rawRef.publisher) ? stripVolumeAndPage(rawRef.publisher) : '',
    city: (rawRef && typeof rawRef === 'object' && rawRef.city) ? stripVolumeAndPage(rawRef.city) : '',
    edition: (rawRef && typeof rawRef === 'object' && rawRef.edition) ? stripVolumeAndPage(rawRef.edition) : '',
    year: (rawRef && typeof rawRef === 'object' && rawRef.year) ? stripVolumeAndPage(rawRef.year) : '',
    displayText: cleanText,
    normalizedKey,
    rawFootnote: rawFootnote || text
  };
}

module.exports = {
  stripVolumeAndPage,
  normalizeReference,
  formatReferenceForDisplay,
  generateNormalizedKey
};
