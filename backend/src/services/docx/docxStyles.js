const { AlignmentType, HeadingLevel, convertMillimetersToTwip } = require('docx');
const documentSpec = require('../document/documentSpec');

/**
 * Standard DOCX Styles & Typography Configurations
 * Conforming strictly to academic research standards:
 * - A4 Page: 210mm x 297mm
 * - Margins: 25mm Top, Bottom, Left, Right
 * - Arabic Font: Amiri
 * - Headings: 18pt / 17pt Bold
 * - Body: 16pt Normal
 * - Footnotes: 12pt Normal (Black Markers)
 */
const docxStyles = {
  page: {
    size: {
      width: convertMillimetersToTwip(documentSpec.dimensions.widthMm || 210), // 210mm
      height: convertMillimetersToTwip(documentSpec.dimensions.heightMm || 297) // 297mm
    },
    margin: {
      top: convertMillimetersToTwip(documentSpec.margins.topMm || 25), // 25mm
      bottom: convertMillimetersToTwip(documentSpec.margins.bottomMm || 25), // 25mm
      left: convertMillimetersToTwip(documentSpec.margins.leftMm || 25), // 25mm
      right: convertMillimetersToTwip(documentSpec.margins.rightMm || 25) // 25mm
    }
  },
  fonts: {
    primary: 'Amiri',
    headings: 'Amiri'
  },
  sizes: {
    cover: 40, // 20pt
    mainHeading: 36, // 18pt
    subHeading: 34, // 17pt
    body: 32, // 16pt
    footnote: 24, // 12pt
    pageNumber: 24 // 12pt
  },
  colors: {
    primary: '000000',
    dark: '000000',
    black: '000000',
    titleGreen: '0F766E',
    muted: '334155',
    border: 'CBD5E1'
  }
};

module.exports = docxStyles;
