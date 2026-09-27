/**
 * Layout Rules and Standard Academic A4 Constants
 */
const layoutRules = {
  pageSize: {
    widthMm: 210,
    heightMm: 297,
    aspectRatio: 210 / 297,
    pixelsAt96Dpi: {
      width: 794,
      height: 1123
    }
  },
  margins: {
    topMm: 25,
    bottomMm: 25,
    rightMm: 25,
    leftMm: 25
  },
  fonts: {
    primary: "'Amiri', 'Traditional Arabic', 'Scheherazade New', serif",
    headings: "'Cairo', 'Amiri', 'Tajawal', sans-serif"
  },
  typography: {
    coverUniversityPt: 16,
    coverTitlePt: 22,
    coverMetaPt: 14,
    h1Pt: 18,
    h2Pt: 16,
    h3Pt: 14,
    bodyPt: 14,
    footnotePt: 10,
    tocHeadingPt: 14,
    tocPagePt: 14,
    lineHeight: 1.6
  }
};

module.exports = layoutRules;
