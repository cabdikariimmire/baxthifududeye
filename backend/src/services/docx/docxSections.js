const fs = require('fs');
const path = require('path');
const {
  Paragraph,
  TextRun,
  FootnoteReferenceRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImageRun
} = require('docx');
const docxStyles = require('./docxStyles');
const { createDocxTOC } = require('./docxToc');
const { toArabicIndicDigits } = require('../document/arabic');
const {
  detectAcademicLevel,
  hasMabhathLevel,
  getHighestAcademicLevel,
  formatAcademicHeadingTitle,
  resolveAcademicHeadingStyle,
  normalizeToSemanticTree,
  stripAcademicPrefix,
  getArabicOrdinal,
  ACADEMIC_LEVELS
} = require('../document/academicHierarchy');
const { resolveLogoBuffer } = require('../document/logoResolver');

/**
 * Safely creates an ImageRun from a URL, local file path, or base64 string
 */
function createSafeLogoImage(logoUrl, customDims = null) {
  try {
    const { buffer: imageBuffer } = resolveLogoBuffer(logoUrl);

    if (imageBuffer && imageBuffer.length > 0) {
      // Base pixel calculation: 1mm ~ 3.78px
      let targetWidth = 140;
      if (customDims?.widthMm) {
        targetWidth = Math.round(customDims.widthMm * 3.78);
      } else if (customDims?.widthPx) {
        targetWidth = Math.round(customDims.widthPx);
      }

      let imgWidth = targetWidth;
      let imgHeight = targetWidth;
      const hasCustomHeight = Boolean(customDims?.heightMm || customDims?.heightPx);

      if (customDims?.heightMm) {
        imgHeight = Math.round(customDims.heightMm * 3.78);
      } else if (customDims?.heightPx) {
        imgHeight = Math.round(customDims.heightPx);
      }

      // If custom height was NOT explicitly provided, detect natural image aspect ratio to prevent distortion
      if (!hasCustomHeight) {
        try {
          if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
            // PNG
            const w = imageBuffer.readUInt32BE(16);
            const h = imageBuffer.readUInt32BE(20);
            if (w > 0 && h > 0) {
              const ratio = h / w;
              imgHeight = Math.round(targetWidth * ratio);
            }
          } else if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) {
            // JPEG / JPG
            let offset = 2;
            while (offset < imageBuffer.length) {
              if (imageBuffer[offset] !== 0xFF) break;
              const marker = imageBuffer[offset + 1];
              if (marker === 0xC0 || marker === 0xC2) {
                const h = imageBuffer.readUInt16BE(offset + 5);
                const w = imageBuffer.readUInt16BE(offset + 7);
                if (w > 0 && h > 0) {
                  const ratio = h / w;
                  imgHeight = Math.round(targetWidth * ratio);
                }
                break;
              } else {
                const len = imageBuffer.readUInt16BE(offset + 2);
                offset += 2 + len;
              }
            }
          }
        } catch (_) { /* use defaults */ }
      }

      return new ImageRun({
        data: imageBuffer,
        transformation: { width: imgWidth, height: imgHeight }
      });
    }
  } catch (err) {
    console.warn('[DOCX Logo] Could not process logo image:', err.message);
  }

  return null;
}

/**
 * Parses a paragraph text and creates TextRuns and native FootnoteReferenceRuns.
 *
 * CRITICAL REQUIREMENT:
 * When a footnote marker occurs in the main text (e.g. "... وداوم عليه (1)."):
 * - The main text stops at (1).
 * - Any text after the marker MUST start on the NEXT LINE.
 * - The footnote reference is linked to the native Word footnote area.
 * - Footnote markers and numbers are strictly black.
 */
