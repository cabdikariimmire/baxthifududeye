/**
 * Centralized Font Selection System for Academic Research Content
 * 
 * Defines the canonical fonts supported by the platform.
 * The default font is the current website font (Amiri).
 * Font changes apply ONLY from 'المقدمة والخطة' onward and NEVER affect the Cover.
 */

const RESEARCH_FONTS = [
  {
    id: 'default',
    key: 'default',
    name: 'الخط الافتراضي للموقع (Amiri)',
    nameEn: 'Default / Current Website Font',
    family: "'Amiri', serif",
    cssValue: "'Amiri', serif",
    isDefault: true
  },
  {
    id: 'times-new-roman',
    key: 'times-new-roman',
    name: 'Times New Roman',
    nameEn: 'Times New Roman',
    family: "'Times New Roman', Times, serif",
    cssValue: "'Times New Roman', Times, serif",
    isDefault: false
  },
  {
    id: 'arial',
    key: 'arial',
    name: 'Arial',
    nameEn: 'Arial',
    family: "Arial, Helvetica, sans-serif",
    cssValue: "Arial, Helvetica, sans-serif",
    isDefault: false
  },
  {
    id: 'simplified-arabic',
    key: 'simplified-arabic',
    name: 'Simplified Arabic',
    nameEn: 'Simplified Arabic',
    family: "'Simplified Arabic', 'Traditional Arabic', Tahoma, sans-serif",
    cssValue: "'Simplified Arabic', 'Traditional Arabic', Tahoma, sans-serif",
    isDefault: false
  }
];

const ALLOWED_FONT_IDS = RESEARCH_FONTS.map((f) => f.id);
const DEFAULT_FONT_ID = 'default';

/**
 * Validates if the given font ID is in the allowed list
 * @param {string} fontId 
 * @returns {boolean}
 */
function isValidFontId(fontId) {
  if (!fontId) return false;
  const normalized = normalizeFontId(fontId);
  return ALLOWED_FONT_IDS.includes(normalized);
}

/**
 * Normalizes input font string to canonical ID
 * @param {string} fontId
 * @returns {string}
 */
function normalizeFontId(fontId) {
  if (!fontId) return DEFAULT_FONT_ID;
  const s = String(fontId).trim().toLowerCase().replace(/[\s_]+/g, '-');
  if (s === 'amiri' || s === 'default' || s === 'default-font') return 'default';
  if (s === 'times' || s === 'times-new-roman') return 'times-new-roman';
  if (s === 'arial') return 'arial';
  if (s === 'simplified-arabic' || s === 'simplified') return 'simplified-arabic';
  return s;
}

/**
 * Retrieves the font configuration for a given font ID with safe fallback.
 * Strictly prevents CSS injection by returning only whitelist definitions.
 * @param {string} fontId
 * @returns {Object} Font configuration object
 */
function getFontConfig(fontId) {
  if (!fontId) return RESEARCH_FONTS[0];
  const normalized = normalizeFontId(fontId);
  const found = RESEARCH_FONTS.find((f) => f.id === normalized);
  return found || RESEARCH_FONTS[0]; // Always fallback to Default / Current Website Font
}

module.exports = {
  RESEARCH_FONTS,
  ALLOWED_FONT_IDS,
  DEFAULT_FONT_ID,
  isValidFontId,
  normalizeFontId,
  getFontConfig
};
