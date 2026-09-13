const TOCBuilder = require('../toc/tocBuilder');
const { toArabicIndicDigits, parseArabicIndicDigits } = require('./arabic');
const defaultBorders = require('./defaultBorders');
const documentSpec = require('./documentSpec');
const PaginationEngine = require('./paginationEngine');
const { deduplicateReferences } = require('../references/deduplicator');
const { normalizeReference } = require('../references/normalizer');
const { sortReferencesArabic, formatContinuousBibliography } = require('../references/arabicSort');
const { resolveLogoUrl } = require('./logoResolver');
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
        rawBlocksToNormalize.forEach((block) => {
          if (!block || !block.text) return;
          const textTrim = block.text.trim();
          if (!textTrim) return;

          const level = detectAcademicLevel(block);
          if (level === ACADEMIC_LEVELS.MABHATH || level === ACADEMIC_LEVELS.MATALAB || level === ACADEMIC_LEVELS.BRANCH) {
            finalNormalizedBlocks.push(block);
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
              finalNormalizedBlocks.push({ type: lineLevel, text: lineTrim });
            } else {
              currentParagraphLines.push(line);
            }
          });

          flushPara();
        });

        topicBlocks = finalNormalizedBlocks;

        allAcademicBlocks.push(...topicBlocks);
        if (topicFootnotes && topicFootnotes.length > 0) {
          allAcademicFootnotes.push(...topicFootnotes);
        }
      });

      if (allAcademicBlocks.length > 0) {
        // Paginate all topics across A4 pages deterministically as one continuous section
        const paginatedTopics = paginationEngine.paginateSection({
          sectionType: 'topic',
          title: 'الأبحاث',
          h1Title: 'الأبحاث',
          topicId: 'academic-topics',
          status: 'complete',
          blocks: allAcademicBlocks,
          footnotes: allAcademicFootnotes,
          startPageNumber: currentPageNumber
        });

        pages.push(...paginatedTopics.pages);
        paginationDiagnostics.push(...(paginatedTopics.diagnostics || []));
        currentPageNumber = paginatedTopics.nextPageNumber;
      }
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
      // Auto-extract references from all topic footnotes
      const allFootnoteTexts = [];
      (res.topics || []).forEach((t) => {
        (t.footnotes || []).forEach((f) => {
          const txt = f.text || f.rawText || '';
          if (txt) allFootnoteTexts.push(txt);
        });
      });

      if (allFootnoteTexts.length > 0) {
        const OpenRouterAdapter = require('../ai/OpenRouterAdapter');
        const adapter = new OpenRouterAdapter();
        const extracted = adapter._heuristicReferenceExtraction(allFootnoteTexts);
        rawReferences = (extracted.references || []).map((r) => normalizeReference(r) || r);
      }
    }

    const deduplicated = deduplicateReferences(rawReferences);
    const continuousReferences = formatContinuousBibliography(deduplicated, { ignoreAl: true });

    const formattedRefs = continuousReferences.map((r, rIdx) => ({
      order: rIdx + 1,
      orderAr: toArabicIndicDigits(rIdx + 1),
      book: r.book,
      author: r.author,
      publisher: r.publisher,
      city: r.city,
      edition: r.edition,
      year: r.year,
      displayText: [r.book, r.author, r.publisher, r.city, r.edition, r.year]
        .filter(Boolean)
        .join('، ')
    }));

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
      pages,
      toc: tocEntries,
      paginationDiagnostics,
      spec: documentSpec
    };
  }
}

module.exports = DocumentBuilder;
