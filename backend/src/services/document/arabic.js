/**
 * Arabic RTL & Typography Utilities
 */

const arabicIndicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Convert western integer to Arabic-Indic digits (1 -> ١)
 */
function toArabicIndicDigits(num) {
  if (num === null || num === undefined) return '';
  return String(num).replace(/\d/g, (d) => arabicIndicDigits[parseInt(d, 10)]);
}

/**
 * Convert Arabic-Indic or ASCII digit string to standard integer
 */
function parseArabicIndicDigits(str) {
  if (str === null || str === undefined) return NaN;
  const normalized = String(str).replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  const digitsOnly = normalized.replace(/[^\d]/g, '');
  return digitsOnly ? parseInt(digitsOnly, 10) : NaN;
}

/**
 * Normalize Arabic text (remove excessive tatweel, normalize alef/ya/taa marbuta if needed)
 */
function normalizeArabicText(text) {
  if (!text) return '';
  return text
    .replace(/\u0640+/g, '') // remove tatweel / kashida
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width characters
    .trim();
}

/**
 * Format dotted leader string for Table of Contents (e.g. '..........')
 */
function createDottedLeader(length = 40) {
  return '.'.repeat(length);
}

module.exports = {
  toArabicIndicDigits,
  parseArabicIndicDigits,
  normalizeArabicText,
  createDottedLeader
};

