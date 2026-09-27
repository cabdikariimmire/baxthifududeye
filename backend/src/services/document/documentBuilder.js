const TOCBuilder = require('../toc/tocBuilder');
const { toArabicIndicDigits, parseArabicIndicDigits } = require('./arabic');
const defaultBorders = require('./defaultBorders');
const documentSpec = require('./documentSpec');
const PaginationEngine = require('./paginationEngine');
const { deduplicateReferences } = require('../references/deduplicator');
const { normalizeReference, stripVolumeAndPage } = require('../references/normalizer');
const { sortReferencesArabic, formatContinuousBibliography } = require('../references/arabicSort');
const { resolveLogoUrl } = require('./logoResolver');
const { getFontConfig } = require('../../config/researchFonts');
const {
  detectAcademicLevel,
  hasMabhathLevel,
  getHighestAcademicLevel,
  formatAcademicHeadingTitle,
  resolveAcademicHeadingStyle,
  buildTopicViewModels,
  ACADEMIC_LEVELS
} = require('./academicHierarchy');

/**
 * Deterministic Document Builder
 * Transforms research state into a structured, paginated, ready-to-render A4 document
 * strictly conforming to the unified document specification.
 */
class DocumentBuilder {
  /**
   * Builds the complete paginated research document
   * @param {Object} research - Research Mongoose document or plain object
   * @param {Object} options - Custom border or template override
   * @returns {Object} { pages: Array, totalPages: number, toc: Array, border: Object, spec: Object }
   */
  static buildDocument(research = {}, options = {}) {
    const res = research || {};
    const pages = [];
    const paginationDiagnostics = [];
    let currentPageNumber = 1;
    const paginationEngine = new PaginationEngine(documentSpec);

    // 1. Resolve Border (Default is 'none')
    const borderId = options.borderId || res.borderId || 'none';
    const border = defaultBorders.getNormalizedBorder ? defaultBorders.getNormalizedBorder(borderId) : (defaultBorders.find((b) => b.borderId === borderId) || defaultBorders[0]);

    // 2. Resolve Research Font (Default is current website font 'default' / Amiri)
    const fontConfig = getFontConfig(options.fontFamily || res.fontFamily);

    // ==========================================
    // PAGE 1: الغلاف (Cover)
    // ==========================================
    pages.push({
      pageNumber: currentPageNumber,
      pageNumberAr: toArabicIndicDigits(currentPageNumber),
      pageType: 'cover',
      title: 'الغلاف',
      anchorId: `page-${currentPageNumber}`,
      data: {
        country: res.cover?.country || '',
        university: res.cover?.university || '',
        college: res.cover?.college || '',
        subject: res.cover?.subject || '',
        title: res.cover?.title || res.title || '',
        studentName: res.cover?.studentName || '',
        level: res.cover?.level || '',
        supervisor: res.cover?.supervisor || '',
        semester: res.cover?.semester || '',
        academicYear: res.cover?.academicYear || '',
        gregorianYear: res.cover?.gregorianYear || '',
        badgeColor: res.cover?.badgeColor || '#38761d',
        logoUrl: resolveLogoUrl(res.cover?.logoUrl),
        coverLayout: res.cover?.coverLayout || null
      }
    });
    currentPageNumber++;

    // ==========================================
    // PAGE 2+: المقدمة وخطة البحث (Introduction & Plan)
    // ==========================================
    let introFullText = res.introduction?.text || '';
    const introOpening = res.introduction?.opening || '';

    if (!introFullText.trim()) {
      introFullText = introOpening;
    } else if (introOpening && !introFullText.includes('الحمد لله رب العالمين')) {
      introFullText = `${introOpening}\n\n${introFullText}`;
    }

    const introParagraphs = introFullText
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);

    const introBlocks = [
      { type: 'h1', text: 'المقدمة وخطة البحث' },
      ...introParagraphs.map((p) => ({ type: 'paragraph', text: p }))
    ];

    const paginatedIntro = paginationEngine.paginateSection({
      sectionType: 'introduction',
      title: 'المقدمة وخطة البحث',
      h1Title: 'المقدمة وخطة البحث',
      status: 'complete',
      blocks: introBlocks,
      footnotes: [],
      startPageNumber: currentPageNumber
    });