function parseParagraphIntoRuns(text = '', topicFootnotes = [], footnoteCollector = null) {
  if (!text || typeof text !== 'string') return [];
  const markerRegex = /(\(\d+\)|\([\u0660-\u0669]+\))([.،,؛;:]?)/g;
  let lastIndex = 0;
  let match;
  const matches = [];

  while ((match = markerRegex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      marker: match[1],
      punct: match[2] || ''
    });
  }

  // If no footnote markers, return normal 16pt body text run
  if (matches.length === 0) {
    return [
      new TextRun({
        text,
        font: docxStyles.fonts.primary,
        size: docxStyles.sizes.body, // 16pt (32 half-points)
        color: '000000',
        rightToLeft: true
      })
    ];
  }

  const runs = [];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const before = text.slice(lastIndex, m.index);

    if (before) {
      runs.push(
        new TextRun({
          text: lastIndex === 0 ? before : before.trimStart(),
          font: docxStyles.fonts.primary,
          size: docxStyles.sizes.body, // 16pt (32 half-points)
          color: '000000',
          rightToLeft: true
        })
      );
    }

    // Extract number from marker e.g. (1) -> 1 or (١) -> 1
    const digits = m.marker.replace(/[^\d\u0660-\u0669]/g, '');
    const num = parseInt(digits.replace(/[\u0660-\u0669]/g, (d) => d.charCodeAt(0) - 0x0660), 10);

    // Find footnote text in topic footnotes
    const matchedFn =
      (topicFootnotes || []).find((f) => f.number === num) ||
      (topicFootnotes || [])[num - 1] ||
      {};
    const fnText = matchedFn.text || matchedFn.rawText || '';

    // If footnoteCollector is provided, add to native Word footnotes dictionary
    if (footnoteCollector && typeof footnoteCollector.addFootnote === 'function') {
      const fnId = footnoteCollector.addFootnote(fnText, num);
      runs.push(new FootnoteReferenceRun(fnId));
    } else {
      // Fallback: render black footnote marker text run
      runs.push(
        new TextRun({
          text: m.marker,
          bold: true,
          font: docxStyles.fonts.primary,
          size: docxStyles.sizes.body,
          color: '000000',
          rightToLeft: true
        })
      );
    }

    // Determine if there is remaining text after this footnote in the paragraph
    const nextIndex = m.index + m.length;
    const isLastMatch = i === matches.length - 1;
    const remainingAfter = text.slice(nextIndex).trim();
    const hasRemaining = isLastMatch ? Boolean(remainingAfter) : true;

    // Output punctuation (if any) and enforce line break so next text starts on next line
    if (m.punct) {
      runs.push(
        new TextRun({
          text: m.punct,
          font: docxStyles.fonts.primary,
          size: docxStyles.sizes.body,
          color: '000000',
          rightToLeft: true,
          break: hasRemaining ? 1 : undefined
        })
      );
    } else if (hasRemaining) {
      runs.push(
        new TextRun({
          text: '',
          break: 1
        })
      );
    }

    lastIndex = nextIndex;
  }

  const trailing = text.slice(lastIndex);
  if (trailing.trim()) {
    runs.push(
      new TextRun({
        text: trailing.trimStart(),
        font: docxStyles.fonts.primary,
        size: docxStyles.sizes.body, // 16pt (32 half-points)
        color: '000000',
        rightToLeft: true
      })
    );
  }

  return runs;
}

/**
 * Builds Cover Page Section Children
 * Respects user's custom drag-and-drop coverLayout if present,
 * or falls back to the balanced academic default layout.
 */
