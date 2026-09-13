const { Paragraph, TextRun, AlignmentType } = require('docx');
const docxStyles = require('./docxStyles');
const { toArabicIndicDigits } = require('../document/arabic');

/**
 * Creates the native Microsoft Word footnotes dictionary for `new Document({ footnotes: ... })`.
 *
 * TRUE ARABIC RTL WORD FOOTNOTE REQUIREMENTS:
 * - Footnote paragraph: RTL (<w:bidi/>), right-aligned
 * - Hanging indent: first line shows number (1), subsequent lines indent correctly
 * - Footnote marker text: black, 12pt Amiri, RTL run
 * - Footnote content text: black, 12pt Amiri, RTL run
 * - Footnote separator: RTL (handled via post-processing in docxGenerator)
 * - NO absolute positioning, text boxes, or fake paragraphs
 *
 * HANGING INDENT APPROACH FOR ARABIC RTL:
 * In RTL paragraphs, hanging indent means:
 *   - ind.right (start in RTL): offset to push the (1) marker to the right edge
 *   - ind.hanging: amount the body wraps back by (removes the marker width)
 * This replicates the native Arabic Word footnote behavior seen in the reference document.
 */
function createNativeFootnotesMap(footnotesList = []) {
  const map = {};

  // Twip conversion: 1cm = 567 twips
  // Marker "(1) " is roughly 4-5 characters, ~360 twips wide at 12pt Arabic
  const HANGING_INDENT = 360; // ~6.35mm hanging indent for the marker

  footnotesList.forEach((fn, idx) => {
    const id = fn.id !== undefined ? Number(fn.id) : (idx + 1);
    const rawText = fn.text || '';

    // Build the displayed marker string: use Arabic indicator digits matching the stored number
    const displayNum = fn.number || id;
    const markerText = `(${toArabicIndicDigits(displayNum)}) `;

    map[id] = {
      children: [
        new Paragraph({
          // TRUE RTL paragraph — sets <w:pPr><w:bidi/><w:jc w:val="right"/>
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { before: 40, after: 40, line: 300, lineRule: 'atLeast' },
          // Hanging indent for Arabic RTL footnotes:
          // rightIndent pushes the paragraph away from the page right edge,
          // hanging makes continuation lines indent by the marker width.
          indent: {
            // In RTL, "right" is the START side (where text begins)
            right: 0,
            hanging: HANGING_INDENT
          },
          children: [
            // Marker: bold, black, 12pt Amiri, RTL
            new TextRun({
              text: markerText,
              bold: true,
              font: docxStyles.fonts.primary,
              size: docxStyles.sizes.footnote, // 12pt = 24 half-points
              color: '000000',
              rightToLeft: true
            }),
            // Content: normal, black, 12pt Amiri, RTL
            new TextRun({
              text: rawText,
              bold: false,
              font: docxStyles.fonts.primary,
              size: docxStyles.sizes.footnote, // 12pt = 24 half-points
              color: '000000',
              rightToLeft: true
            })
          ]
        })
      ]
    };
  });

  return map;
}

/**
 * Legacy helper for simulated footnote body paragraphs (fallback only).
 * Not used when native footnotes are active.
 */
function createDocxFootnotes(footnotes = []) {
  if (!footnotes || footnotes.length === 0) return [];

  const elements = [];

  // Academic Separator Line — RIGHT-aligned RTL separator
  elements.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      spacing: { before: 240, after: 60 },
      children: [
        new TextRun({
          text: 'ــــــــــــــــــــ',
          color: '000000',
          font: docxStyles.fonts.primary,
          size: 24,
          rightToLeft: true
        })
      ]
    })
  );

  footnotes.forEach((fn, idx) => {
    const num = fn.number || idx + 1;
    const numAr = toArabicIndicDigits(num);
    const markerText = `(${numAr}) `;

    elements.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { before: 40, after: 40, line: 280 },
        indent: { right: 0, hanging: 360 },
        children: [
          new TextRun({
            text: markerText,
            bold: true,
            color: '000000',
            font: docxStyles.fonts.primary,
            size: docxStyles.sizes.footnote,
            rightToLeft: true
          }),
          new TextRun({
            text: fn.text || '',
            bold: false,
            color: '000000',
            font: docxStyles.fonts.primary,
            size: docxStyles.sizes.footnote,
            rightToLeft: true
          })
        ]
      })
    );
  });

  return elements;
}

module.exports = {
  createNativeFootnotesMap,
  createDocxFootnotes
};