    paginatedIntro.pages.forEach((p, idx) => {
      p.data = {
        title: 'المقدمة وخطة البحث',
        text: introFullText,
        content: introFullText,
        paragraphs: (p.blocks || []).filter((b) => b.type === 'paragraph').map((b) => b.text)
      };
      p.isContinuation = idx > 0;
    });

    pages.push(...paginatedIntro.pages);
    paginationDiagnostics.push(...(paginatedIntro.diagnostics || []));
    currentPageNumber = paginatedIntro.nextPageNumber;

    // ==========================================
    // PAGES 3+: المطالب وفروعها (Multi-Page Paginated Topics)
    // ==========================================
    const canonicalTopics = buildTopicViewModels(res);
    if (canonicalTopics && canonicalTopics.length > 0) {
      let lastMabhathId = null;
      let allAcademicBlocks = [];
      let allAcademicFootnotes = [];

      canonicalTopics.forEach((topic, topicIdx) => {
        const rawFns = topic.footnotes || [];
        const firstMarkerParsed = rawFns[0]?.marker ? parseArabicIndicDigits(rawFns[0].marker) : NaN;
        let baseNum = !isNaN(firstMarkerParsed) && firstMarkerParsed > 0 ? firstMarkerParsed : (rawFns[0]?.number || 1);
        if (isNaN(baseNum) || baseNum < 1) baseNum = 1;

        const topicFootnotes = rawFns.map((fn, idx) => {
          const fnId = fn.footnoteId || fn.id || `fn-${topic.structureNodeId || topic.topicId || topicIdx + 1}-${idx + 1}`;
          let fnNum = fn.originalNumber || fn.number;
          if (fn.marker) {
            const parsed = parseArabicIndicDigits(fn.marker);
            if (!isNaN(parsed) && parsed > 0) fnNum = parsed;
          }
          if (!fnNum || isNaN(fnNum)) fnNum = baseNum + idx;
          const marker = `(${fnNum})`;

          return {
            id: fnId,
            footnoteId: fnId,
            number: fnNum,
            originalNumber: fnNum,
            numberAr: toArabicIndicDigits(fnNum),
            marker,
            markerAr: `(${toArabicIndicDigits(fnNum)})`,
            text: fn.text || fn.rawText || '',
            source: fn.source || {},
            topicId: topic.structureNodeId || topic.topicId || `topic-${topicIdx + 1}`
          };
        });

        const hasMabhath = hasMabhathLevel([], res);
        const isNewMabhathGroup = !!(topic.mabhathId && topic.mabhathId !== lastMabhathId);
        if (topic.mabhathId) {
          lastMabhathId = topic.mabhathId;
        }

        let topicBlocks = topic.blocks && topic.blocks.length > 0 && topic.blocks.some((b) => {
          const lvl = detectAcademicLevel(b);
          return lvl === ACADEMIC_LEVELS.BRANCH || lvl === ACADEMIC_LEVELS.MATALAB || lvl === ACADEMIC_LEVELS.MABHATH;
        })
          ? topic.blocks
          : null;

        const topicTopLevel = detectAcademicLevel(topic.h1Title) || ACADEMIC_LEVELS.MATALAB;
        const formattedTopicH1 = topic.h1Title;

        if (!topicBlocks) {
          const rawText = topic.rawContent || '';
          if (rawText.trim()) {
            const lines = rawText.split('\n');
            topicBlocks = [{ type: topicTopLevel, text: formattedTopicH1 }];
            let currentParagraph = [];
            let bIdx = 0;

            const flushParagraph = () => {
              if (currentParagraph.length > 0) {
                const pText = currentParagraph.join('\n').trim();
                if (pText) {
                  topicBlocks.push({ type: 'paragraph', text: pText });
                }
                currentParagraph = [];
              }
            };

            lines.forEach((line) => {
              const trimmed = line.trim();
              if (!trimmed) {
                flushParagraph();
                return;
              }
              const lineLevel = detectAcademicLevel(trimmed);
              if (lineLevel === ACADEMIC_LEVELS.MABHATH || lineLevel === ACADEMIC_LEVELS.MATALAB || lineLevel === ACADEMIC_LEVELS.BRANCH) {
                flushParagraph();
                const formattedLine = formatAcademicHeadingTitle(trimmed, lineLevel, {
                  hasMabhath,
                  index: topicIdx,
                  branchIndex: bIdx++
                });
                topicBlocks.push({ type: lineLevel, text: formattedLine });
              } else {
                currentParagraph.push(line);
              }
            });

            flushParagraph();
          } else {
            topicBlocks = [
              { type: topicTopLevel, text: formattedTopicH1 },
              { type: 'paragraph', text: '' }
            ];
          }
        }

        // Filter or ensure Mabhath heading based on whether this is the start of a new Mabhath group
        const nonMabhathBlocks = (topicBlocks || []).filter((b) => detectAcademicLevel(b) !== ACADEMIC_LEVELS.MABHATH);
        let rawBlocksToNormalize = (isNewMabhathGroup && topic.mabhathTitle)
          ? [{ type: ACADEMIC_LEVELS.MABHATH, text: topic.mabhathTitle }, ...nonMabhathBlocks]
          : nonMabhathBlocks;

        // Unpack any embedded branch heading lines inside paragraph blocks
        const finalNormalizedBlocks = [];
        let branchIdx = 0;
        const topicBranches = topic.branches || [];

        rawBlocksToNormalize.forEach((block) => {
          if (!block || !block.text) return;
          const textTrim = block.text.trim();
          if (!textTrim) return;

          const level = detectAcademicLevel(block);
          // If already a single-line heading without newlines, keep it as heading
          if ((level === ACADEMIC_LEVELS.MABHATH || level === ACADEMIC_LEVELS.MATALAB || level === ACADEMIC_LEVELS.BRANCH) && !textTrim.includes('\n')) {
            let sNodeId = block.structureNodeId;
            let bId = block.blockId || block.id;
            if (level === ACADEMIC_LEVELS.BRANCH) {
              const matchedBranch = topicBranches.find(b => b.id === bId || b.id === sNodeId || b.title === textTrim || textTrim.includes(b.rawTitle || b.title)) || topicBranches[branchIdx++];
              if (matchedBranch) {
                sNodeId = matchedBranch.id;
                bId = matchedBranch.id;
              } else {
                sNodeId = sNodeId || `branch-${topic.structureNodeId}-${branchIdx}`;
                bId = bId || sNodeId;
              }
            } else {
              sNodeId = sNodeId || topic.structureNodeId;
              bId = bId || sNodeId;
            }
            finalNormalizedBlocks.push({ ...block, text: textTrim, structureNodeId: sNodeId, blockId: bId });
            return;
          }

          if (block.type === 'quote') {
            finalNormalizedBlocks.push(block);
            return;
          }

          const lines = block.text.split('\n');
          let currentParagraphLines = [];

          const flushPara = () => {
            if (currentParagraphLines.length > 0) {
              const pText = currentParagraphLines.join('\n').trim();
              if (pText) {
                finalNormalizedBlocks.push({ type: 'paragraph', text: pText });
              }
              currentParagraphLines = [];
            }
          };

          lines.forEach((line) => {
            const lineTrim = line.trim();
            if (!lineTrim) {
              flushPara();
              return;
            }

            const lineLevel = detectAcademicLevel(lineTrim);
            if (lineLevel === ACADEMIC_LEVELS.MABHATH || lineLevel === ACADEMIC_LEVELS.MATALAB || lineLevel === ACADEMIC_LEVELS.BRANCH) {
              flushPara();
              let sNodeId = topic.structureNodeId;
              let bId = `${topic.structureNodeId}-b-${finalNormalizedBlocks.length + 1}`;
              if (lineLevel === ACADEMIC_LEVELS.BRANCH) {
                const matchedBranch = topicBranches.find(b => b.title === lineTrim || lineTrim.includes(b.rawTitle || b.title)) || topicBranches[branchIdx++];
                if (matchedBranch) {
                  sNodeId = matchedBranch.id;
                  bId = matchedBranch.id;
                }
              }
              finalNormalizedBlocks.push({ type: lineLevel, text: lineTrim, structureNodeId: sNodeId, blockId: bId });
            } else {
              currentParagraphLines.push(line);
            }
          });

          flushPara();
        });

        // Ensure child branches from research.structure.tree are present if defined
        if (topicBranches.length > 0) {
          const hasAnyBranchBlock = finalNormalizedBlocks.some(b => detectAcademicLevel(b) === ACADEMIC_LEVELS.BRANCH);
          if (!hasAnyBranchBlock) {
            topicBranches.forEach((tb) => {
              finalNormalizedBlocks.push({
                type: ACADEMIC_LEVELS.BRANCH,
                text: tb.title,
                structureNodeId: tb.id,
                blockId: tb.id
              });
              if (tb.content) {
                finalNormalizedBlocks.push({
                  type: 'paragraph',
                  text: tb.content
                });
              }
            });
          }
        }

        topicBlocks = finalNormalizedBlocks;

        // Paginate each topic individually starting on a fresh A4 page
        const paginatedTopic = paginationEngine.paginateSection({
          sectionType: 'topic',
          title: topic.title || topic.h1Title,
          h1Title: topic.h1Title,
          topicId: topic.structureNodeId || topic.topicId,
          structureNodeId: topic.structureNodeId,
          topicOrder: topicIdx + 1,
          hasMabhath,
          mabhathTitle: isNewMabhathGroup ? topic.mabhathTitle : null,
          mabhathId: topic.mabhathId,
          status: topic.status || 'complete',
          blocks: topicBlocks,
          footnotes: topicFootnotes,
          startPageNumber: currentPageNumber
        });

        paginatedTopic.pages.forEach((p) => {
          p.topicOrder = topic.matlabOrder || topic.order || (topicIdx + 1);
        });

        pages.push(...paginatedTopic.pages);
        paginationDiagnostics.push(...(paginatedTopic.diagnostics || []));
        currentPageNumber = paginatedTopic.nextPageNumber;
      });
    }