function buildCoverChildren(coverData = {}) {
  const children = [];
  const amiriFont = docxStyles.fonts.primary;
  const coverSize = docxStyles.sizes.cover; // 20pt (40 half-points)

  // Helper: create a centered/aligned RTL cover paragraph
  const coverPara = (text, opts = {}) =>
    new Paragraph({
      alignment: opts.alignment || AlignmentType.CENTER,
      bidirectional: true,
      spacing: opts.spacing || { before: 40, after: 40 },
      children: [
        new TextRun({
          text,
          bold: opts.bold !== undefined ? opts.bold : true,
          font: amiriFont,
          size: opts.size || coverSize,
          color: opts.color || '000000',
          rightToLeft: true
        })
      ]
    });

  const customElements = coverData.coverLayout?.elements;

  if (Array.isArray(customElements) && customElements.length > 0) {
    // Sort elements vertically by Y position
    const sorted = [...customElements].sort((a, b) => (a.y || 0) - (b.y || 0));
    let lastY = 15;

    sorted.forEach((el) => {
      const currentY = el.y || 0;
      const gapMm = Math.max(0, currentY - lastY);
      // Convert mm gap to twips: 1mm = 56.7 twips (NO arbitrary clamp)
      const spaceBeforeTwips = Math.max(0, Math.round(gapMm * 56.7));

      if (el.type === 'image') {
        const logoImg = createSafeLogoImage(el.source || coverData.logoUrl, {
          widthMm: el.width || 35,
          heightMm: el.height || 35
        });
        if (logoImg) {
          children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: spaceBeforeTwips, after: 60 },
              children: [logoImg]
            })
          );
        }
      } else if (el.type === 'pill') {
        const badgeHex = (el.badgeColor || coverData.badgeColor || '#38761d').replace('#', '').toUpperCase().padEnd(6, '0');
        const titleText = el.content || coverData.title || '';
        children.push(
          new Table({
            width: { size: Math.min(Math.max(Math.round(((el.width || 140) / 210) * 100), 40), 90), type: WidthType.PERCENTAGE },
            alignment: AlignmentType.CENTER,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: badgeHex },
                    margins: { top: 160, bottom: 160, left: 360, right: 360 },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE }
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        bidirectional: true,
                        children: [
                          new TextRun({
                            text: titleText,
                            bold: true,
                            font: amiriFont,
                            size: el.fontSize ? Math.round(el.fontSize * 2) : 41, // 20.5pt
                            color: '000000',
                            rightToLeft: true
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        );
      } else {
        const prefix = el.prefix || '';
        const rawContent = el.content || '';
        const displayText = prefix ? `${prefix}${rawContent}` : rawContent;
        if (displayText) {
          const alignment = el.textAlign === 'right' ? AlignmentType.RIGHT : (el.textAlign === 'left' ? AlignmentType.LEFT : AlignmentType.CENTER);
          children.push(
            coverPara(displayText, {
              size: el.fontSize ? Math.round(el.fontSize * 2) : 40,
              bold: el.fontWeight !== 'normal',
              alignment,
              spacing: { before: spaceBeforeTwips, after: 30 }
            })
          );
        }
      }

      lastY = currentY + (el.height || 10);
    });

    return children;
  }

  // DEFAULT BALANCED ACADEMIC LAYOUT
  // 1. Institutional Header (Country & University)
  if (coverData.country) {
    children.push(coverPara(coverData.country, {
      size: 40, // 20pt
      bold: true,
      spacing: { before: 80, after: 30 }
    }));
  }

  if (coverData.university) {
    children.push(coverPara(coverData.university, {
      size: 41, // 20.5pt
      bold: true,
      spacing: { before: 30, after: 100 }
    }));
  }

  // 2. University Logo (Prominent, Larger & Centered)
  const logoImage = createSafeLogoImage(coverData.logoUrl);
  if (logoImage) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 120 },
        children: [logoImage]
      })
    );
  } else {
    children.push(new Paragraph({ spacing: { before: 60, after: 120 }, children: [] }));
  }

  // 3. Faculty & Subject
  if (coverData.college) {
    children.push(coverPara(coverData.college, {
      size: 40, // 20pt
      bold: true,
      spacing: { before: 80, after: 30 }
    }));
  }

  if (coverData.subject) {
    children.push(coverPara(`المادة : ${coverData.subject}`, {
      size: 39, // 19.5pt
      bold: true,
      spacing: { before: 30, after: 140 }
    }));
  }

  // 4. Research Title Badge / Pill
  const badgeHex = (coverData.badgeColor || '#38761d').replace('#', '').toUpperCase().padEnd(6, '0');
  const titleText = coverData.title || '';
  if (titleText) {
    children.push(
      new Table({
        width: { size: 75, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: badgeHex },
                margins: { top: 160, bottom: 160, left: 360, right: 360 },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE }
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    bidirectional: true,
                    children: [
                      new TextRun({
                        text: titleText,
                        bold: true,
                        font: amiriFont,
                        size: 41, // 20.5pt
                        color: '000000',
                        rightToLeft: true
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      })
    );
  }

  // 5. Student Information
  if (coverData.studentName) {
    children.push(coverPara(`إعداد الطالب : ${coverData.studentName}`, {
      size: 39, // 19.5pt
      bold: true,
      spacing: { before: 160, after: 30 }
    }));
  }

  if (coverData.level) {
    children.push(coverPara(coverData.level, {
      size: 38, // 19pt
      bold: true,
      spacing: { before: 30, after: 100 }
    }));
  }

  // 6. Supervisor Information
  if (coverData.supervisor) {
    children.push(coverPara(`إشراف الدكتور : ${coverData.supervisor}`, {
      size: 39, // 19.5pt
      bold: true,
      spacing: { before: 60, after: 80 }
    }));
  }

  // 7. Semester
  if (coverData.semester) {
    children.push(coverPara(coverData.semester, {
      size: 38, // 19pt
      bold: true,
      spacing: { before: 30, after: 80 }
    }));
  }

  // 8. Academic & Gregorian Years
  if (coverData.academicYear) {
    children.push(coverPara('العام الدراسي', {
      size: 36, // 18pt
      bold: true,
      spacing: { before: 100, after: 20 }
    }));

    children.push(coverPara(coverData.academicYear, {
      size: 38, // 19pt
      bold: true,
      spacing: { before: 20, after: 40 }
    }));
  }

  if (coverData.gregorianYear) {
    children.push(coverPara('الموافق', {
      size: 34, // 17pt
      bold: true,
      spacing: { before: 30, after: 20 }
    }));

    children.push(coverPara(coverData.gregorianYear, {
      size: 38, // 19pt
      bold: true,
      spacing: { before: 20, after: 80 }
    }));
  }

  return children;
}

/**
 * Builds Introduction Section Children
 */
function buildIntroductionChildren(introData = {}, options = {}) {
  const children = [];
  const { footnoteCollector = null } = options;

  // Main Heading: 18pt (Amiri) Centered
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      keepWithNext: true,
      spacing: { before: 200, after: 180 },
      children: [
        new TextRun({
          text: 'المقدمة وخطة البحث',
          bold: true,
          font: docxStyles.fonts.headings,
          size: docxStyles.sizes.mainHeading, // Exact 18pt Main Heading
          color: '000000',
          rightToLeft: true
        })
      ]
    })
  );

  let fullContent = introData.content || introData.text || '';
  if (introData.opening && !fullContent.includes('الحمد لله رب العالمين')) {
    fullContent = `${introData.opening}\n\n${fullContent}`;
  }

  const paragraphs = fullContent
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

  paragraphs.forEach((p) => {
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        bidirectional: true,
        spacing: { before: 60, after: 100, line: 360 },
        children: parseParagraphIntoRuns(p, introData.footnotes || [], footnoteCollector)
      })
    );
  });

  return children;
}

