/**
 * Unified Typography Configuration for Academic Arabic Research Documents
 * Hard Specifications:
 * - Cover: 20pt (DOCX: 40 half-points)
 * - Main Heading / المطلب (H1): 18pt (DOCX: 36 half-points)
 * - Subheading / الفرع (H2): 17pt (DOCX: 34 half-points)
 * - Paragraph Body: 16pt (DOCX: 32 half-points)
 * - Footnote: 12pt (DOCX: 24 half-points)
 * - Font Family: One consistent Arabic font family ('Amiri', serif) throughout.
 */

const TYPOGRAPHY = {
  fonts: {
    primary: 'Amiri',
    headings: 'Amiri',
    fallback: 'Traditional Arabic, Times New Roman, serif'
  },
  sizes: {
    cover: 20,          // 20pt
    heading: 18,        // 18pt - H1 (المقدمة، المطالب، الخاتمة، المراجع، الفهرس)
    subheading: 17,     // 17pt - H2 (الفروع، المباحث)
    body: 16,           // 16pt - الفقرات والنصوص الأكاديمية
    footnote: 12        // 12pt - نصوص الهوامش والحواشي السفلية
  },
  docxHalfPoints: {
    cover: 40,          // 20pt * 2
    heading: 36,        // 18pt * 2
    subheading: 34,     // 17pt * 2
    body: 32,           // 16pt * 2
    footnote: 24        // 12pt * 2
  },
  lineHeights: {
    body: 1.55,
    headings: 1.35,
    footnotes: 1.35
  },
  footnoteSeparator: {
    widthMm: 38,        // ~35-40mm (approx 130px)
    widthPx: 130,
    thicknessPt: 1.5,
    color: '#000000'
  }
};

module.exports = TYPOGRAPHY;