    // ==========================================
    // NEXT PAGES: الخاتمة (Conclusion)
    // ==========================================
    const conclusionTitle = res.conclusion?.title || 'الخاتمة';
    const conclusionOpening =
      res.conclusion?.opening ||
      res.conclusion?.text ||
      '';
    const conclusionPoints =
      Array.isArray(res.conclusion?.points)
        ? res.conclusion.points.filter((pt) => pt && pt.trim())
        : [];

    const conclusionBlocks = [
      { type: 'h1', text: conclusionTitle },
      ...(conclusionOpening.trim() ? [{ type: 'paragraph', text: conclusionOpening }] : []),
      ...conclusionPoints.map((pt, idx) => ({
        type: 'paragraph',
        text: `.${idx + 1} ${pt}`
      }))
    ];

    const paginatedConclusion = paginationEngine.paginateSection({
      sectionType: 'conclusion',
      title: conclusionTitle,
      h1Title: conclusionTitle,
      status: 'complete',
      blocks: conclusionBlocks,
      footnotes: [],
      startPageNumber: currentPageNumber
    });

    paginatedConclusion.pages.forEach((p, idx) => {
      p.data = {
        title: conclusionTitle,
        opening: idx === 0 ? conclusionOpening : '',
        text: conclusionOpening,
        points: conclusionPoints
      };
      p.isContinuation = idx > 0;
    });