/**
 * Creates an 18pt bold centered Mabhath heading paragraph
 */
function createMabhathHeadingParagraph(title, options = {}) {
  const { pageBreakBefore = true } = options;
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    bidirectional: true,
    keepWithNext: true,
    pageBreakBefore,
    spacing: { before: 240, after: 160 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        font: docxStyles.fonts.headings,
        size: docxStyles.sizes.mainHeading, // 18pt (36 half-points)
        color: '000000',
        rightToLeft: true
      })
    ]
  });
}

/**
 * Creates a 17pt bold right-aligned subordinate Matlab heading paragraph
 */
function createMatlabSubordinateHeadingParagraph(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    keepWithNext: true,
    pageBreakBefore: false,
    spacing: { before: 200, after: 120 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        font: docxStyles.fonts.headings,
        size: docxStyles.sizes.subHeading, // 17pt (34 half-points)
        color: '000000',
        rightToLeft: true
      })
    ]
  });
}

/**
 * Creates an 18pt bold centered main Matlab heading paragraph (when no Mabhath exists)
 */
function createMatlabMainHeadingParagraph(title, options = {}) {
  const { pageBreakBefore = false } = options;
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    bidirectional: true,
    keepWithNext: true,
    pageBreakBefore,
    spacing: { before: 240, after: 160 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        font: docxStyles.fonts.headings,
        size: docxStyles.sizes.mainHeading, // 18pt (36 half-points)
        color: '000000',
        rightToLeft: true
      })
    ]
  });
}

/**
 * Creates a 17pt bold right-aligned Branch heading paragraph
 */
function createBranchHeadingParagraph(title, isSubordinate = true) {
  return new Paragraph({
    heading: isSubordinate ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_2,
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    keepWithNext: true,
    pageBreakBefore: false,
    spacing: { before: 160, after: 100 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        font: docxStyles.fonts.headings,
        size: docxStyles.sizes.subHeading, // 17pt (34 half-points)
        color: '000000',
        rightToLeft: true
      })
    ]
  });
}

/**
 * Creates body paragraphs from text or lines, parsing native footnotes
 */
function createBodyParagraphs(text, footnotes = [], footnoteCollector = null) {
  if (!text || typeof text !== 'string') return [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      bidirectional: true,
      spacing: { before: 60, after: 100, line: 360 },
      children: parseParagraphIntoRuns(line, footnotes, footnoteCollector)
    });
  });
}

/**
 * Extracts separated section texts from rawContent when blocks are missing or need fallback
 */
