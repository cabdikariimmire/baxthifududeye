/**
 * Client-Side Deterministic A4 Pagination Helper
 * Mirrors backend PaginationEngine:
 * - Mathematical A4 Usable Height = 297mm - 25mm - 25mm = 247mm = 700.16pt
 * - Usable Width = 210mm - 25mm - 25mm = 160mm = 453.54pt
 * - True Arabic content-aware line wrapping & measurement
 * - Dynamic paragraph splitting & orphan prevention
 * - Page-based footnote numbering restarting at (1) on each page
 */

// Character advance metrics for Amiri Arabic font
function getArabicCharWidthEm(char) {
  // Diacritics (Harakat / Tashkeel) take zero advance width
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

export function wrapArabicTextToLines(text, fontSizePt, containerWidthPt = 453.54) {
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

export function paginateTopicContent({
  title = '',
  h1Title = '',
  topicId = '',
  blocks = [],
  footnotes = [],
  startPageNumber = 3
}) {
  // Physical A4 Dimensions (210mm × 297mm)
  const pageWidthPt = 595.28;  // 210mm
  const pageHeightPt = 841.89; // 297mm
  const topMarginPt = 68.03;   // 24mm
  const bottomMarginPt = 68.03;// 24mm
  const sideMarginPt = 70.87;  // 25mm

  const contentWidthPt = 453.54; // 160mm printable width
  const usableHeightPt = 705.83; // 249mm = 297 - 24 - 24
  const maxContentHeightPt = usableHeightPt; // 705.83pt exactly

  const headingFontSizePt = 18;
  const headingLineHeightPt = 24.3;  // 18pt * 1.35
  const headingMarginTopPt = 8.0;
  const headingMarginBottomPt = 8.0;

  const subheadingFontSizePt = 17;
  const subheadingLineHeightPt = 23.0;// 17pt * 1.35
  const subheadingMarginTopPt = 10.0;
  const subheadingMarginBottomPt = 8.0;

  const bodyFontSizePt = 16;
  const bodyLineHeightPt = 24.8;     // 16pt * 1.55 (matches CSS leading-[1.55])
  const bodyMarginBottomPt = 6.0;

  const footnoteFontSizePt = 12;
  const footnoteLineHeightPt = 16.2; // 12pt * 1.35
  const footnoteMarginBottomPt = 4.0;
  // Measured occupied height of the actual A4 preview footnote header at 96
  // DPI. It is deducted only when a page owns footnotes.
  const footnoteSeparatorHeightPt = 19.125;

  const estimateBlockHeight = (block) => {
    if (!block || !block.text) return 0;
    const text = block.text.trim();
    if (!text) return 0;

    if (block.type === 'h1' || block.type === 'mabhath') {
      const lines = wrapArabicTextToLines(text, headingFontSizePt, contentWidthPt);
      const lineCount = Math.max(1, lines.length);
      return (lineCount * headingLineHeightPt) + headingMarginTopPt + headingMarginBottomPt;
    }
    if (block.type === 'h2' || block.type === 'matlab') {
      const lines = wrapArabicTextToLines(text, subheadingFontSizePt, contentWidthPt);
      const lineCount = Math.max(1, lines.length);
      return (lineCount * subheadingLineHeightPt) + subheadingMarginTopPt + subheadingMarginBottomPt;
    }
    if (block.type === 'h3' || block.type === 'branch') {
      const lines = wrapArabicTextToLines(text, subheadingFontSizePt, contentWidthPt);
      const lineCount = Math.max(1, lines.length);
      return (lineCount * 20.0) + 16.0;
    }
    if (block.type === 'quote') {
      const lines = wrapArabicTextToLines(text, bodyFontSizePt, contentWidthPt - 20);
      const lineCount = Math.max(1, lines.length);
      return (lineCount * bodyLineHeightPt) + 16.0;
    }

    const lines = wrapArabicTextToLines(text, bodyFontSizePt, contentWidthPt);
    const lineCount = Math.max(1, lines.length);
    return (lineCount * bodyLineHeightPt) + bodyMarginBottomPt;
  };

  const estimateFootnoteHeight = (fn) => {
    const text = typeof fn === 'string' ? fn : (fn.text || '');
    if (!text.trim()) return 0;
    const lines = wrapArabicTextToLines(text, footnoteFontSizePt, contentWidthPt);
    const lineCount = Math.max(1, lines.length);
    return (lineCount * footnoteLineHeightPt) + footnoteMarginBottomPt;
  };

  const splitParagraph = (text, availableHeightPt) => {
    const minRequired = (bodyLineHeightPt * 2) + bodyMarginBottomPt;
    if (availableHeightPt < minRequired) {
      return { part1: null, part2: text };
    }

    const maxFitLines = Math.floor((availableHeightPt - bodyMarginBottomPt) / bodyLineHeightPt);
    if (maxFitLines < 2) {
      return { part1: null, part2: text };
    }

    const wrappedLines = wrapArabicTextToLines(text, bodyFontSizePt, contentWidthPt);
    if (wrappedLines.length <= maxFitLines) {
      return { part1: text, part2: null };
    }

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

    const p1Height = estimateBlockHeight({ type: 'paragraph', text: part1 });
    if (p1Height > availableHeightPt && maxFitLines > 2) {
      return splitParagraph(text, (maxFitLines - 1) * bodyLineHeightPt + bodyMarginBottomPt);
    }

    return { part1, part2 };
  };

  const arabicIndicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const toArabicIndicDigits = (num) => {
    if (num === null || num === undefined) return '';
    return String(num).replace(/\d/g, (d) => arabicIndicDigits[parseInt(d, 10)]);
  };

  const parseArabicIndicDigits = (str) => {
    if (str === null || str === undefined) return NaN;
    const normalized = String(str).replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
    const digitsOnly = normalized.replace(/[^\d]/g, '');
    return digitsOnly ? parseInt(digitsOnly, 10) : NaN;
  };

  const extractFootnotesFromText = (text) => {
    if (!text) return [];
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
  };

  const pages = [];
  let currentPageBlocks = [];
  let currentFootnoteItems = [];
  let currentBodyHeight = 0;
  let currentFootnotesHeight = 0;
  let pageNumber = startPageNumber;

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

  const commitPage = () => {
    if (currentPageBlocks.length === 0 && currentFootnoteItems.length === 0 && blockQueue.length > 0) return;
    if (currentPageBlocks.length === 0 && currentFootnoteItems.length === 0 && footnotes.length === 0) return;

    const orderedPageFootnotes = [];
    const seenIds = new Set();

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

    currentFootnoteItems.forEach((fn) => {
      if (!seenIds.has(fn.footnoteId)) {
        seenIds.add(fn.footnoteId);
        allAssignedFootnoteIds.add(fn.footnoteId);
        orderedPageFootnotes.push(fn);
      }
    });

    if (blockQueue.length === 0) {
      footnotes.forEach((fn, idx) => {
        const fnObj = footnoteMap.get(fn.footnoteId || fn.id || String(idx + 1)) || fn;
        const fid = fnObj.footnoteId || fn.footnoteId || fn.id || `fn-${topicId || 't'}-${idx + 1}`;
        if (fid && !allAssignedFootnoteIds.has(fid) && !seenIds.has(fid)) {
          seenIds.add(fid);
          allAssignedFootnoteIds.add(fid);
          orderedPageFootnotes.push({
            ...fnObj,
            footnoteId: fid,
            id: fid
          });
        }
      });
    }

    orderedPageFootnotes.sort((a, b) => {
      const orderA = footnoteOrderMap.has(a.footnoteId) ? footnoteOrderMap.get(a.footnoteId) : (footnoteOrderMap.has(a.id) ? footnoteOrderMap.get(a.id) : 999);
      const orderB = footnoteOrderMap.has(b.footnoteId) ? footnoteOrderMap.get(b.footnoteId) : (footnoteOrderMap.has(b.id) ? footnoteOrderMap.get(b.id) : 999);
      return orderA - orderB;
    });

    const markerReplacementMap = new Map();
    const finalPageFootnotes = orderedPageFootnotes.map((fn, idx) => {
      const localNum = idx + 1;
      const localNumAr = toArabicIndicDigits(localNum);
      const origNum = fn.originalNumber || (idx + 1);
      const origNumAr = toArabicIndicDigits(origNum);

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

    // Safe single-pass regex replacement
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

    pages.push({
      pageNumber,
      pageNumberAr: toArabicIndicDigits(pageNumber),
      pageType: 'topic',
      title: title || h1Title,
      topicId,
      anchorId: `page-${pageNumber}`,
      blocks: finalPageBlocks,
      footnotes: finalPageFootnotes,
      debugContentHeight: currentBodyHeight,
      debugFootnoteHeight: currentFootnotesHeight
    });

    pageNumber++;
    currentPageBlocks = [];
    currentFootnoteItems = [];
    currentBodyHeight = 0;
    currentFootnotesHeight = 0;
  };

  const blockQueue = [...blocks];

  while (blockQueue.length > 0) {
    const block = blockQueue.shift();
    const blockHeight = estimateBlockHeight(block);

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

    let additionalFnHeight = 0;
    if (currentFootnoteItems.length === 0 && blockFootnotes.length > 0) {
      additionalFnHeight += footnoteSeparatorHeightPt;
    }
    blockFootnotes.forEach((fn) => {
      additionalFnHeight += estimateFootnoteHeight(fn);
    });

    const totalProjectedHeight = currentBodyHeight + blockHeight + currentFootnotesHeight + additionalFnHeight;
    const isHeadingBlock = block.type === 'h1' || block.type === 'h2' || block.type === 'h3' ||
      block.type === 'mabhath' || block.type === 'matlab' || block.type === 'branch';

    // Heading orphan prevention: heading must have room for at least 2 lines of body text (~55.6pt)
    const minHeadingRoom = isHeadingBlock ? (blockHeight + (bodyLineHeightPt * 2) + bodyMarginBottomPt) : blockHeight;
    const totalProjectedWithMinRoom = currentBodyHeight + minHeadingRoom + currentFootnotesHeight + additionalFnHeight;

    if (totalProjectedHeight <= usableHeightPt && (!isHeadingBlock || currentPageBlocks.length === 0 || totalProjectedWithMinRoom <= usableHeightPt)) {
      currentPageBlocks.push(block);
      currentBodyHeight += blockHeight;
      if (blockFootnotes.length > 0) {
        currentFootnoteItems.push(...blockFootnotes);
        currentFootnotesHeight += additionalFnHeight;
      }
    } else {
      // Block does not fit in remaining usable space
      // Base text available space on actual current page footprint (without premature tail footnote reservations)
      const baseTextAvailable = usableHeightPt - currentBodyHeight - currentFootnotesHeight;
      const minRequired = (bodyLineHeightPt * 2) + bodyMarginBottomPt;

      if (block.type === 'paragraph' && block.text.length > 40 && baseTextAvailable >= minRequired) {
        let targetTextBudget = baseTextAvailable;
        let splitResult = splitParagraph(block.text, targetTextBudget);
        let validSplit = null;
        let validP1Fns = [];
        let validP1FnH = 0;
        let validP1Height = 0;

        while (splitResult && splitResult.part1 && splitResult.part2 && splitResult.part1.length > 15) {
          const p1Height = estimateBlockHeight({ type: 'paragraph', text: splitResult.part1 });
          const p1Fns = extractFootnotesFromText(splitResult.part1);
          let p1FnH = 0;
          const newFns = p1Fns.filter(fn => !currentFootnoteItems.some(f => f.footnoteId === fn.footnoteId));
          if (currentFootnotesHeight === 0 && newFns.length > 0) {
            p1FnH += footnoteSeparatorHeightPt;
          }
          newFns.forEach((f) => { p1FnH += estimateFootnoteHeight(f); });

          if (p1Height + p1FnH <= baseTextAvailable) {
            validSplit = splitResult;
            validP1Fns = newFns;
            validP1FnH = p1FnH;
            validP1Height = p1Height;
            break;
          } else {
            targetTextBudget = baseTextAvailable - p1FnH;
            if (targetTextBudget < minRequired) break;
            splitResult = splitParagraph(block.text, targetTextBudget);
          }
        }

        if (validSplit) {
          currentPageBlocks.push({ ...block, text: validSplit.part1 });
          currentBodyHeight += validP1Height;
          if (validP1Fns.length > 0) {
            currentFootnoteItems.push(...validP1Fns);
            currentFootnotesHeight += validP1FnH;
          }
          blockQueue.unshift({ ...block, text: validSplit.part2 });
          commitPage();
          continue;
        }
      }

      if (currentPageBlocks.length > 0) {
        blockQueue.unshift(block);
        commitPage();
      } else {
        if (block.type === 'paragraph' && blockHeight > usableHeightPt) {
          let targetBudget = usableHeightPt;
          let splitResult = splitParagraph(block.text, targetBudget);
          let validSplit = null;
          let validP1Fns = [];
          let validP1FnH = 0;
          let validP1Height = 0;

          while (splitResult && splitResult.part1 && splitResult.part2) {
            const p1Height = estimateBlockHeight({ type: 'paragraph', text: splitResult.part1 });
            const p1Fns = extractFootnotesFromText(splitResult.part1);
            let p1FnH = 0;
            if (p1Fns.length > 0) p1FnH += footnoteSeparatorHeightPt;
            p1Fns.forEach((f) => { p1FnH += estimateFootnoteHeight(f); });

            if (p1Height + p1FnH <= usableHeightPt) {
              validSplit = splitResult;
              validP1Fns = p1Fns;
              validP1FnH = p1FnH;
              validP1Height = p1Height;
              break;
            } else {
              targetBudget = usableHeightPt - p1FnH;
              if (targetBudget < minRequired) break;
              splitResult = splitParagraph(block.text, targetBudget);
            }
          }

          if (validSplit) {
            currentPageBlocks.push({ ...block, text: validSplit.part1 });
            currentBodyHeight += validP1Height;
            if (validP1Fns.length > 0) {
              currentFootnoteItems.push(...validP1Fns);
              currentFootnotesHeight += validP1FnH;
            }
            blockQueue.unshift({ ...block, text: validSplit.part2 });
            commitPage();
            continue;
          }
        }

        currentPageBlocks.push(block);
        currentBodyHeight += blockHeight;
        if (blockFootnotes.length > 0) {
          currentFootnoteItems.push(...blockFootnotes);
          currentFootnotesHeight += additionalFnHeight;
        }
        commitPage();
      }
    }
  }

  commitPage();

  return pages.length > 0 ? pages : [{
    pageNumber: startPageNumber,
    pageNumberAr: String(startPageNumber),
    pageType: 'topic',
    title: title || h1Title,
    topicId,
    anchorId: `page-${startPageNumber}`,
    blocks: blocks,
    footnotes: footnotes
  }];
}

/**
 * Paginates Introduction & Research Plan into 1 or more A4 pages
 */
export function paginateIntroductionContent({
  title = 'المقدمة وخطة البحث',
  opening = '',
  content = '',
  text = '',
  startPageNumber = 2
}) {
  let fullText = content || text || '';
  if (opening && !fullText.includes('الحمد لله رب العالمين')) {
    fullText = `${opening}\n\n${fullText}`;
  }

  const paragraphs = fullText
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

  const blocks = [
    { type: 'h1', text: title },
    ...paragraphs.map((p) => ({ type: 'paragraph', text: p }))
  ];

  const paginated = paginateTopicContent({
    title,
    h1Title: title,
    topicId: 'introduction',
    blocks,
    footnotes: [],
    startPageNumber
  });

  return paginated.map((p, idx) => ({
    ...p,
    pageType: 'introduction',
    title: idx === 0 ? title : `${title} (تابع)`,
    isContinuation: idx > 0,
    data: {
      title,
      text: fullText,
      content: fullText,
      paragraphs: (p.blocks || []).filter((b) => b.type === 'paragraph').map((b) => b.text)
    }
  }));
}

/**
 * Paginates Conclusion into 1 or more A4 pages
 */
export function paginateConclusionContent({
  title = 'الخاتمة',
  opening = '',
  points = [],
  startPageNumber = 6
}) {
  const defaultOpening = opening || '';
  const validPoints = (points || []).filter((pt) => pt && pt.trim());

  const blocks = [
    { type: 'h1', text: title },
    ...(defaultOpening.trim() ? [{ type: 'paragraph', text: defaultOpening }] : []),
    ...validPoints.map((pt, idx) => ({
      type: 'paragraph',
      text: `.${idx + 1} ${pt}`
    }))
  ];

  const paginated = paginateTopicContent({
    title,
    h1Title: title,
    topicId: 'conclusion',
    blocks,
    footnotes: [],
    startPageNumber
  });

  return paginated.map((p, idx) => ({
    ...p,
    pageType: 'conclusion',
    title: idx === 0 ? title : `${title} (تابع)`,
    isContinuation: idx > 0,
    data: {
      title,
      opening: idx === 0 ? defaultOpening : '',
      text: defaultOpening,
      points: validPoints
    }
  }));
}

/**
 * Paginates References into 1 or more A4 pages based on dynamic content height
 */
export function paginateReferencesContent({
  references = [],
  startPageNumber = 7
}) {
  const pages = [];
  let currentPage = startPageNumber;
  const contentWidthPt = 453.54;
  const maxH = 700.16; // 247mm usable height

  const refChunks = [];
  if (references.length === 0) {
    refChunks.push([]);
  } else {
    let currentChunk = [];
    let currentHeight = 40.3; // Header 'المصادر والمراجع' height (18pt + margins)

    for (const r of references) {
      const displayTxt = r.displayText || [r.book, r.author, r.publisher, r.city, r.edition, r.year].filter(Boolean).join('، ');
      const lines = wrapArabicTextToLines(displayTxt, 16, contentWidthPt - 30);
      const itemHeight = (Math.max(1, lines.length) * 24.8) + 8.0;

      if (currentHeight + itemHeight > maxH && currentChunk.length > 0) {
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

  let runningOrder = 1;
  refChunks.forEach((chunk, idx) => {
    pages.push({
      pageNumber: currentPage,
      pageNumberAr: String(currentPage),
      pageType: 'references',
      title: idx === 0 ? 'المصادر والمراجع' : 'المصادر والمراجع (تابع)',
      anchorId: `page-${currentPage}`,
      isContinuation: idx > 0,
      data: {
        references: chunk.map((r) => {
          const itemOrder = runningOrder++;
          return {
            ...r,
            order: itemOrder,
            orderAr: String(itemOrder),
            displayText: r.displayText || [r.book, r.author, r.publisher, r.city, r.edition, r.year].filter(Boolean).join('، ')
          };
        })
      }
    });
    currentPage++;
  });

  return pages;
}

/**
 * Paginates Table of Contents into 1 or more A4 pages based on dynamic content height
 */
export function paginateTOCContent({
  entries = [],
  startPageNumber = 8
}) {
  const pages = [];
  let currentPage = startPageNumber;
  const contentWidthPt = 453.54;
  const maxH = 705.83; // 249mm usable height

  const chunks = [];
  if (entries.length === 0) {
    chunks.push([]);
  } else {
    let currentChunk = [];
    let currentHeight = 40.3 + 36.0; // Header 'فهرس الموضوعات' (40.3pt) + Table Header Bar (36pt)

    for (const entry of entries) {
      const titleLen = entry.title || '';
      const lines = wrapArabicTextToLines(titleLen, entry.level === 2 ? 15 : 16, contentWidthPt - 60);
      const entryHeight = (Math.max(1, lines.length) * 24.0) + 6.0;

      if (currentHeight + entryHeight > maxH && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [entry];
        currentHeight = 40.3 + 36.0 + entryHeight;
      } else {
        currentChunk.push(entry);
        currentHeight += entryHeight;
      }
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
  }

  chunks.forEach((chunk, idx) => {
    pages.push({
      pageNumber: currentPage,
      pageNumberAr: String(currentPage),
      pageType: 'toc',
      title: idx === 0 ? 'فهرس الموضوعات' : 'فهرس الموضوعات (تابع)',
      anchorId: `page-${currentPage}`,
      isContinuation: idx > 0,
      data: {
        entries: chunk.map((e) => ({
          ...e,
          pageNumberAr: String(e.pageNumber)
        }))
      }
    });
    currentPage++;
  });

  return pages;
}