    pages.push(...paginatedConclusion.pages);
    paginationDiagnostics.push(...(paginatedConclusion.diagnostics || []));
    currentPageNumber = paginatedConclusion.nextPageNumber;

    // ==========================================
    // NEXT PAGES: المصادر والمراجع (Single Continuous Numbered List)
    // ==========================================
    let rawReferences = [];
    if (res.references && res.references.length > 0) {
      rawReferences = res.references.map((r) => normalizeReference(r) || r);
    } else {
      // Auto-extract references from all topic footnotes (strictly stripping volume & page, no hallucination)
      const allFootnoteTexts = [];
      (res.topics || []).forEach((t) => {
        (t.footnotes || []).forEach((f) => {
          const txt = f.text || f.rawText || '';
          if (txt) allFootnoteTexts.push(txt);
        });
      });

      if (allFootnoteTexts.length > 0) {
        rawReferences = allFootnoteTexts
          .map((txt) => normalizeReference(txt))
          .filter(Boolean);
      }
    }

    const deduplicated = deduplicateReferences(rawReferences);
    const continuousReferences = formatContinuousBibliography(deduplicated, { ignoreAl: true, sortBy: 'book' });

    const formattedRefs = continuousReferences.map((r, rIdx) => {
      const cleanDisplay = stripVolumeAndPage(r.displayText || r.book || '');

      return {
        order: rIdx + 1,
        orderAr: toArabicIndicDigits(rIdx + 1),
        book: cleanDisplay,
        author: r.author ? stripVolumeAndPage(r.author) : '',
        publisher: r.publisher ? stripVolumeAndPage(r.publisher) : '',
        city: r.city ? stripVolumeAndPage(r.city) : '',
        edition: r.edition ? stripVolumeAndPage(r.edition) : '',
        year: r.year ? stripVolumeAndPage(r.year) : '',
        displayText: cleanDisplay
      };
    });