function extractSectionContents(rawContent = '', branches = [], isFirstInMabhath = false) {
  if (!rawContent || !rawContent.trim()) {
    return { mabhathText: '', matlabText: '', branchTexts: {} };
  }

  const lines = rawContent.split('\n');
  let currentKey = isFirstInMabhath ? '__mabhath__' : '__matlab__';
  const sections = { __mabhath__: [], __matlab__: [] };
  (branches || []).forEach((b) => {
    sections[b.id] = [];
  });

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (/^(المبحث|مبحث)(\s+|[:：\-–—.]\s*)/i.test(trimmed)) {
      currentKey = '__mabhath__';
      return;
    }

    if (/^(المطلب|مطلب)(\s+|[:：\-–—.]\s*)/i.test(trimmed)) {
      currentKey = '__matlab__';
      return;
    }

    const matchedBranch = (branches || []).find((b) => {
      const cleanB = stripAcademicPrefix(b.title) || b.title;
      return (
        trimmed === b.title ||
        (cleanB && trimmed.includes(cleanB)) ||
        (trimmed.startsWith('الفرع') && cleanB && trimmed.includes(cleanB))
      );
    });

    if (matchedBranch) {
      currentKey = matchedBranch.id;
      return;
    }

    if (!sections[currentKey]) sections[currentKey] = [];
    sections[currentKey].push(line);
  });

  const branchTexts = {};
  (branches || []).forEach((b) => {
    branchTexts[b.id] = (sections[b.id] || []).join('\n').trim();
  });

  return {
    mabhathText: (sections.__mabhath__ || []).join('\n').trim(),
    matlabText: (sections.__matlab__ || []).join('\n').trim(),
    branchTexts
  };
}

/**
 * Extracts Mabhath intro content paragraphs and footnotes
 */
function extractMabhathContent(mabhathNode, firstChildTopic) {
  if (!firstChildTopic) return { text: '', footnotes: [] };

  if (firstChildTopic.blocks && Array.isArray(firstChildTopic.blocks) && firstChildTopic.blocks.length > 0) {
    const paragraphs = [];
    for (const b of firstChildTopic.blocks) {
      if (!b || !b.text) continue;
      const lvl = detectAcademicLevel(b);
      // Stop once we encounter a matlab heading block
      if (lvl === ACADEMIC_LEVELS.MATALAB || /^(المطلب|مطلب)(\s+|[:：\-–—.]\s*)/i.test(b.text.trim())) {
        break;
      }
      // Skip mabhath heading block itself
      if (lvl === ACADEMIC_LEVELS.MABHATH || /^(المبحث|مبحث)(\s+|[:：\-–—.]\s*)/i.test(b.text.trim())) {
        continue;
      }
      if (b.type === 'paragraph' || b.type === 'quote' || !lvl || lvl === ACADEMIC_LEVELS.BODY) {
        paragraphs.push(b.text);
      }
    }
    if (paragraphs.length > 0) {
      return { text: paragraphs.join('\n'), footnotes: firstChildTopic.footnotes || [] };
    }
  }

  if (firstChildTopic.rawContent) {
    const extracted = extractSectionContents(firstChildTopic.rawContent, firstChildTopic.branches || [], true);
    if (extracted.mabhathText) {
      return { text: extracted.mabhathText, footnotes: firstChildTopic.footnotes || [] };
    }
  }

  return { text: '', footnotes: [] };
}

/**
 * Extracts Matlab body paragraphs, branch headings, and footnotes
 */
