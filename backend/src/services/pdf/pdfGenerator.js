const puppeteer = require('puppeteer');
const DocumentBuilder = require('../document/documentBuilder');
const defaultBorders = require('../document/defaultBorders');
const documentSpec = require('../document/documentSpec');
const { resolveLogoBase64 } = require('../document/logoResolver');
const {
  detectAcademicLevel,
  hasMabhathLevel,
  getHighestAcademicLevel,
  formatAcademicHeadingTitle,
  resolveAcademicHeadingStyle,
  ACADEMIC_LEVELS
} = require('../document/academicHierarchy');

/**
 * Server-Side A4 RTL PDF Generator
 * Strict A4 (210mm x 297mm) renderer with letter-grouped bibliography and structured TOC.
 */
class PDFGenerator {
  /**
   * Builds standalone HTML representation of the complete research document
   */
  static buildDocumentHTML(documentModel) {
    const { pages, border, title } = documentModel;

    const getDefaultCoverElements = (d = {}) => [
      { id: 'country', type: 'text', fieldKey: 'country', label: 'الدولة', content: d.country || '', x: 25, y: 26, width: 160, height: 9, fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#0f172a', zIndex: 1 },
      { id: 'university', type: 'text', fieldKey: 'university', label: 'الجامعة', content: d.university || '', x: 25, y: 37, width: 160, height: 9, fontSize: 20.5, fontWeight: 'bold', textAlign: 'center', color: '#0f172a', zIndex: 1 },
      { id: 'logo', type: 'image', fieldKey: 'logoUrl', label: 'شعار الجامعة', source: d.logoUrl || '', x: 87.5, y: 50, width: 35, height: 35, aspectRatio: 1, zIndex: 2 },
      { id: 'college', type: 'text', fieldKey: 'college', label: 'الكلية', content: d.college || '', x: 25, y: 92, width: 160, height: 9, fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#0f172a', zIndex: 1 },
      { id: 'subject', type: 'text', fieldKey: 'subject', label: 'المادة', prefix: 'المادة : ', content: d.subject || '', x: 25, y: 103, width: 160, height: 9, fontSize: 19.5, fontWeight: 'bold', textAlign: 'center', color: '#1e293b', zIndex: 1 },
      { id: 'title', type: 'pill', fieldKey: 'title', label: 'عنوان البحث', content: d.title || '', badgeColor: d.badgeColor || '#38761d', x: 35, y: 121, width: 140, height: 16, fontSize: 20.5, fontWeight: 'bold', textAlign: 'center', color: '#0f172a', zIndex: 3 },
      { id: 'studentName', type: 'text', fieldKey: 'studentName', label: 'اسم الطالب', prefix: 'إعداد الطالب : ', content: d.studentName || '', x: 25, y: 148, width: 160, height: 9, fontSize: 19.5, fontWeight: 'bold', textAlign: 'center', color: '#1e293b', zIndex: 1 },
      { id: 'level', type: 'text', fieldKey: 'level', label: 'المستوى الدراسي', content: d.level || '', x: 25, y: 159, width: 160, height: 9, fontSize: 19, fontWeight: 'bold', textAlign: 'center', color: '#334155', zIndex: 1 },
      { id: 'supervisor', type: 'text', fieldKey: 'supervisor', label: 'المشرف العلمي', prefix: 'إشراف الدكتور : ', content: d.supervisor || '', x: 25, y: 170, width: 160, height: 9, fontSize: 19.5, fontWeight: 'bold', textAlign: 'center', color: '#1e293b', zIndex: 1 },
      { id: 'semester', type: 'text', fieldKey: 'semester', label: 'الفصل الدراسي', content: d.semester || '', x: 25, y: 181, width: 160, height: 9, fontSize: 18.5, fontWeight: 'bold', textAlign: 'center', color: '#334155', zIndex: 1 },
      { id: 'academicYearLabel', type: 'text', fieldKey: 'academicYearLabel', label: 'تسمية العام الدراسي', content: d.academicYear ? 'العام الدراسي' : '', x: 25, y: 194, width: 160, height: 9, fontSize: 18.5, fontWeight: 'bold', textAlign: 'center', color: '#1e293b', zIndex: 1 },
      { id: 'academicYear', type: 'text', fieldKey: 'academicYear', label: 'العام الجامعي الهجري', content: d.academicYear || '', x: 25, y: 203, width: 160, height: 9, fontSize: 18.5, fontWeight: 'bold', textAlign: 'center', color: '#334155', zIndex: 1 },
      { id: 'gregorianYearLabel', type: 'text', fieldKey: 'gregorianYearLabel', label: 'تسمية العام الميلادي', content: d.gregorianYear ? 'الموافق' : '', x: 25, y: 214, width: 160, height: 9, fontSize: 17.5, fontWeight: 'bold', textAlign: 'center', color: '#1e293b', zIndex: 1 },
      { id: 'gregorianYear', type: 'text', fieldKey: 'gregorianYear', label: 'العام الميلادي', content: d.gregorianYear || '', x: 25, y: 223, width: 160, height: 9, fontSize: 18.5, fontWeight: 'bold', textAlign: 'center', color: '#334155', zIndex: 1 }
    ];

    const pagesHtml = pages.map((page) => {
      let contentHtml = '';

      if (page.pageType === 'cover') {
        const d = page.data || {};
        const coverElements = (d.coverLayout?.elements && Array.isArray(d.coverLayout.elements) && d.coverLayout.elements.length > 0)
          ? d.coverLayout.elements
          : getDefaultCoverElements(d);

        const elementsHtml = coverElements.map((el) => {
          const prefix = el.prefix || '';
          const raw = el.content || (d[el.fieldKey || el.id] || '');
          const displayText = prefix ? `${prefix}${raw}` : raw;

          if (el.type === 'image') {
            const logoSrc = resolveLogoBase64(el.source || d.logoUrl);
            if (!logoSrc) return '';
            return `
              <div class="pdf-cover-element" style="position: absolute; left: ${el.x}mm; top: ${el.y}mm; width: ${el.width}mm; height: ${el.height ? el.height + 'mm' : 'auto'}; z-index: ${el.zIndex || 2}; display: flex; align-items: center; justify-content: center; box-sizing: border-box;">
                <img src="${logoSrc}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="شعار الجامعة" />
              </div>
            `;
          }

          if (el.type === 'pill') {
            const titleText = displayText || d.title || '';
            if (!titleText) return '';
            const bg = el.badgeColor || d.badgeColor || '#38761d';
            return `
              <div class="pdf-cover-element" style="position: absolute; left: ${el.x}mm; top: ${el.y}mm; width: ${el.width}mm; height: ${el.height ? el.height + 'mm' : 'auto'}; z-index: ${el.zIndex || 3}; display: flex; align-items: center; justify-content: center; box-sizing: border-box;">
                <div style="background-color: ${bg}; border-radius: 9999px; padding: 6px 24px; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.08); box-sizing: border-box;">
                  <span style="font-family: 'Amiri', serif; font-size: ${el.fontSize || 20.5}pt; font-weight: bold; color: #111827; text-align: center; direction: rtl; word-break: break-word; line-height: 1.2;">${titleText}</span>
                </div>
              </div>
            `;
          }

          if (!displayText) return '';
          const align = el.textAlign === 'right' ? 'right' : (el.textAlign === 'left' ? 'left' : 'center');
          const justify = el.textAlign === 'right' ? 'flex-start' : (el.textAlign === 'left' ? 'flex-end' : 'center');

          return `
            <div class="pdf-cover-element" style="position: absolute; left: ${el.x}mm; top: ${el.y}mm; width: ${el.width}mm; height: ${el.height ? el.height + 'mm' : 'auto'}; z-index: ${el.zIndex || 1}; display: flex; align-items: center; justify-content: ${justify}; text-align: ${align}; box-sizing: border-box;">
              <span style="font-family: 'Amiri', serif; font-size: ${el.fontSize || 20}pt; font-weight: ${el.fontWeight || 'bold'}; color: ${el.color || '#0f172a'}; width: 100%; direction: rtl; line-height: 1.2;">${displayText}</span>
            </div>
          `;
        }).join('');

        contentHtml = `
          <div class="a4-cover-layer" style="position: absolute; inset: 0; width: 210mm; height: 297mm; z-index: 2; overflow: hidden;">
            ${elementsHtml}
          </div>
        `;
      } else if (page.pageType === 'introduction') {
        const d = page.data || {};
        const isContinuation = page.isContinuation;
        let paragraphs = [];
        if (page.blocks && page.blocks.length > 0) {
          paragraphs = page.blocks
            .filter((b) => b.type === 'paragraph')
            .map((b) => b.text)
            .filter(Boolean);
        } else if (d.paragraphs && d.paragraphs.length > 0) {
          paragraphs = d.paragraphs;
        } else {
          let rawContent = d.content || d.text || '';
          if (d.opening && !rawContent.includes('الحمد لله رب العالمين')) {
            rawContent = `${d.opening}\n\n${rawContent}`;
          }
          paragraphs = rawContent
            .split('\n')
            .map((p) => p.trim())
            .filter(Boolean);
        }

        contentHtml = `
          <div class="inner-page">
            ${!isContinuation ? `<h1 class="main-heading page-title">${page.title || 'المقدمة وخطة البحث'}</h1>` : `<div style="font-size: 13pt; color: #64748b; font-family: 'Amiri', serif; font-weight: bold; margin-bottom: 8px;">${page.title || 'المقدمة وخطة البحث (تابع)'}</div>`}
            <div class="intro-flow">
              ${paragraphs.map((p) => `<p class="body-text">${p}</p>`).join('\n              ')}
            </div>
          </div>
        `;
      } else if (page.pageType === 'topic') {
        const formatParagraphWithFootnotes = (text) => {
          if (!text) return '';
          return text
            .replace(/\n/g, '<br/>')
            .replace(/(\(\d+\)|\([\u0660-\u0669]+\))([.،,؛;:]?)/g, '<span class="inline-footnote-marker">$1$2</span><br/>');
        };

        const hasMabhath = hasMabhathLevel(page.blocks, documentModel);
        const highestLevel = hasMabhath ? ACADEMIC_LEVELS.MABHATH : ACADEMIC_LEVELS.MATALAB;

        const normalizedBlocks = [];
        (page.blocks || []).forEach((block) => {
          if (!block || !block.text) return;
          const textTrim = block.text.trim();
          if (!textTrim) return;

          const level = detectAcademicLevel(block);
          if (level === ACADEMIC_LEVELS.MABHATH || level === ACADEMIC_LEVELS.MATALAB || level === ACADEMIC_LEVELS.BRANCH) {
            normalizedBlocks.push({ type: level, text: textTrim });
            return;
          }

          if (block.type === 'quote') {
            normalizedBlocks.push({ type: 'quote', text: block.text });
            return;
          }

          const lines = block.text.split('\n');
          let currentParagraphLines = [];

          const flushParagraph = () => {
            if (currentParagraphLines.length > 0) {
              const pText = currentParagraphLines.join('\n').trim();
              if (pText) {
                normalizedBlocks.push({ type: 'paragraph', text: pText });
              }
              currentParagraphLines = [];
            }
          };

          lines.forEach((line) => {
            const lineTrim = line.trim();
            if (!lineTrim) {
              flushParagraph();
              return;
            }

            const lineLevel = detectAcademicLevel(lineTrim);
            if (lineLevel === ACADEMIC_LEVELS.MABHATH || lineLevel === ACADEMIC_LEVELS.MATALAB || lineLevel === ACADEMIC_LEVELS.BRANCH) {
              flushParagraph();
              normalizedBlocks.push({ type: lineLevel, text: lineTrim });
            } else {
              currentParagraphLines.push(line);
            }
          });

          flushParagraph();
        });

        let mabhathIdx = 0;
        let matlabIdx = 0;
        let branchIdx = 0;

        const blocksHtml = normalizedBlocks.map((b) => {
          const bLevel = detectAcademicLevel(b);
          const isHeading = bLevel === ACADEMIC_LEVELS.MABHATH || bLevel === ACADEMIC_LEVELS.MATALAB || bLevel === ACADEMIC_LEVELS.BRANCH;
          
          let itemIndex = 0;
          if (bLevel === ACADEMIC_LEVELS.MABHATH) itemIndex = mabhathIdx++;
          else if (bLevel === ACADEMIC_LEVELS.MATALAB) itemIndex = matlabIdx++;
          else if (bLevel === ACADEMIC_LEVELS.BRANCH) itemIndex = branchIdx++;

          const displayTitle = isHeading
            ? formatAcademicHeadingTitle(b.text, bLevel, {
                hasMabhath,
                index: page.topicOrder !== undefined ? page.topicOrder - 1 : itemIndex,
                branchIndex: itemIndex
              })
            : b.text;

          const styleConfig = resolveAcademicHeadingStyle(b, highestLevel);
          if (styleConfig.isMainHeading) {
            return `<h1 class="topic-h1" style="font-size: 18pt; font-weight: bold; text-align: center; font-family: 'Amiri', serif; direction: rtl; margin-top: 8pt; margin-bottom: 8pt;">${displayTitle}</h1>`;
          }
          if (styleConfig.isSubHeading) {
            return `<h2 class="topic-h2" style="font-size: 17pt; font-weight: bold; text-align: right; font-family: 'Amiri', serif; direction: rtl; margin-top: 10pt; margin-bottom: 8pt;">${displayTitle}</h2>`;
          }
          if (b.type === 'quote') {
            return `<blockquote class="topic-quote" style="font-size: 16pt; font-family: 'Amiri', serif; direction: rtl;">${formatParagraphWithFootnotes(b.text)}</blockquote>`;
          }
          return `<p class="topic-p" style="font-size: 16pt; font-weight: normal; text-align: justify; font-family: 'Amiri', serif; direction: rtl;">${formatParagraphWithFootnotes(b.text)}</p>`;
        }).join('');

        const footnotesHtml = (page.footnotes || []).map((fn) => `
          <div class="footnote-item" id="${fn.footnoteId || `fn-${fn.number}`}">
            <span class="fn-num">${fn.marker || `(${fn.numberAr || fn.number})`}</span>
            <span class="fn-text">${fn.text}</span>
          </div>
        `).join('');

        contentHtml = `
          <div class="inner-page topic-page">
            <div class="topic-content">
              ${blocksHtml}
            </div>
            ${page.footnotes && page.footnotes.length > 0 ? `
              <div class="footnotes-container">
                <div class="footnote-separator"></div>
                ${footnotesHtml}
              </div>
            ` : ''}
          </div>
        `;
      } else if (page.pageType === 'conclusion') {
        const d = page.data || {};
        const isContinuation = page.isContinuation;
        const openingText = !isContinuation ? (d.opening || d.text || '') : '';

        let points = d.points || [];
        if (page.blocks && page.blocks.length > 0) {
          const pointBlocks = page.blocks.filter((b) => b.type === 'paragraph');
          if (pointBlocks.length > 0 && isContinuation) {
            points = pointBlocks.map((b) => b.text.replace(/^\.\d+\s*/, ''));
          } else if (pointBlocks.length > 0 && !isContinuation) {
            const numberedOnly = pointBlocks.filter((b) => /^\.\d+/.test(b.text.trim()));
            if (numberedOnly.length > 0) {
              points = numberedOnly.map((b) => b.text.replace(/^\.\d+\s*/, ''));
            }
          }
        }

        contentHtml = `
          <div class="inner-page">
            ${!isContinuation ? `<h1 class="page-title">${page.title || d.title || 'الخاتمة'}</h1>` : `<div style="font-size: 13pt; color: #64748b; font-family: 'Amiri', serif; font-weight: bold; margin-bottom: 8px;">${page.title || 'الخاتمة (تابع)'}</div>`}
            ${openingText.trim() ? `<p class="body-text">${openingText}</p>` : ''}
            <div class="conclusion-points">
              ${points.map((pt, idx) => `
                <div class="point-row">
                  <span class="pt-num">.${idx + 1}</span>
                  <span class="pt-text">${pt}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else if (page.pageType === 'references') {
        const d = page.data;
        contentHtml = `
          <div class="inner-page">
            <h1 class="page-title">${page.title}</h1>
            <div class="references-list">
              ${(d.references || []).map((ref) => `
                <div class="ref-row">
                  <span class="ref-num">${ref.orderAr || ref.order}.</span>
                  <span class="ref-text">${ref.displayText || ref.book}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else if (page.pageType === 'toc') {
        const d = page.data;
        contentHtml = `
          <div class="inner-page">
            <h1 class="page-title">${page.title}</h1>
            <div class="toc-table">
              <div class="toc-header-bar">
                <span class="col-title">الموضوع</span>
                <span class="col-page">الصفحة</span>
              </div>
              <div class="toc-rows">
                ${(d.entries || []).map((entry) => `
                  <a href="#${entry.anchorId || entry.targetId}" class="toc-row level-${entry.level}">
                    <span class="entry-title">${entry.title}</span>
                    <span class="entry-leader"></span>
                    <span class="entry-page">${entry.pageNumberAr || entry.pageNumber}</span>
                  </a>
                `).join('')}
              </div>
            </div>
          </div>
        `;
      }

      const isCover = page.pageType === 'cover';

      return `
        <div class="a4-page" id="${page.anchorId}">
          <div class="border-layer">
            ${border ? border.svgPattern : ''}
          </div>
          ${isCover ? contentHtml : `
            <div class="page-body">
              ${contentHtml}
            </div>
            <div class="page-footer">
              <span class="page-number">${page.pageNumberAr || page.pageNumber}</span>
            </div>
          `}
        </div>
      `;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cairo:wght@400;600;700;800&family=Scheherazade+New:wght@400;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Amiri', 'Traditional Arabic', serif;
      direction: rtl;
      text-align: right;
      background-color: #f1f5f9;
      color: #111827;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .a4-page {
      position: relative;
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      background: #ffffff;
      page-break-after: always;
      overflow: hidden;
      box-sizing: border-box;
    }
    .border-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 210mm;
      height: 297mm;
      pointer-events: none;
      z-index: 1;
    }
    .page-body {
      position: absolute;
      top: 24mm;
      bottom: 24mm;
      right: 25mm;
      left: 25mm;
      z-index: 2;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      font-family: 'Amiri', serif;
    }
    .page-footer {
      position: absolute;
      bottom: 12mm;
      left: 0;
      right: 0;
      text-align: center;
      z-index: 2;
    }
    .page-number {
      font-family: 'Amiri', serif;
      font-size: 14pt;
      color: #334155;
    }

    /* Inner Page Styles */
    .inner-page {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: 'Amiri', serif;
    }
    .main-heading, .page-title, .topic-h1 {
      font-family: 'Amiri', serif !important;
      font-size: 18pt !important; /* Exact 18pt Main Headings Centered */
      font-weight: 700 !important;
      text-align: center !important;
      margin-left: auto !important;
      margin-right: auto !important;
      margin-top: 8pt !important;
      margin-bottom: 8pt !important;
      color: #0f172a !important;
      width: 100% !important;
      display: block !important;
      direction: rtl !important;
    }
    .sub-heading, .subheading, .topic-h2, .topic-h3, .page-h2-subheading {
      font-family: 'Amiri', serif !important;
      font-size: 17pt !important; /* Exact 17pt Subheadings Right-Aligned */
      font-weight: 700 !important;
      text-align: right !important;
      margin-top: 10pt !important;
      margin-bottom: 8pt !important;
      color: #0f172a !important;
      width: 100% !important;
      display: block !important;
      direction: rtl !important;
    }
    .body-text, .topic-p {
      font-family: 'Amiri', serif !important;
      font-size: 16pt !important; /* Exact 16pt Body */
      font-weight: 400 !important;
      line-height: 1.55 !important;
      text-align: justify !important;
      margin-top: 0 !important;
      margin-bottom: 6pt !important;
      color: #0f172a !important;
      direction: rtl !important;
    }
    .inline-footnote-marker {
      font-family: 'Amiri', serif !important;
      font-size: 13pt !important;
      font-weight: 700 !important;
      color: #000000 !important; /* Solid Black Footnote Marker */
      margin: 0 3px !important;
      padding: 0 2px !important;
      display: inline-block !important;
      vertical-align: baseline !important;
      direction: rtl !important;
      white-space: nowrap !important;
    }
    .topic-quote {
      font-size: 16pt;
      padding: 6px 14px;
      margin: 8px 0;
      border-right: 3px solid #0f766e;
      background: #fdfaf7;
      font-style: italic;
    }
    .topic-page {
      justify-content: space-between;
    }
    .footnotes-container {
      margin-top: auto;
      /* 10px padding + 8px top margin + 1.5px line + 6px bottom margin
         occupies 25.5px / 19.125pt, matching the measured A4 preview. */
      padding-top: 10px;
      width: 100%;
    }
    .footnote-separator {
      width: 38mm; /* Exact 38mm separator line */
      height: 1.5px;
      background-color: #000000;
      margin-top: 8px;
      margin-bottom: 6px;
      margin-right: 0;
      margin-left: auto;
    }
    .footnote-item {
      font-family: 'Amiri', serif !important;
      font-size: 12pt !important; /* Exact 12pt Footnotes */
      line-height: 1.35 !important;
      margin-bottom: 4px;
      text-align: justify;
      color: #1e293b;
    }
    .fn-num {
      font-weight: bold;
      margin-left: 4px;
      color: #000000 !important;
    }

    /* Conclusion */
    .conclusion-points {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 6px;
    }
    .point-row {
      display: flex;
      gap: 8px;
      font-size: 16pt; /* Exact 16pt Body */
      line-height: 1.55;
      text-align: justify;
    }
    .pt-num {
      font-weight: bold;
      color: #0f766e;
    }

    /* References Continuous List */
    .references-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 8px;
    }
    .ref-row {
      display: flex;
      gap: 8px;
      font-size: 16pt; /* Exact 16pt Body */
      line-height: 1.55;
      text-align: justify;
    }
    .ref-num {
      font-weight: bold;
      color: #0f766e;
      min-width: 24px;
    }

    /* Table of Contents */
    .toc-table {
      width: 100%;
      margin-top: 8px;
    }
    .toc-header-bar {
      display: flex;
      justify-content: space-between;
      padding: 6px 12px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      font-family: 'Amiri', serif !important;
      font-weight: 700;
      font-size: 16pt;
      margin-bottom: 12px;
      color: #000000;
    }
    .toc-rows {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .toc-row {
      display: flex;
      align-items: baseline;
      text-decoration: none;
      color: #0f172a;
      font-family: 'Amiri', serif;
      font-size: 16pt; /* Exact 16pt */
    }
    .toc-row.level-2 {
      padding-right: 18px;
      font-size: 15pt;
      color: #334155;
    }
    .entry-title {
      white-space: nowrap;
      font-weight: 600;
    }
    .entry-leader {
      flex: 1;
      border-bottom: 1.5px dotted #64748b;
      margin: 0 8px;
      height: 1px;
    }
    .entry-page {
      font-weight: bold;
      color: #0f766e;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
  }

  /**
   * Generates a PDF buffer from research data using Puppeteer
   */
  static async generatePDF(research, options = {}) {
    const documentModel = DocumentBuilder.buildDocument(research, options);
    const html = this.buildDocumentHTML(documentModel);

    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--font-render-hinting=none'
        ]
      });

      const page = await browser.newPage();
      try {
        await page.setContent(html, { waitUntil: 'load', timeout: 8000 });
      } catch (e) {
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 5000 });
      }

      const pdfResult = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true
      });

      return Buffer.isBuffer(pdfResult) ? pdfResult : Buffer.from(pdfResult);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  static async generatePdf(research, options = {}) {
    return this.generatePDF(research, options);
  }
}

module.exports = PDFGenerator;