    // Dynamic height-budgeted References pagination
    const refChunks = [];
    if (formattedRefs.length === 0) {
      refChunks.push([]);
    } else {
      let currentChunk = [];
      const usableRefHeight = paginationEngine.usableHeightPt; // 705.83pt
      let currentHeight = 40.3; // Header 'المصادر والمراجع' height (18pt + margins)

      for (const r of formattedRefs) {
        const displayTxt = r.displayText || [r.book, r.author, r.publisher, r.city, r.edition, r.year].filter(Boolean).join('، ');
        const lines = paginationEngine.wrapArabicText(displayTxt, 16, paginationEngine.contentWidthPt - 30);
        const itemHeight = (Math.max(1, lines.length) * 24.8) + 8.0;

        if (currentHeight + itemHeight > usableRefHeight && currentChunk.length > 0) {
          refChunks.push(currentChunk);
          currentChunk = [r];
          currentHeight = 40.3 + itemHeight; // Title on continuation page + first item
        } else {
          currentChunk.push(r);
          currentHeight += itemHeight;
        }
      }
      if (currentChunk.length > 0) {
        refChunks.push(currentChunk);
      }
    }

    refChunks.forEach((chunk, chunkIdx) => {
      pages.push({
        pageNumber: currentPageNumber,
        pageNumberAr: toArabicIndicDigits(currentPageNumber),
        pageType: 'references',
        title: chunkIdx === 0 ? 'المصادر والمراجع' : 'المصادر والمراجع (تابع)',
        anchorId: `page-${currentPageNumber}`,
        isContinuation: chunkIdx > 0,
        data: {
          references: chunk
        }
      });
      currentPageNumber++;
    });

    // ==========================================
    // FINAL PAGES: فهرس الموضوعات (Table of Contents)
    // ==========================================
    const preliminaryPages = [...pages];
    preliminaryPages.push({
      pageNumber: currentPageNumber,
      pageNumberAr: toArabicIndicDigits(currentPageNumber),
      pageType: 'toc',
      title: 'فهرس الموضوعات',
      anchorId: `page-${currentPageNumber}`
    });

    const tocEntries = TOCBuilder.generateTOCEntries(preliminaryPages);

    // Dynamic height-budgeted Table of Contents pagination
    const tocChunks = [];
    if (tocEntries.length === 0) {
      tocChunks.push([]);
    } else {
      let currentChunk = [];
      const usableTocHeight = paginationEngine.usableHeightPt; // 705.83pt
      let currentHeight = 40.3 + 36.0; // Header 'فهرس الموضوعات' (40.3pt) + Table Header Bar (36pt)

      for (const entry of tocEntries) {
        const titleLen = entry.title || '';
        const lines = paginationEngine.wrapArabicText(titleLen, entry.level === 2 ? 15 : 16, paginationEngine.contentWidthPt - 60);
        const entryHeight = (Math.max(1, lines.length) * 24.0) + 6.0;

        if (currentHeight + entryHeight > usableTocHeight && currentChunk.length > 0) {
          tocChunks.push(currentChunk);
          currentChunk = [entry];
          currentHeight = 40.3 + 36.0 + entryHeight;
        } else {
          currentChunk.push(entry);
          currentHeight += entryHeight;
        }
      }
      if (currentChunk.length > 0) {
        tocChunks.push(currentChunk);
      }
    }


    tocChunks.forEach((chunk, chunkIdx) => {
      pages.push({
        pageNumber: currentPageNumber,
        pageNumberAr: toArabicIndicDigits(currentPageNumber),
        pageType: 'toc',
        title: chunkIdx === 0 ? 'فهرس الموضوعات' : 'فهرس الموضوعات (تابع)',
        anchorId: `page-${currentPageNumber}`,
        isContinuation: chunkIdx > 0,
        data: {
          entries: chunk.map((e) => ({
            ...e,
            pageNumberAr: toArabicIndicDigits(e.pageNumber)
          }))
        }
      });
      currentPageNumber++;
    });

    return {
      title: res.title || res.cover?.title || '',
      totalPages: pages.length,
      borderId: border.borderId || border.id || borderId,
      border,
      fontFamily: fontConfig.id,
      fontConfig,
      pages,
      toc: tocEntries,
      paginationDiagnostics,
      spec: documentSpec
    };
  }
}

module.exports = DocumentBuilder;
