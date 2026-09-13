const { toArabicIndicDigits } = require('../document/arabic');
const {
  detectAcademicLevel,
  hasMabhathLevel,
  getHighestAcademicLevel,
  formatAcademicHeadingTitle,
  ACADEMIC_LEVELS
} = require('../document/academicHierarchy');

/**
 * Deterministic Table of Contents Builder & Pagination Stabilizer
 * Generates structured TOC data model with multi-pass pagination convergence.
 *
 * CRITICAL FIX: TOC entries are generated from LOGICAL headings only.
 * Continuation pages (isContinuation === true) NEVER produce new TOC entries.
 * ONE logical heading = ONE TOC entry pointing to the starting page number.
 */
class TOCBuilder {
  /**
   * Generates structured TOC entries from paginated research document pages.
   * Continuation pages are explicitly skipped — only the FIRST page of each
   * logical section contributes a TOC entry.
   *
   * @param {Array} pages - Paginated document representation
   * @returns {Array<{title, level, pageNumber, targetId, anchorId}>}
   */
  static generateTOCEntries(pages = []) {
    const toc = [];
    const hasMabhath = hasMabhathLevel(pages);

    // Track which logical headings we've already emitted to avoid duplication
    const seenHeadingIds = new Set();

    pages.forEach((page) => {
      // Cover is never in TOC
      if (page.pageType === 'cover') return;

      // CRITICAL: skip continuation pages — they do NOT produce separate TOC entries
      if (page.isContinuation === true) return;

      const targetId = page.anchorId || `page-${page.pageNumber}`;

      if (page.pageType === 'introduction') {
        const headingId = 'introduction';
        if (seenHeadingIds.has(headingId)) return;
        seenHeadingIds.add(headingId);

        toc.push({
          title: 'المقدمة وخطة البحث',
          level: 1,
          pageNumber: page.pageNumber,
          targetId,
          anchorId: targetId
        });

      } else if (page.pageType === 'topic') {
        const topicHeadingId = page.topicId || page.structureNodeId || targetId;

        // Inspect page blocks on the first page of this topic
        if (page.blocks && Array.isArray(page.blocks)) {
          page.blocks.forEach((block, bIdx) => {
            const bLevel = detectAcademicLevel(block);
            if (bLevel === ACADEMIC_LEVELS.MABHATH) {
              const mbId = `mabhath-${block.text}`;
              if (!seenHeadingIds.has(mbId)) {
                seenHeadingIds.add(mbId);
                toc.push({
                  title: block.text,
                  level: 1,
                  pageNumber: page.pageNumber,
                  targetId: mbId,
                  anchorId: targetId
                });
              }
            } else if (bLevel === ACADEMIC_LEVELS.MATALAB) {
              const mId = topicHeadingId;
              if (!seenHeadingIds.has(mId)) {
                seenHeadingIds.add(mId);
                toc.push({
                  title: block.text,
                  level: hasMabhath ? 2 : 1,
                  pageNumber: page.pageNumber,
                  targetId: mId,
                  anchorId: targetId
                });
              }
            } else if (bLevel === ACADEMIC_LEVELS.BRANCH || block.type === 'h2') {
              const branchId = block.blockId || `${topicHeadingId}-branch-${bIdx}`;
              if (!seenHeadingIds.has(branchId)) {
                seenHeadingIds.add(branchId);
                toc.push({
                  title: block.text,
                  level: hasMabhath ? 3 : 2,
                  pageNumber: page.pageNumber,
                  targetId: branchId,
                  anchorId: targetId
                });
              }
            }
          });
        }

      } else if (page.pageType === 'conclusion') {
        const headingId = 'conclusion';
        if (seenHeadingIds.has(headingId)) return;
        seenHeadingIds.add(headingId);

        toc.push({
          title: 'الخاتمة',
          level: 1,
          pageNumber: page.pageNumber,
          targetId,
          anchorId: targetId
        });

      } else if (page.pageType === 'references') {
        const headingId = 'references';
        if (seenHeadingIds.has(headingId)) return;
        seenHeadingIds.add(headingId);

        toc.push({
          title: 'المصادر والمراجع',
          level: 1,
          pageNumber: page.pageNumber,
          targetId,
          anchorId: targetId
        });

      } else if (page.pageType === 'toc') {
        const headingId = 'toc';
        if (seenHeadingIds.has(headingId)) return;
        seenHeadingIds.add(headingId);

        toc.push({
          title: 'فهرس الموضوعات',
          level: 1,
          pageNumber: page.pageNumber,
          targetId,
          anchorId: targetId
        });
      }
    });

    return toc;
  }

  /**
   * Multi-pass pagination stabilizer to guarantee TOC page number stability
   * @param {Function} paginationFn - Function that produces pages given a TOC
   * @param {number} maxIterations - Maximum recalculation passes
   * @returns {{pages: Array, toc: Array}}
   */
  static stabilizeTOC(paginationFn, maxIterations = 5) {
    let currentTOC = [];
    let pages = [];

    for (let pass = 0; pass < maxIterations; pass++) {
      pages = paginationFn(currentTOC);
      const newTOC = TOCBuilder.generateTOCEntries(pages);

      // Check if page numbers are identical between passes
      const isStable =
        currentTOC.length === newTOC.length &&
        newTOC.every((entry, idx) => entry.pageNumber === currentTOC[idx]?.pageNumber);

      currentTOC = newTOC;

      if (isStable && pass > 0) {
        break;
      }
    }

    return { pages, toc: currentTOC };
  }

  /**
   * Format TOC for rendering with Arabic numbers
   */
  static formatTOCForDisplay(tocEntries = []) {
    return tocEntries.map((entry) => ({
      ...entry,
      pageNumberAr: toArabicIndicDigits(entry.pageNumber)
    }));
  }
}

module.exports = TOCBuilder;