function extractMatlabContent(matlabNode, topic, isFirstInMb = false) {
  if (!topic) return { items: [], footnotes: [] };
  const footnotes = topic.footnotes || [];
  const items = [];

  if (topic.blocks && Array.isArray(topic.blocks) && topic.blocks.length > 0) {
    let pastMatlabHeading = !isFirstInMb;
    let seenMatlabHeading = false;

    for (const b of topic.blocks) {
      if (!b || !b.text) continue;
      const textTrim = b.text.trim();
      if (!textTrim) continue;

      const lvl = detectAcademicLevel(b);

      // Skip any mabhath heading
      if (lvl === ACADEMIC_LEVELS.MABHATH || /^(المبحث|مبحث)(\s+|[:：\-–—.]\s*)/i.test(textTrim)) {
        continue;
      }

      // Detect matlab heading
      if (lvl === ACADEMIC_LEVELS.MATALAB || /^(المطلب|مطلب)(\s+|[:：\-–—.]\s*)/i.test(textTrim) || b.type === 'h1') {
        if (!seenMatlabHeading) {
          seenMatlabHeading = true;
          pastMatlabHeading = true;
          continue; // Skip the heading itself because we emit the canonical heading
        }
      }

      // If we haven't passed the matlab heading in the first topic of mabhath, skip (mabhath content)
      if (!pastMatlabHeading) {
        continue;
      }

      // Branch heading
      if (lvl === ACADEMIC_LEVELS.BRANCH || /^(الفرع|المسألة|فرع|مسألة)(\s+|[:：\-–—.]\s*)/i.test(textTrim)) {
        items.push({ type: 'branch', text: textTrim });
        continue;
      }

      // Body paragraph
      items.push({ type: 'paragraph', text: textTrim });
    }

    if (items.length > 0) {
      return { items, footnotes };
    }
  }

  // Fallback to extractSectionContents from rawContent
  if (topic.rawContent) {
    const extracted = extractSectionContents(topic.rawContent, topic.branches || [], isFirstInMb);
    if (extracted.matlabText) {
      items.push({ type: 'paragraph', text: extracted.matlabText });
    }
    (topic.branches || []).forEach((b) => {
      const bTitle = b.title || `الفرع ${b.order}`;
      items.push({ type: 'branch', text: bTitle });
      const bText = extracted.branchTexts[b.id];
      if (bText) {
        items.push({ type: 'paragraph', text: bText });
      }
    });
  }

  return { items, footnotes };
}

/**
 * Authoritative Academic Content Renderer for Word DOCX
 * Strictly follows the canonical semantic research hierarchy:
 *
 * Case A (When Mabhath exists):
 *   المبحث (18pt Bold Centered) -> [محتوى المبحث] (16pt Justified) -> المطلب (17pt Bold Right) -> [محتوى المطلب] (16pt Justified)
 *
 * Case B (When NO Mabhath exists):
 *   المطلب (18pt Bold Centered) -> [محتوى المطلب] (16pt Justified) -> الفرع (17pt Bold Right) -> [محتوى الفرع]
 */
