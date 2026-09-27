const { toArabicIndicDigits, parseArabicIndicDigits } = require('./arabic');
const TYPOGRAPHY = require('./typography');

/**
 * Deterministic A4 Multi-Page Pagination & Layout Engine
 * 
 * Physical Geometry:
 * - A4 Sheet: 210mm × 297mm (595.28pt × 841.89pt)
 * - Configured Margins: Top 24mm (68.03pt), Bottom 24mm (68.03pt), Side 25mm (70.87pt)
 * - Base Usable Content Box: 160mm × 249mm (453.54pt × 705.83pt)
 * 
 * Mathematical Page Budget:
 * Usable Height = 297mm - 24mm - 24mm = 249mm = 705.83pt exactly.
 * Deductions from 705.83pt occur ONLY for measured content blocks,
 * heading margins, and actual page footnotes.
 */

// Character advance metrics for Amiri Arabic font
function getArabicCharWidthEm(char) {
  // Arabic Diacritics (Harakat / Tashkeel) take zero advance width
  if (/[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(char)) {
    return 0;
  }
  // Whitespace
  if (char === ' ') return 0.28;
  if (char === '\t') return 0.56;

  // Wide Arabic letters
  if (/[سشصضطظعغفقكلمنيئىـ]/.test(char)) {
    return 0.58;
  }
  // Medium Arabic letters
  if (/[بتثجحخهـ]/.test(char)) {
    return 0.48;
  }
  // Narrow Arabic letters
  if (/[ادذرزوءة]/.test(char)) {
    return 0.30;
  }
  // Digits (Arabic-Indic & Western)
  if (/[\u0660-\u06690-9]/.test(char)) {
    return 0.45;
  }
  // Punctuation
  if (/[.،؛:!؟?,\-\(\)\[\]"']/.test(char)) {
    return 0.32;
  }
  // Latin alphabet
  if (/[A-Z]/.test(char)) return 0.62;
  if (/[a-z]/.test(char)) return 0.48;

  // Default glyph fallback
  return 0.46;
}

function measureTextWidthPt(text, fontSizePt) {
  let ems = 0;
  for (let i = 0; i < text.length; i++) {
    ems += getArabicCharWidthEm(text[i]);
  }
  return ems * fontSizePt;
}

function wrapArabicTextToLines(text, fontSizePt, containerWidthPt = 453.54) {
  if (!text) return [];
  const rawParagraphs = text.split('\n');
  const allLines = [];

  for (const p of rawParagraphs) {
    const trimmed = p.trim();
    if (!trimmed) {
      allLines.push('');
      continue;
    }

    const words = trimmed.split(/(\s+)/).filter(Boolean);
    let currentLine = '';
    let currentLineWidthPt = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (/^\s+$/.test(word)) {
        if (currentLine) {
          const spaceW = measureTextWidthPt(word, fontSizePt);
          currentLine += word;
          currentLineWidthPt += spaceW;
        }
        continue;
      }

      const wordW = measureTextWidthPt(word, fontSizePt);

      if (currentLine.length === 0) {
        currentLine = word;
        currentLineWidthPt = wordW;
      } else if (currentLineWidthPt + wordW <= containerWidthPt) {
        currentLine += word;
        currentLineWidthPt += wordW;
      } else {
        // Line wrap at word boundary
        allLines.push(currentLine.trimEnd());
        currentLine = word;
        currentLineWidthPt = wordW;
      }
    }

    if (currentLine) {
      allLines.push(currentLine.trimEnd());
    }
  }

  return allLines.length > 0 ? allLines : [''];
}

class PaginationEngine {
  constructor(spec = {}) {
    this.spec = spec;
    // Enable browser‑based measurement by default; can be disabled via spec.useBrowserMeasurement = false
    this.useBrowserMeasurement = spec.useBrowserMeasurement !== false;
    this.measurementCache = new Map();
    this.paginationDiagnostics = [];

    const pageWidthMm = Number(spec.dimensions?.widthMm || 210);
    const pageHeightMm = Number(spec.dimensions?.heightMm || 297);
    const topMarginMm = Number(spec.margins?.topMm || 24);
    const bottomMarginMm = Number(spec.margins?.bottomMm || 24);
    const sideMarginMm = Number(spec.margins?.leftMm || 25);

    // Physical A4 Dimensions (210mm × 297mm in DTP points)
    this.pageWidthPt = Number(((pageWidthMm / 25.4) * 72).toFixed(2));
    this.pageHeightPt = Number(((pageHeightMm / 25.4) * 72).toFixed(2));

    // Margins (24mm Top/Bottom, 25mm Left/Right in DTP points)
    this.topMarginPt = Number(((topMarginMm / 25.4) * 72).toFixed(2));
    this.bottomMarginPt = Number(((bottomMarginMm / 25.4) * 72).toFixed(2));
    this.sideMarginPt = Number(((sideMarginMm / 25.4) * 72).toFixed(2));
    this.footerReservedPt = Number(((12 / 25.4) * 72).toFixed(2)); // 34.01pt (12mm from bottom)

    // Printable Usable Dimensions strictly derived from physical A4:
    // Width: 210mm - 25mm - 25mm = 160mm = 453.54pt
    // Height: 297mm - 24mm - 24mm = 249mm = 705.83pt
    this.contentWidthPt = Number((this.pageWidthPt - (this.sideMarginPt * 2)).toFixed(2)); // 453.54pt
    this.usableHeightPt = Number((this.pageHeightPt - this.topMarginPt - this.bottomMarginPt).toFixed(2)); // 705.83pt
    this.maxContentHeightPt = this.usableHeightPt; // 705.83pt (NO arbitrary reduction)

    // Typography rules & line heights matching A4 document specification
    const typography = spec.typography || TYPOGRAPHY;
    this.headingFontSizePt = typography.sizes?.heading || 18;
    this.headingLineHeightPt = this.headingFontSizePt * (typography.lineHeights?.headings || 1.35);
    this.headingMarginTopPt = 8.0;
    this.headingMarginBottomPt = 8.0;

    this.subheadingFontSizePt = typography.sizes?.subheading || 17;
    this.subheadingLineHeightPt = this.subheadingFontSizePt * (typography.lineHeights?.headings || 1.35);
    this.subheadingMarginTopPt = 10.0;
    this.subheadingMarginBottomPt = 8.0;

    this.bodyFontSizePt = typography.sizes?.body || 16;
    this.bodyLineHeightPt = this.bodyFontSizePt * (typography.lineHeights?.body || 1.55);
    this.bodyMarginBottomPt = 6.0;    // 6pt bottom margin

    this.footnoteFontSizePt = typography.sizes?.footnote || 12;
    this.footnoteLineHeightPt = this.footnoteFontSizePt * (typography.lineHeights?.footnotes || 1.35);
    this.footnoteMarginBottomPt = 4.0;
    this.footnoteSeparatorHeightPt = Number(spec.footnotes?.separatorOccupiedHeightPt || 19.125);
  }

  measurementOptions(text, fontSizePt, lineHeightPt, widthPt = this.contentWidthPt, textAlign = 'justify') {
    return {
      text,
      fontFamily: this.spec.typography?.fonts?.primary || 'Amiri',
      fontSizePt,
      fontWeight: 'normal',
      lineHeight: lineHeightPt / fontSizePt,
      widthMm: (widthPt * 25.4) / 72,
      textAlign,
      direction: this.spec.direction || 'rtl'
    };
  }

  measuredLineMetrics(text, fontSizePt, lineHeightPt, widthPt = this.contentWidthPt, textAlign = 'justify') {
    const opts = this.measurementOptions(text, fontSizePt, lineHeightPt, widthPt, textAlign);
    const key = JSON.stringify(opts);
    if (this.measurementCache.has(key)) return this.measurementCache.get(key);
    const { measureSync } = require('./browserMeasurementSync');
    const measured = measureSync(opts);
    this.measurementCache.set(key, measured);
    return measured;
  }

  prepareMeasurements(blocks = [], footnotes = []) {
    if (!this.useBrowserMeasurement) return;
    const options = [];
    const add = (text, fontSizePt, lineHeightPt, widthPt, textAlign = 'justify') => {
      if (!text || !String(text).trim()) return;
      options.push(this.measurementOptions(String(text).trim(), fontSizePt, lineHeightPt, widthPt, textAlign));
    };
    blocks.forEach((block) => {
      if (!block?.text) return;
      if (block.type === 'h1' || block.type === 'mabhath') add(block.text, this.headingFontSizePt, this.headingLineHeightPt, this.contentWidthPt, 'center');
      else if (block.type === 'h2' || block.type === 'matlab') add(block.text, this.subheadingFontSizePt, this.subheadingLineHeightPt, this.contentWidthPt);
      else if (block.type === 'h3' || block.type === 'branch') add(block.text, this.subheadingFontSizePt, 20, this.contentWidthPt);
      else if (block.type === 'quote') add(block.text, this.bodyFontSizePt, this.bodyLineHeightPt, this.contentWidthPt - 20);
      else add(block.text, this.bodyFontSizePt, this.bodyLineHeightPt, this.contentWidthPt);
    });
    footnotes.forEach((fn) => add(typeof fn === 'string' ? fn : fn?.text, this.footnoteFontSizePt, this.footnoteLineHeightPt, this.contentWidthPt));
    const unique = [...new Map(options.map((opts) => [JSON.stringify(opts), opts])).values()];
    if (unique.length === 0) return;
    const { measureManySync } = require('./browserMeasurementSync');
    measureManySync(unique).forEach((measured, index) => {
      this.measurementCache.set(JSON.stringify(unique[index]), measured);
    });
  }

  /**
   * Measures the wrapped lines of Arabic text at the given font size and width
   */
  wrapArabicText(text, fontSizePt, widthPt = this.contentWidthPt) {
    return wrapArabicTextToLines(text, fontSizePt, widthPt);
  }

  /**
   * Accurately calculates height of a single content block based on real line wrapping
   */
  estimateBlockHeight(block) {
    if (!block || !block.text) return 0;
    const text = block.text.trim();
    if (!text) return 0;

    if (block.type === 'h1' || block.type === 'mabhath') {
      const measured = this.useBrowserMeasurement ? this.measuredLineMetrics(text, this.headingFontSizePt, this.headingLineHeightPt, this.contentWidthPt, 'center') : null;
      const lineCount = measured?.lineCount || Math.max(1, this.wrapArabicText(text, this.headingFontSizePt, this.contentWidthPt).length);
      const lineHeight = measured?.lineHeightPt || this.headingLineHeightPt;
      return (lineCount * lineHeight) + this.headingMarginTopPt + this.headingMarginBottomPt;
    }

    if (block.type === 'h2' || block.type === 'matlab') {
      const measured = this.useBrowserMeasurement ? this.measuredLineMetrics(text, this.subheadingFontSizePt, this.subheadingLineHeightPt, this.contentWidthPt) : null;
      const lineCount = measured?.lineCount || Math.max(1, this.wrapArabicText(text, this.subheadingFontSizePt, this.contentWidthPt).length);
      const lineHeight = measured?.lineHeightPt || this.subheadingLineHeightPt;
      return (lineCount * lineHeight) + this.subheadingMarginTopPt + this.subheadingMarginBottomPt;
    }

    if (block.type === 'h3' || block.type === 'branch') {
      const measured = this.useBrowserMeasurement ? this.measuredLineMetrics(text, this.subheadingFontSizePt, 20, this.contentWidthPt) : null;
      const lineCount = measured?.lineCount || Math.max(1, this.wrapArabicText(text, this.subheadingFontSizePt, this.contentWidthPt).length);
      return (lineCount * (measured?.lineHeightPt || 20.0)) + 16.0;
    }

    if (block.type === 'quote') {
      const measured = this.useBrowserMeasurement ? this.measuredLineMetrics(text, this.bodyFontSizePt, this.bodyLineHeightPt, this.contentWidthPt - 20) : null;
      const lineCount = measured?.lineCount || Math.max(1, this.wrapArabicText(text, this.bodyFontSizePt, this.contentWidthPt - 20).length);
      return (lineCount * (measured?.lineHeightPt || this.bodyLineHeightPt)) + 16.0;
    }

    // Standard paragraph (16pt Amiri, line-height 1.55, margin-bottom 6pt)
    if (this.useBrowserMeasurement !== false) {
      // Lazy-load measurement service to avoid circular dependency
      const meas = this.measuredLineMetrics(text, this.bodyFontSizePt, this.bodyLineHeightPt, this.contentWidthPt);
      const lineCount = meas.lineCount;
      const lineHeightPt = meas.lineHeightPt;
      return (lineCount * lineHeightPt) + this.bodyMarginBottomPt;
    }
    // Fallback to heuristic measurement
    const lines = this.wrapArabicText(text, this.bodyFontSizePt, this.contentWidthPt);
    const lineCount = Math.max(1, lines.length);
    return (lineCount * this.bodyLineHeightPt) + this.bodyMarginBottomPt;
  }

  /**
   * Accurately calculates height of a footnote item (12pt Amiri, line-height 1.35)
   */
  estimateFootnoteHeight(fn) {
    const text = typeof fn === 'string' ? fn : (fn.text || '');
    if (!text.trim()) return 0;
    const measured = this.useBrowserMeasurement ? this.measuredLineMetrics(text, this.footnoteFontSizePt, this.footnoteLineHeightPt, this.contentWidthPt) : null;
    const lineCount = measured?.lineCount || Math.max(1, this.wrapArabicText(text, this.footnoteFontSizePt, this.contentWidthPt).length);
    return (lineCount * (measured?.lineHeightPt || this.footnoteLineHeightPt)) + this.footnoteMarginBottomPt;
  }

  /**
   * Splits a long paragraph text so that part1 precisely fits availableHeightPt.
   * Prioritizes sentence boundaries, then clause punctuation, then word boundaries.
   */
  splitParagraph(text, availableHeightPt) {
    const minRequired = (this.bodyLineHeightPt * 2) + this.bodyMarginBottomPt;
    if (availableHeightPt < minRequired) {
      return { part1: null, part2: text };
    }

    const maxFitLines = Math.floor((availableHeightPt - this.bodyMarginBottomPt) / this.bodyLineHeightPt);
    if (maxFitLines < 2) {
      return { part1: null, part2: text };
    }

    const wrappedLines = this.wrapArabicText(text, this.bodyFontSizePt, this.contentWidthPt);
    if (wrappedLines.length <= maxFitLines) {
      return { part1: text, part2: null };
    }

    // Estimate candidate text limit from maxFitLines
    const candidateLines = wrappedLines.slice(0, maxFitLines);
    const candidateWordText = candidateLines.join(' ');
    const candidateCharLimit = candidateWordText.length;

    // Search for best linguistic breakpoint:
    // 1. Sentence delimiter in later candidate text
    let splitIdx = -1;
    const sentenceDelimiters = ['. ', '! ', '؟ ', '.\n', '!\n', '؟\n', '\n\n', '\n'];
    for (const delim of sentenceDelimiters) {
      const idx = text.lastIndexOf(delim, candidateCharLimit);
      if (idx > candidateCharLimit * 0.70 && idx > splitIdx) {
        splitIdx = idx + delim.length;
      }
    }

    // 2. Clause boundaries (، ؛ : ) in later candidate text
    if (splitIdx === -1) {
      const clauseDelimiters = ['، ', '؛ ', ': '];
      for (const delim of clauseDelimiters) {
        const idx = text.lastIndexOf(delim, candidateCharLimit);
        if (idx > candidateCharLimit * 0.75 && idx > splitIdx) {
          splitIdx = idx + delim.length;
        }
      }
    }

    // 3. Sentence delimiter in earlier part (55%-70%) if no late delimiter
    if (splitIdx === -1) {
      for (const delim of sentenceDelimiters) {
        const idx = text.lastIndexOf(delim, candidateCharLimit);
        if (idx > candidateCharLimit * 0.55 && idx > splitIdx) {
          splitIdx = idx + delim.length;
        }
      }
    }

    // 4. Clause delimiter in earlier part (60%-75%) if no sentence delimiter
    if (splitIdx === -1) {
      const clauseDelimiters = ['، ', '؛ ', ': '];
      for (const delim of clauseDelimiters) {
        const idx = text.lastIndexOf(delim, candidateCharLimit);
        if (idx > candidateCharLimit * 0.60 && idx > splitIdx) {
          splitIdx = idx + delim.length;
        }
      }
    }

    // 5. Word boundary (clean space nearest candidateCharLimit)
    if (splitIdx === -1) {
      const spaceIdx = text.lastIndexOf(' ', candidateCharLimit);
      if (spaceIdx > candidateCharLimit * 0.75) {
        splitIdx = spaceIdx + 1;
      }
    }

    // Fallback: nearest space
    if (splitIdx <= 0 || splitIdx >= text.length) {
      const anySpace = text.lastIndexOf(' ', candidateCharLimit);
      splitIdx = anySpace > 0 ? anySpace + 1 : candidateCharLimit;
    }

    const part1 = text.substring(0, splitIdx).trim();
    const part2 = text.substring(splitIdx).trim();

    // Verify part1 height strictly fits in availableHeightPt
    const p1Height = this.estimateBlockHeight({ type: 'paragraph', text: part1 });
    if (p1Height > availableHeightPt && maxFitLines > 2) {
      return this.splitParagraph(text, (maxFitLines - 1) * this.bodyLineHeightPt + this.bodyMarginBottomPt);
    }

    return { part1, part2 };
  }

  /**
   * Helper to extract footnote objects referenced in a given text snippet
   */
  extractFootnotesFromText(text, footnoteMap) {
    if (!text || !footnoteMap) return [];
    const matched = [];
    const seen = new Set();
    const matches = text.match(/\((\d+|[\u0660-\u0669]+)\)/g) || [];
    matches.forEach((m) => {
      const rawDigits = m.replace(/[()]/g, '');
      const parsedNum = parseArabicIndicDigits(rawDigits);
      const fnObj = footnoteMap.get(m) || footnoteMap.get(rawDigits) || footnoteMap.get(String(parsedNum)) || footnoteMap.get(`(${parsedNum})`);
      if (fnObj && !seen.has(fnObj.footnoteId)) {
        seen.add(fnObj.footnoteId);
        matched.push(fnObj);
      }
    });
    return matched;
  }

  fragmentBlock(block, text, footnoteMap, isFirstFragment) {
    if (!Array.isArray(block?.footnoteRefs)) return { ...block, text };
    const markers = text.match(/\((\d+|[\u0660-\u0669]+)\)/g) || [];
    const markerKeys = new Set(markers.flatMap((marker) => {
      const raw = marker.replace(/[()]/g, '');
      const parsed = parseArabicIndicDigits(raw);
      return [marker, raw, String(parsed), `(${parsed})`];
    }));
    const footnoteRefs = markers.length > 0
      ? block.footnoteRefs.filter((ref) => {
        const refId = typeof ref === 'string' ? ref : (ref?.footnoteId || ref?.id);
        const fn = footnoteMap.get(refId);
        return fn && [fn.marker, String(fn.number), `(${fn.number})`, toArabicIndicDigits(fn.number), `(${toArabicIndicDigits(fn.number)})`]
          .some((key) => markerKeys.has(key));
      })
      : (isFirstFragment ? block.footnoteRefs : []);
    return { ...block, text, footnoteRefs };
  }

  recordDiagnostic(entry) {
    this.paginationDiagnostics.push({
      page: entry.page ?? null,
      blockId: entry.blockId || null,
      blockType: entry.blockType || null,
      blockHeight: Number(entry.blockHeight || 0),
      footnoteHeight: Number(entry.footnoteHeight || 0),
      separatorHeight: Number(entry.separatorHeight || 0),
      currentBodyHeight: Number(entry.currentBodyHeight || 0),
      currentFootnoteHeight: Number(entry.currentFootnoteHeight || 0),
      remainingHeight: Number(entry.remainingHeight || 0),
      projectedHeight: Number(entry.projectedHeight || 0),
      splitAllowed: Boolean(entry.splitAllowed),
      reason: entry.reason || 'unknown'
    });
  }

  /**
   * Paginates a section's blocks and associated footnotes into valid A4 pages.
   * Enforces Page-Based Footnote Numbering (restarts at 1 per page).
   */
  paginateSection({
    sectionType = 'topic',
    title = '',
    h1Title = '',
    topicId = '',
    structureNodeId = '',
    hasMabhath = false,
    mabhathTitle = null,
    mabhathId = null,
    status = 'complete',
    blocks = [],
    footnotes = [],
    startPageNumber = 3
  }) {
    this.paginationDiagnostics = [];
    this.prepareMeasurements(blocks, footnotes);
    const pages = [];
    let currentPageBlocks = [];
    let currentFootnoteItems = [];
    let currentBodyHeight = 0;
    let currentFootnotesHeight = 0;
    let pageNumber = startPageNumber;

    // Build lookup map for footnotes
    const footnoteMap = new Map();
    const footnoteOrderMap = new Map();
    const allAssignedFootnoteIds = new Set();

    footnotes.forEach((fn, idx) => {
      const stableId = fn.footnoteId || fn.id || `fn-${topicId || 't'}-${idx + 1}`;
      let fnNum = fn.originalNumber || fn.number;
      if (fn.marker) {
        const parsed = parseArabicIndicDigits(fn.marker);
        if (!isNaN(parsed) && parsed > 0) fnNum = parsed;
      }
      if (!fnNum || isNaN(fnNum)) fnNum = idx + 1;
      const fnNumAr = toArabicIndicDigits(fnNum);

      const entry = {
        ...fn,
        footnoteId: stableId,
        id: stableId,
        originalNumber: fnNum,
        number: fnNum,
        marker: fn.marker || `(${fnNum})`,
        text: fn.text || ''
      };
      footnoteMap.set(stableId, entry);
      footnoteMap.set(String(fnNum), entry);
      footnoteMap.set(`(${fnNum})`, entry);
      footnoteMap.set(fnNumAr, entry);
      footnoteMap.set(`(${fnNumAr})`, entry);
      if (fn.marker) {
        footnoteMap.set(fn.marker, entry);
        footnoteMap.set(fn.marker.replace(/[()]/g, ''), entry);
      }
      footnoteMap.set(String(idx + 1), entry);
      footnoteMap.set(`(${idx + 1})`, entry);

      footnoteOrderMap.set(stableId, idx);
      if (fn.id) footnoteOrderMap.set(fn.id, idx);
      if (fn.footnoteId) footnoteOrderMap.set(fn.footnoteId, idx);
    });

    // Helper to commit current page with page-local footnote renumbering
    const commitPage = () => {
      if (currentPageBlocks.length === 0 && currentFootnoteItems.length === 0 && blockQueue.length > 0) return;
      if (currentPageBlocks.length === 0 && currentFootnoteItems.length === 0 && footnotes.length === 0) return;

      // Extract unique footnotes referenced on this page in order of appearance in blocks
      const orderedPageFootnotes = [];
      const seenIds = new Set();

      // Scan page blocks for footnote markers/refs
      currentPageBlocks.forEach((b) => {
        if (b.footnoteRefs && Array.isArray(b.footnoteRefs)) {
          b.footnoteRefs.forEach((ref) => {
            const refId = typeof ref === 'string' ? ref : ref.footnoteId;
            const fnObj = footnoteMap.get(refId);
            if (fnObj && !seenIds.has(fnObj.footnoteId)) {
              seenIds.add(fnObj.footnoteId);
              allAssignedFootnoteIds.add(fnObj.footnoteId);
              orderedPageFootnotes.push(fnObj);
            }
          });
        }

        if (b.text) {
          const matches = b.text.match(/\((\d+|[\u0660-\u0669]+)\)/g) || [];
          matches.forEach((m) => {
            const rawDigits = m.replace(/[()]/g, '');
            const parsedNum = parseArabicIndicDigits(rawDigits);
            const fnObj = footnoteMap.get(m) || footnoteMap.get(rawDigits) || footnoteMap.get(String(parsedNum)) || footnoteMap.get(`(${parsedNum})`);
            if (fnObj && !seenIds.has(fnObj.footnoteId)) {
              seenIds.add(fnObj.footnoteId);
              allAssignedFootnoteIds.add(fnObj.footnoteId);
              orderedPageFootnotes.push(fnObj);
            }
          });
        }
      });

      // Add any explicit footnotes queued for this page that were not yet matched
      currentFootnoteItems.forEach((fn) => {
        if (!seenIds.has(fn.footnoteId)) {
          seenIds.add(fn.footnoteId);
          allAssignedFootnoteIds.add(fn.footnoteId);
          orderedPageFootnotes.push(fn);
        }
      });

      // Sort footnotes by their natural sequence in input footnotes array
      orderedPageFootnotes.sort((a, b) => {
        const orderA = footnoteOrderMap.has(a.footnoteId) ? footnoteOrderMap.get(a.footnoteId) : (footnoteOrderMap.has(a.id) ? footnoteOrderMap.get(a.id) : 999);
        const orderB = footnoteOrderMap.has(b.footnoteId) ? footnoteOrderMap.get(b.footnoteId) : (footnoteOrderMap.has(b.id) ? footnoteOrderMap.get(b.id) : 999);
        return orderA - orderB;
      });

      // Build local numbering mapping: stableId -> localNumber (1, 2, 3...)
      const localNumberMapping = new Map();
      const markerReplacementMap = new Map();

      const finalPageFootnotes = orderedPageFootnotes.map((fn, idx) => {
        const localNum = idx + 1;
        const localNumAr = toArabicIndicDigits(localNum);
        const origNum = fn.originalNumber || (idx + 1);
        const origNumAr = toArabicIndicDigits(origNum);

        localNumberMapping.set(fn.footnoteId, localNum);
        localNumberMapping.set(String(origNum), localNum);
        localNumberMapping.set(`(${origNum})`, `(${localNum})`);
        localNumberMapping.set(origNumAr, localNum);
        localNumberMapping.set(`(${origNumAr})`, `(${localNum})`);

        markerReplacementMap.set(String(origNum), String(localNum));
        markerReplacementMap.set(origNumAr, String(localNum));
        if (fn.marker) {
          const raw = fn.marker.replace(/[()]/g, '');
          markerReplacementMap.set(raw, String(localNum));
        }

        return {
          id: fn.footnoteId,
          footnoteId: fn.footnoteId,
          number: localNum,
          numberAr: localNumAr,
          marker: `(${localNum})`,
          markerAr: `(${localNumAr})`,
          text: fn.text || '',
          source: fn.source || {},
          originalNumber: origNum
        };
      });

      // Safe single-pass regex rewrite of inline markers in page blocks
      const finalPageBlocks = currentPageBlocks.map((b) => {
        if (!b.text) return b;
        const rewrittenText = b.text.replace(/\((\d+|[\u0660-\u0669]+)\)/g, (fullMatch, digits) => {
          const targetNum = markerReplacementMap.get(digits);
          if (targetNum !== undefined) {
            return `(${targetNum})`;
          }
          return fullMatch;
        });
        return {
          ...b,
          text: rewrittenText
        };
      });

      const pageEntry = {
        pageNumber,
        pageNumberAr: toArabicIndicDigits(pageNumber),
        pageType: sectionType,
        title: title || h1Title,
        topicId: structureNodeId || topicId,
        structureNodeId: structureNodeId || topicId,
        hasMabhath,
        mabhathTitle,
        mabhathId,
        status,
        anchorId: `page-${pageNumber}`,
        blocks: finalPageBlocks,
        footnotes: finalPageFootnotes,
        debugContentHeight: currentBodyHeight,
        debugFootnoteHeight: currentFootnotesHeight
      };

      pages.push(pageEntry);

      pageNumber++;
      currentPageBlocks = [];
      currentFootnoteItems = [];
      currentBodyHeight = 0;
      currentFootnotesHeight = 0;
    };

    // Work queue of blocks
    const blockQueue = [...blocks];

    while (blockQueue.length > 0) {
      const block = blockQueue.shift();
      const blockHeight = this.estimateBlockHeight(block);
      const blockId = block.id || block.blockId || `${sectionType}-${pages.length + 1}-${currentPageBlocks.length + 1}`;

      // Identify footnotes referenced in this block
      const blockFootnotes = [];
      if (block.footnoteRefs && Array.isArray(block.footnoteRefs)) {
        block.footnoteRefs.forEach((ref) => {
          const refId = typeof ref === 'string' ? ref : ref.footnoteId;
          const fnObj = footnoteMap.get(refId);
          if (fnObj && !currentFootnoteItems.some(f => f.footnoteId === fnObj.footnoteId)) {
            blockFootnotes.push(fnObj);
          }
        });
      } else if (block.text) {
        const markerMatches = block.text.match(/\((\d+|[\u0660-\u0669]+)\)/g) || [];
        markerMatches.forEach((m) => {
          const rawDigits = m.replace(/[()]/g, '');
          const parsedNum = parseArabicIndicDigits(rawDigits);
          const fnObj = footnoteMap.get(m) || footnoteMap.get(rawDigits) || footnoteMap.get(String(parsedNum)) || footnoteMap.get(`(${parsedNum})`);
          if (fnObj && !currentFootnoteItems.some(f => f.footnoteId === fnObj.footnoteId)) {
            blockFootnotes.push(fnObj);
          }
        });
      }

      // Height required for these footnotes
      let additionalFnHeight = 0;
      if (currentFootnoteItems.length === 0 && blockFootnotes.length > 0) {
        additionalFnHeight += this.footnoteSeparatorHeightPt;
      }
      blockFootnotes.forEach((fn) => {
        additionalFnHeight += this.estimateFootnoteHeight(fn);
      });

      const totalProjectedHeight = currentBodyHeight + blockHeight + currentFootnotesHeight + additionalFnHeight;
      const isHeadingBlock = block.type === 'h1' || block.type === 'h2' || block.type === 'h3' ||
        block.type === 'mabhath' || block.type === 'matlab' || block.type === 'branch';

      // Heading orphan prevention: heading must have room for at least 1 line of body text (~28pt)
      const minHeadingRoom = isHeadingBlock ? (blockHeight + (this.bodyLineHeightPt * 1) + this.bodyMarginBottomPt) : blockHeight;
      const totalProjectedWithMinRoom = currentBodyHeight + minHeadingRoom + currentFootnotesHeight + additionalFnHeight;

      const diagnosticBase = {
        page: pageNumber,
        blockId,
        blockType: block.type,
        blockHeight,
        footnoteHeight: additionalFnHeight,
        separatorHeight: currentFootnoteItems.length === 0 && blockFootnotes.length > 0 ? this.footnoteSeparatorHeightPt : 0,
        currentBodyHeight,
        currentFootnoteHeight: currentFootnotesHeight,
        remainingHeight: this.usableHeightPt - currentBodyHeight - currentFootnotesHeight,
        projectedHeight: totalProjectedHeight,
        splitAllowed: block.type === 'paragraph' && block.text.length > 40
      };

      if (totalProjectedHeight <= this.usableHeightPt && (!isHeadingBlock || currentPageBlocks.length === 0 || totalProjectedWithMinRoom <= this.usableHeightPt)) {
        this.recordDiagnostic({ ...diagnosticBase, reason: isHeadingBlock && totalProjectedWithMinRoom > this.usableHeightPt ? 'fit-without-heading-guard-on-empty-page' : 'fit' });
        // Block fits inside remaining usable A4 height
        currentPageBlocks.push(block);
        currentBodyHeight += blockHeight;
        if (blockFootnotes.length > 0) {
          currentFootnoteItems.push(...blockFootnotes);
          currentFootnotesHeight += additionalFnHeight;
        }
      } else {
        // Block does not fit in remaining usable space
        // Base text available space on actual current page footprint (without premature tail footnote reservations)
        const baseTextAvailable = this.usableHeightPt - currentBodyHeight - currentFootnotesHeight;
        const minRequired = (this.bodyLineHeightPt * 2) + this.bodyMarginBottomPt;

        // If it is a paragraph with room for at least 2 lines, split paragraph cleanly
        if (block.type === 'paragraph' && block.text.length > 40 && baseTextAvailable >= minRequired) {
          let targetTextBudget = baseTextAvailable;
          let splitResult = this.splitParagraph(block.text, targetTextBudget);
          let validSplit = null;
          let validP1Fns = [];
          let validP1FnH = 0;
          let validP1Height = 0;

          while (splitResult && splitResult.part1 && splitResult.part2 && splitResult.part1.length > 15) {
            const p1Height = this.estimateBlockHeight({ type: 'paragraph', text: splitResult.part1 });
            const p1Fns = this.extractFootnotesFromText(splitResult.part1, footnoteMap);
            let p1FnH = 0;
            const newFns = p1Fns.filter(fn => !currentFootnoteItems.some(f => f.footnoteId === fn.footnoteId));
            if (currentFootnotesHeight === 0 && newFns.length > 0) {
              p1FnH += this.footnoteSeparatorHeightPt;
            }
            newFns.forEach((f) => { p1FnH += this.estimateFootnoteHeight(f); });

            if (p1Height + p1FnH <= baseTextAvailable) {
              validSplit = splitResult;
              validP1Fns = newFns;
              validP1FnH = p1FnH;
              validP1Height = p1Height;
              break;
            } else {
              targetTextBudget = baseTextAvailable - p1FnH;
              if (targetTextBudget < minRequired) break;
              splitResult = this.splitParagraph(block.text, targetTextBudget);
            }
          }

          if (validSplit) {
            currentPageBlocks.push(this.fragmentBlock(block, validSplit.part1, footnoteMap, true));
            currentBodyHeight += validP1Height;
            if (validP1Fns.length > 0) {
              currentFootnoteItems.push(...validP1Fns);
              currentFootnotesHeight += validP1FnH;
            }
            // Re-queue part2 for the next page
            blockQueue.unshift(this.fragmentBlock(block, validSplit.part2, footnoteMap, false));
            this.recordDiagnostic({ ...diagnosticBase, reason: 'split-paragraph' });
            commitPage();
            continue;
          }
        }

        // If current page already has content, commit it and start a new A4 page
        if (currentPageBlocks.length > 0) {
          blockQueue.unshift(block);
          this.recordDiagnostic({ ...diagnosticBase, reason: isHeadingBlock ? 'break-heading-or-overflow' : 'break-overflow' });
          commitPage();
        } else {
          // Fresh page: if a massive paragraph exceeds the entire page height, split it
          if (block.type === 'paragraph' && blockHeight > this.usableHeightPt) {
            let targetBudget = this.usableHeightPt;
            let splitResult = this.splitParagraph(block.text, targetBudget);
            let validSplit = null;
            let validP1Fns = [];
            let validP1FnH = 0;
            let validP1Height = 0;

            while (splitResult && splitResult.part1 && splitResult.part2) {
              const p1Height = this.estimateBlockHeight({ type: 'paragraph', text: splitResult.part1 });
              const p1Fns = this.extractFootnotesFromText(splitResult.part1, footnoteMap);
              let p1FnH = 0;
              if (p1Fns.length > 0) p1FnH += this.footnoteSeparatorHeightPt;
              p1Fns.forEach((f) => { p1FnH += this.estimateFootnoteHeight(f); });

              if (p1Height + p1FnH <= this.usableHeightPt) {
                validSplit = splitResult;
                validP1Fns = p1Fns;
                validP1FnH = p1FnH;
                validP1Height = p1Height;
                break;
              } else {
                targetBudget = this.usableHeightPt - p1FnH;
                if (targetBudget < minRequired) break;
                splitResult = this.splitParagraph(block.text, targetBudget);
              }
            }

            if (validSplit) {
              currentPageBlocks.push(this.fragmentBlock(block, validSplit.part1, footnoteMap, true));
              currentBodyHeight += validP1Height;
              if (validP1Fns.length > 0) {
                currentFootnoteItems.push(...validP1Fns);
                currentFootnotesHeight += validP1FnH;
              }
              blockQueue.unshift(this.fragmentBlock(block, validSplit.part2, footnoteMap, false));
              this.recordDiagnostic({ ...diagnosticBase, reason: 'split-paragraph-on-empty-page' });
              commitPage();
              continue;
            }
          }

          // Single block on fresh empty page
          currentPageBlocks.push(block);
          this.recordDiagnostic({ ...diagnosticBase, reason: 'oversized-block-placed-on-empty-page' });
          currentBodyHeight += blockHeight;
          if (blockFootnotes.length > 0) {
            currentFootnoteItems.push(...blockFootnotes);
            currentFootnotesHeight += additionalFnHeight;
          }
          commitPage();
        }
      }
    }

    // Commit any remaining page content
    commitPage();

    const assignedIds = new Set(pages.flatMap((page) => (page.footnotes || []).map((fn) => fn.footnoteId)));
    const unassignedFootnotes = footnotes.filter((fn, index) => {
      const id = fn.footnoteId || fn.id || `fn-${topicId || 't'}-${index + 1}`;
      return !assignedIds.has(id);
    });

    if (unassignedFootnotes.length > 0 && pages.length > 0) {
      const targetPage = pages[0];
      targetPage.footnotes = targetPage.footnotes || [];
      unassignedFootnotes.forEach((fn, index) => {
        const id = fn.footnoteId || fn.id || `fn-${topicId || 't'}-${index + 1}`;
        const localNum = targetPage.footnotes.length + 1;
        const origNum = fn.originalNumber || fn.number || localNum;
        targetPage.footnotes.push({
          id,
          footnoteId: id,
          number: localNum,
          numberAr: toArabicIndicDigits(localNum),
          marker: `(${localNum})`,
          markerAr: `(${toArabicIndicDigits(localNum)})`,
          text: fn.text || '',
          source: fn.source || {},
          originalNumber: origNum
        });
      });
    }

    if (unassignedFootnotes.length > 0) {
      const unassignedFootnoteIds = unassignedFootnotes.map((fn, index) => fn.footnoteId || fn.id || `fn-${topicId || 't'}-${index + 1}`);
      this.recordDiagnostic({ page: pageNumber, reason: 'unassigned-footnotes-assigned-to-page', blockId: unassignedFootnoteIds.join(',') });
    }

    return {
      pages,
      nextPageNumber: pageNumber,
      diagnostics: this.paginationDiagnostics
    };
  }
}

module.exports = PaginationEngine;
