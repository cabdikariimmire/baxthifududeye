/**
 * Single Shared Document Specification for A4 Academic Research
 * Shared by Browser A4 Preview, PDF Generator, and Word DOCX Generator.
 */

const documentSpec = {
  pageSize: 'A4',
  dimensions: {
    widthMm: 210,
    heightMm: 297,
    aspectRatio: 210 / 297,
    pixelsAt96Dpi: {
      width: 794,
      height: 1123
    },
    dxfTwips: {
      width: 11906, // 210mm in twips (1/20th of a point)
      height: 16838 // 297mm in twips
    }
  },
  direction: 'rtl',
  language: 'ar-SA',
  margins: {
    topMm: 24,
    bottomMm: 24,
    rightMm: 25,
    leftMm: 25,
    twips: {
      top: 1361, // 24mm
      bottom: 1361,
      right: 1417, // 25mm
      left: 1417
    }
  },
  typography: require('./typography'),
  borders: {
    defaultBorderId: 'none',
    marginInsetMm: 8
  },
  footnotes: {
    separatorWidthMm: 38,
    separatorWidthPx: 130,
    // Measured occupied height of the browser A4 footnote header (container
    // spacing + separator) at 96 DPI. This is not a page-wide reservation;
    // it is deducted only on pages that actually own footnotes.
    separatorOccupiedHeightPt: 19.125,
    markerFormat: '(n)' // e.g. (1), (2), (3)
  }
};

module.exports = documentSpec;