function buildAcademicContentChildren(research = {}, options = {}) {
  const children = [];
  const { footnoteCollector = null } = options;

  const rawTopics = Array.isArray(research.topics) ? research.topics : [];
  const hasMabhath = hasMabhathLevel(rawTopics, research);

  let tree = normalizeToSemanticTree(research.structure);
  if (!tree || tree.length === 0) {
    tree = normalizeToSemanticTree(rawTopics);
  }

  // Build topic lookup maps
  const topicMap = new Map();
  rawTopics.forEach((t) => {
    if (!t) return;
    if (t.structureNodeId) topicMap.set(String(t.structureNodeId), t);
    if (t.topicId) topicMap.set(String(t.topicId), t);
    if (t.id) topicMap.set(String(t.id), t);
    if (t._id) topicMap.set(String(t._id), t);
  });

  function findTopic(node, mabhathOrder = null, matlabOrder = null) {
    if (!node) return null;
    const idStr = String(node.id);
    if (topicMap.has(idStr)) return topicMap.get(idStr);

    let found = rawTopics.find(
      (t) => String(t.structureNodeId) === idStr || String(t.topicId) === idStr
    );
    if (found) return found;

    if (node.parentId && (node.order || matlabOrder)) {
      const orderMatch = node.order || matlabOrder;
      found = rawTopics.find(
        (t) => String(t.mabhathId) === String(node.parentId) && t.matlabOrder === orderMatch
      );
      if (found) return found;
    }

    const cleanTitle = stripAcademicPrefix(node.title);
    if (cleanTitle) {
      found = rawTopics.find((t) => {
        const cleanH1 = stripAcademicPrefix(t.h1Title || t.title || '');
        return cleanH1 && (cleanH1 === cleanTitle || cleanH1.includes(cleanTitle) || cleanTitle.includes(cleanH1));
      });
      if (found) return found;
    }

    return null;
  }

  if (hasMabhath) {
    // ========================================================
    // CASE A: Research with MABAHETH Hierarchy
    // المبحث (18pt Bold Centered) -> [محتوى المبحث] -> المطلب (17pt Bold Right) -> [محتوى المطلب]
    // ========================================================
    tree.forEach((mabhathNode, mbIdx) => {
      const mbOrdinal = getArabicOrdinal(mabhathNode.order || mbIdx + 1);
      const cleanMbTitle = stripAcademicPrefix(mabhathNode.title) || mabhathNode.title;
      const mabhathFormattedTitle = `المبحث ${mbOrdinal}: ${cleanMbTitle}`;

      // 1. Emit Mabhath Heading (18pt Bold, Centered, Heading 1, Fresh Page)
      children.push(createMabhathHeadingParagraph(mabhathFormattedTitle, { pageBreakBefore: true }));

      const childMataleeb = Array.isArray(mabhathNode.children) ? mabhathNode.children : [];

      if (childMataleeb.length === 0) {
        // Leaf Mabhath with no mataleeb
        const mbTopic = findTopic(mabhathNode, mbIdx + 1) || rawTopics[mbIdx];
        if (mbTopic) {
          const content = extractMatlabContent(mabhathNode, mbTopic, false);
          content.items.forEach((item) => {
            if (item.type === 'branch') {
              children.push(createBranchHeadingParagraph(item.text, true));
            } else {
              children.push(...createBodyParagraphs(item.text, content.footnotes, footnoteCollector));
            }
          });
        }
        return;
      }

      // 2. Mabhath Content (if any)
      const firstChildTopic = findTopic(childMataleeb[0], mbIdx + 1, 1);
      const mabhathContent = extractMabhathContent(mabhathNode, firstChildTopic);
      if (mabhathContent.text) {
        children.push(...createBodyParagraphs(mabhathContent.text, mabhathContent.footnotes, footnoteCollector));
      }

      // 3. Child Mataleeb
      childMataleeb.forEach((matlabNode, mIdx) => {
        const matlabOrdinal = getArabicOrdinal(matlabNode.order || mIdx + 1);
        const cleanMatlabTitle = stripAcademicPrefix(matlabNode.title) || matlabNode.title;
        const matlabFormattedTitle = `المطلب ${matlabOrdinal}: ${cleanMatlabTitle}`;

        // Emit Matlab Subordinate Heading (17pt Bold, Right-Aligned, Heading 2, pageBreakBefore: false)
        children.push(createMatlabSubordinateHeadingParagraph(matlabFormattedTitle));

        // Matlab Content & Branches
        const topic = findTopic(matlabNode, mbIdx + 1, mIdx + 1);
        const matlabContent = extractMatlabContent(matlabNode, topic, mIdx === 0);

        matlabContent.items.forEach((item) => {
          if (item.type === 'branch') {
            children.push(createBranchHeadingParagraph(item.text, true));
          } else {
            children.push(...createBodyParagraphs(item.text, matlabContent.footnotes, footnoteCollector));
          }
        });
      });
    });
  } else {
    // ========================================================
    // CASE B: Research without Mabaheth (Mataleeb are Main Headings)
    // المطلب (18pt Bold Centered) -> [محتوى المطلب] -> الفرع (17pt Bold Right)
    // ========================================================
    tree.forEach((matlabNode, mIdx) => {
      const matlabOrdinal = getArabicOrdinal(matlabNode.order || mIdx + 1);
      const cleanMatlabTitle = stripAcademicPrefix(matlabNode.title) || matlabNode.title;
      const matlabFormattedTitle = `المطلب ${matlabOrdinal}: ${cleanMatlabTitle}`;

      // Emit Matlab Main Heading (18pt Bold, Centered, Heading 1, pageBreakBefore: mIdx > 0)
      children.push(createMatlabMainHeadingParagraph(matlabFormattedTitle, { pageBreakBefore: mIdx > 0 }));

      const topic = findTopic(matlabNode, null, mIdx + 1) || rawTopics[mIdx];
      const matlabContent = extractMatlabContent(matlabNode, topic, false);

      matlabContent.items.forEach((item) => {
        if (item.type === 'branch') {
          children.push(createBranchHeadingParagraph(item.text, false));
        } else {
          children.push(...createBodyParagraphs(item.text, matlabContent.footnotes, footnoteCollector));
        }
      });
    });
  }

  return children;
}

/**
 * Backward compatibility wrapper for buildTopicLogicalSection
 */
function buildTopicLogicalSection(topic = {}, topicIdx = 0, options = {}) {
  const { hasMabhath = false, isFirstTopic = false, footnoteCollector = null } = options;
  const dummyResearch = {
    topics: [topic],
    structure: {
      tree: [
        {
          id: topic.structureNodeId || topic.topicId || `topic-${topicIdx + 1}`,
          type: hasMabhath ? ACADEMIC_LEVELS.MABHATH : ACADEMIC_LEVELS.MATALAB,
          title: topic.h1Title || topic.title || 'الموضوع',
          order: topicIdx + 1,
          children: []
        }
      ]
    }
  };
  return buildAcademicContentChildren(dummyResearch, { footnoteCollector });
}

/**
 * Builds Conclusion Section Children
 */
function buildConclusionChildren(conclusionData = {}, options = {}) {
  const children = [];
  const { footnoteCollector = null } = options;

  // 1. Main Heading: 18pt (Amiri) Centered
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      keepWithNext: true,
      pageBreakBefore: true,
      spacing: { before: 200, after: 180 },
      children: [
        new TextRun({
          text: conclusionData.title || 'الخاتمة',
          bold: true,
          font: docxStyles.fonts.headings,
          size: docxStyles.sizes.mainHeading, // Exact 18pt Main Heading
          color: '000000',
          rightToLeft: true
        })
      ]
    })
  );

  // 2. Introductory Paragraph: 16pt (Amiri)
  const openingText =
    conclusionData.opening ||
    conclusionData.text ||
    '';

  if (openingText.trim()) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        bidirectional: true,
        spacing: { before: 80, after: 140, line: 360 },
        children: parseParagraphIntoRuns(openingText, conclusionData.footnotes || [], footnoteCollector)
      })
    );
  }

  // 3. Numbered Results List: 16pt (Amiri)
  if (conclusionData.points && Array.isArray(conclusionData.points)) {
    conclusionData.points.forEach((pt, pIdx) => {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          bidirectional: true,
          spacing: { before: 60, after: 80, line: 360 },
          children: [
            new TextRun({
              text: `${toArabicIndicDigits(pIdx + 1)}. `,
              bold: true,
              font: docxStyles.fonts.primary,
              size: docxStyles.sizes.body,
              color: '000000',
              rightToLeft: true
            }),
            new TextRun({
              text: pt,
              font: docxStyles.fonts.primary,
              size: docxStyles.sizes.body, // Exact 16pt Body
              color: '000000',
              rightToLeft: true
            })
          ]
        })
      );
    });
  }

  return children;
}

/**
 * Builds References Section Children
 */
function buildReferencesChildren(refData = {}, { pageBreakBefore = false } = {}) {
  const children = [];

  // Main Heading: 18pt (Amiri) Centered
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      keepWithNext: true,
      pageBreakBefore: pageBreakBefore,
      spacing: { before: 200, after: 180 },
      children: [
        new TextRun({
          text: 'المصادر والمراجع',
          bold: true,
          font: docxStyles.fonts.headings,
          size: docxStyles.sizes.mainHeading, // Exact 18pt Main Heading
          color: '000000',
          rightToLeft: true
        })
      ]
    })
  );

  const refsList = refData.references || [];
  refsList.forEach((ref) => {
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { before: 60, after: 80, line: 360 },
        indent: {
          right: 0,
          hanging: 360 // ~6.35mm hanging indent for the marker number
        },
        children: [
          new TextRun({
            text: `${toArabicIndicDigits(ref.order)}. `,
            bold: true,
            font: docxStyles.fonts.primary,
            size: docxStyles.sizes.body, // Exact 16pt Body
            color: '000000',
            rightToLeft: true
          }),
          new TextRun({
            text: ref.displayText || ref.book,
            font: docxStyles.fonts.primary,
            size: docxStyles.sizes.body, // Exact 16pt Body
            color: '000000',
            rightToLeft: true
          })
        ]
      })
    );
  });

  return children;
}

/**
 * Builds Table of Contents Section Children
 */
function buildTocChildren(tocEntries = [], { pageBreakBefore = false } = {}) {
  const children = [];

  // Main Heading: 18pt (Amiri) Centered
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      keepWithNext: true,
      pageBreakBefore: pageBreakBefore,
      spacing: { before: 200, after: 180 },
      children: [
        new TextRun({
          text: 'فهرس الموضوعات',
          bold: true,
          font: docxStyles.fonts.headings,
          size: docxStyles.sizes.mainHeading, // Exact 18pt Main Heading
          color: '000000',
          rightToLeft: true
        })
      ]
    })
  );

  const tocTableElements = createDocxTOC(tocEntries);
  children.push(...tocTableElements);

  return children;
}

module.exports = {
  buildCoverChildren,
  buildIntroductionChildren,
  buildAcademicContentChildren,
  buildTopicLogicalSection,
  buildConclusionChildren,
  buildReferencesChildren,
  buildTocChildren,
  parseParagraphIntoRuns,
  createSafeLogoImage
};
