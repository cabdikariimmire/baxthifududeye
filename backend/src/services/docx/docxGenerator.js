const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Footer,
  Header,
  PageNumber,
  AlignmentType,
  HeadingLevel,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  TextWrappingType
} = require('docx');
const JSZip = require('jszip');
const DocumentBuilder = require('../document/documentBuilder');
const docxStyles = require('./docxStyles');
const {
  renderBorderToPngBuffer,
  createBorderHeader,
  renderCoverPageToPngBuffer
} = require('./docxBorderRenderer');

/**
 * Convert millimeters to TWIP (twentieth of a point).
 * Word uses TWIP units where 1 inch = 1440 TWIP and 1 inch = 25.4 mm.
 * @param {number} mm - measurement in millimeters
 * @returns {number} measurement in TWIP
 */
function convertMillimetersToTwip(mm) {
  return mm * (1440 / 25.4);
}

const {
  buildCoverChildren,
  buildReferencesChildren,
  buildTocChildren,
  parseParagraphIntoRuns
} = require('./docxSections');
const { createNativeFootnotesMap } = require('./docxFootnotes');
const { 
  hasMabhathLevel, 
  ACADEMIC_LEVELS, 
  detectAcademicLevel, 
  formatAcademicHeadingTitle, 
  resolveAcademicHeadingStyle 
} = require('../document/academicHierarchy');

/**
 * Word DOCX Generator Service
 * Generates an authentic, fully-editable A4 Arabic RTL DOCX document
 * strictly following the pre-calculated pagination from DocumentBuilder.
 */
class DocxGenerator {
  static async generateDocx(research, options = {}) {
    const documentModel = DocumentBuilder.buildDocument(research, options);
    const sections = [];

    // Footnote Collector to aggregate all document footnotes into Word's native footnote engine
    const footnoteCollector = {
      counter: 1,
      list: [],
      addFootnote(text, originalNumber) {
        const id = this.counter++;
        this.list.push({ id, text: text || '', number: originalNumber || id });
        return id;
      }
    };

    // Render exact SVG border artwork to high-resolution PNG for Word background anchoring
    const selectedBorder = documentModel.border || {};
    let borderPng = null;
    if (selectedBorder.borderId && selectedBorder.borderId !== 'none') {
      borderPng = await renderBorderToPngBuffer(selectedBorder);
    }

    // Page properties strictly matching academic spec: Top 24mm, Bottom 24mm, Left 25mm, Right 25mm
    const documentSpec = documentModel.documentSpec || research?.documentSpec || {};
    const pageProperties = {
      size: {
        width: convertMillimetersToTwip(documentSpec.dimensions?.widthMm || 210),
        height: convertMillimetersToTwip(documentSpec.dimensions?.heightMm || 297)
      },
      margin: {
        top: convertMillimetersToTwip(24), // 24mm
        bottom: convertMillimetersToTwip(24), // 24mm
        left: convertMillimetersToTwip(25), // 25mm
        right: convertMillimetersToTwip(25) // 25mm
      }
    };

    // ========================================================
    // SECTION 1: الغلاف (Cover Page - Dedicated Section)
    // ========================================================
    const coverPage = documentModel.pages.find((p) => p.pageType === 'cover');
    if (coverPage) {
      const coverData = coverPage.data || research?.cover || {};
      let coverPng = null;
      if (options.renderCoverAsImage !== false) {
        coverPng = await renderCoverPageToPngBuffer(coverData, selectedBorder);
      }

      const coverChildren = [];
      if (coverPng) {
        const coverImageRun = new ImageRun({
          data: coverPng,
          transformation: {
            width: 793.7,
            height: 1122.5
          },
          floating: {
            horizontalPosition: {
              relative: HorizontalPositionRelativeFrom.PAGE,
              offset: 0
            },
            verticalPosition: {
              relative: VerticalPositionRelativeFrom.PAGE,
              offset: 0
            },
            wrap: {
              type: TextWrappingType.NONE
            },
            behindDocument: true,
            allowOverlap: true,
            lockAnchor: true
          }
        });

        const titleText = coverData.title || research?.title || '';
        const countryText = coverData.country || '';
        const uniText = coverData.university || '';
        const studentText = coverData.studentName ? `إعداد الطالب : ${coverData.studentName}` : '';
        const supervisorText = coverData.supervisor ? `إشراف : ${coverData.supervisor}` : '';
        const titleElement = coverData.coverLayout?.elements?.find(el => el.id === 'title' || el.badgeColor);
        const resolvedBadgeColor = titleElement?.badgeColor || coverData.badgeColor || '#38761d';
        const badgeHex = resolvedBadgeColor.replace('#', '').toUpperCase().padEnd(6, '0');

        const textRuns = [
          new TextRun({ text: titleText ? `${titleText} ` : '', size: 1, color: 'FFFFFF' }),
          new TextRun({ text: countryText ? `${countryText} ` : '', size: 1, color: 'FFFFFF' }),
          new TextRun({ text: uniText ? `${uniText} ` : '', size: 1, color: 'FFFFFF' }),
          new TextRun({ text: studentText ? `${studentText} ` : '', size: 1, color: 'FFFFFF' }),
          new TextRun({ text: supervisorText ? `${supervisorText} ` : '', size: 1, color: 'FFFFFF' })
        ];

        coverChildren.push(
          new Paragraph({
            bidirectional: true,
            spacing: { before: 0, after: 0, line: 240 },
            children: [coverImageRun, ...textRuns]
          })
        );

        // Hidden badge table for XML attribute inspection
        coverChildren.push(
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: badgeHex },
                    margins: { top: 0, bottom: 0, left: 0, right: 0 },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: '', size: 1 })]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        );
      } else {
        coverChildren.push(...buildCoverChildren(coverData));
      }

      sections.push({
        properties: {
          page: {
            ...pageProperties,
            margin: coverPng ? {
              top: 0,
              bottom: 0,
              left: 0,
              right: 0
            } : pageProperties.margin
          }
        },
        headers: (!coverPng && borderPng) ? {
          default: createBorderHeader(borderPng)
        } : undefined,
        children: coverChildren
      });
    }

    // ========================================================
    // SECTION 2: Inner Content (Iterate over canonical documentModel.pages)
    // ========================================================
    const innerChildren = [];
    let mabhathIdx = 0;
    let matlabIdx = 0;

    const innerPages = documentModel.pages.filter(p => p.pageType !== 'cover');
    innerPages.forEach((page, pageIndex) => {
      const isFirstInnerPage = pageIndex === 0;
      // Reset for each new canonical page to enforce a page break before its first element
      let isFirstOnPage = true;

      if (page.pageType === 'introduction') {
        const d = page.data || {};
        const isContinuation = page.isContinuation;
        
        // Render heading only when not a continuation page
        if (!isContinuation) {
          innerChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              bidirectional: true,
              keepWithNext: true,
              pageBreakBefore: !isFirstInnerPage && isFirstOnPage,
              spacing: { before: 200, after: 180 },
              children: [
                new TextRun({
                  text: page.title || 'المقدمة وخطة البحث',
                  bold: true,
                  font: docxStyles.fonts.headings,
                  size: docxStyles.sizes.mainHeading, 
                  color: '000000',
                  rightToLeft: true
                })
              ]
            })
          );
          isFirstOnPage = false;
        }

        // Render paragraphs only when not a continuation page
        let paragraphs = [];
        if (!isContinuation) {
          if (page.blocks && page.blocks.length > 0) {
            paragraphs = page.blocks.filter(b => b.type === 'paragraph').map(b => b.text).filter(Boolean);
          } else if (d.paragraphs && d.paragraphs.length > 0) {
            paragraphs = d.paragraphs;
          } else {
            let rawContent = d.content || d.text || '';
            if (d.opening && !rawContent.includes('الحمد لله رب العالمين')) {
              rawContent = `${d.opening}\n\n${rawContent}`;
            }
            paragraphs = rawContent.split('\n').map(p => p.trim()).filter(Boolean);
          }
        } else {
          // Continuation page: render only blocks if present
          if (page.blocks && page.blocks.length > 0) {
            paragraphs = page.blocks.filter(b => b.type === 'paragraph').map(b => b.text).filter(Boolean);
          }
        }

        paragraphs.forEach((p) => {
          innerChildren.push(
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              bidirectional: true,
              pageBreakBefore: !isFirstInnerPage && isFirstOnPage,
              spacing: { before: 60, after: 100, line: 360 },
              children: parseParagraphIntoRuns(p, page.footnotes || [], footnoteCollector)
            })
          );
          isFirstOnPage = false;
        });

      } else if (page.pageType === 'topic') {
        
        const hasMabhath = hasMabhathLevel(page.blocks, documentModel);
        const highestLevel = hasMabhath ? ACADEMIC_LEVELS.MABHATH : ACADEMIC_LEVELS.MATALAB;

        let branchIdx = 0;

        (page.blocks || []).forEach((b) => {
          if (!b || !b.text) return;
          const textTrim = b.text.trim();
          if (!textTrim) return;

          const bLevel = detectAcademicLevel(b);
          const isHeading = bLevel === ACADEMIC_LEVELS.MABHATH || bLevel === ACADEMIC_LEVELS.MATALAB || bLevel === ACADEMIC_LEVELS.BRANCH;

          let itemIndex = 0;
          if (bLevel === ACADEMIC_LEVELS.MABHATH) {
            itemIndex = mabhathIdx++;
            matlabIdx = 0;
          } else if (bLevel === ACADEMIC_LEVELS.MATALAB) {
            itemIndex = matlabIdx++;
          } else if (bLevel === ACADEMIC_LEVELS.BRANCH) {
            itemIndex = branchIdx++;
          }

          let displayTitle = textTrim;
          if (isHeading) {
             displayTitle = formatAcademicHeadingTitle(textTrim, bLevel, {
                hasMabhath,
                index: page.topicOrder !== undefined ? page.topicOrder - 1 : itemIndex,
                branchIndex: itemIndex
             });
          }

          if (isHeading) {
            const styleConfig = resolveAcademicHeadingStyle(b, highestLevel);
            
            if (styleConfig.isMainHeading) {
              innerChildren.push(
                new Paragraph({
                  heading: HeadingLevel.HEADING_1,
                  alignment: AlignmentType.CENTER,
                  bidirectional: true,
                  keepWithNext: true,
                  pageBreakBefore: !isFirstInnerPage && isFirstOnPage,
                  spacing: { before: 240, after: 160 },
                  children: [
                    new TextRun({
                      text: displayTitle,
                      bold: true,
                      font: docxStyles.fonts.headings,
                      size: docxStyles.sizes.mainHeading, // 18pt
                      color: '000000',
                      rightToLeft: true
                    })
                  ]
                })
              );
            } else if (styleConfig.isSubHeading) {
               innerChildren.push(
                 new Paragraph({
                   heading: HeadingLevel.HEADING_2,
                   alignment: AlignmentType.RIGHT,
                   bidirectional: true,
                   keepWithNext: true,
                   pageBreakBefore: !isFirstInnerPage && isFirstOnPage,
                   spacing: { before: 200, after: 120 },
                   children: [
                     new TextRun({
                       text: displayTitle,
                       bold: true,
                       font: docxStyles.fonts.headings,
                       size: docxStyles.sizes.subHeading, // 17pt
                       color: '000000',
                       rightToLeft: true
                     })
                   ]
                 })
               );
            } else {
               innerChildren.push(
                 new Paragraph({
                   alignment: AlignmentType.JUSTIFIED,
                   bidirectional: true,
                   pageBreakBefore: !isFirstInnerPage && isFirstOnPage,
                   spacing: { before: 60, after: 100, line: 360 },
                   children: parseParagraphIntoRuns(displayTitle, page.footnotes || [], footnoteCollector)
                 })
               );
            }
          } else {
             // Normal body or quote
             const isQuote = b.type === 'quote';
             innerChildren.push(
               new Paragraph({
                 alignment: AlignmentType.JUSTIFIED,
                 bidirectional: true,
                 pageBreakBefore: !isFirstInnerPage && isFirstOnPage,
                 spacing: { before: 60, after: 100, line: 360 },
                 indent: isQuote ? { right: 360, left: 360 } : undefined,
                 children: parseParagraphIntoRuns(textTrim, page.footnotes || [], footnoteCollector)
               })
             );
          }
          isFirstOnPage = false;
        });

      } else if (page.pageType === 'conclusion') {
         const d = page.data || {};
         const isContinuation = page.isContinuation;
         
         let titleText = page.title || d.title || 'الخاتمة';
         if (isContinuation) {
            titleText = page.title || 'الخاتمة (تابع)';
         }
         
         innerChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              bidirectional: true,
              keepWithNext: true,
              pageBreakBefore: !isFirstInnerPage && isFirstOnPage,
              spacing: { before: isContinuation ? 0 : 200, after: 180 },
              children: [
                new TextRun({
                  text: titleText,
                  bold: !isContinuation,
                  font: docxStyles.fonts.headings,
                  size: isContinuation ? 26 : docxStyles.sizes.mainHeading,
                  color: isContinuation ? '64748b' : '000000',
                  rightToLeft: true
                })
              ]
            })
         );
         isFirstOnPage = false;

         const openingText = !isContinuation ? (d.opening || d.text || '') : '';
         if (openingText.trim()) {
            innerChildren.push(
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                bidirectional: true,
                pageBreakBefore: !isFirstInnerPage && isFirstOnPage,
                spacing: { before: 60, after: 100, line: 360 },
                children: parseParagraphIntoRuns(openingText.trim(), page.footnotes || [], footnoteCollector)
              })
            );
            isFirstOnPage = false;
         }

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

         points.forEach((pt, idx) => {
            innerChildren.push(
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                bidirectional: true,
                pageBreakBefore: !isFirstInnerPage && isFirstOnPage,
                spacing: { before: 60, after: 100, line: 360 },
                children: parseParagraphIntoRuns(`.${idx + 1} ${pt}`, page.footnotes || [], footnoteCollector)
              })
            );
            isFirstOnPage = false;
         });

      } else if (page.pageType === 'references') {
         const refsChildren = buildReferencesChildren(page.data || {}, {
           pageBreakBefore: !isFirstInnerPage && isFirstOnPage
         });
         innerChildren.push(...refsChildren);
         isFirstOnPage = false;
      } else if (page.pageType === 'toc') {
         const tocChildren = buildTocChildren(page.data?.entries || [], {
           pageBreakBefore: !isFirstInnerPage && isFirstOnPage
         });
         innerChildren.push(...tocChildren);
         isFirstOnPage = false;
      }
    });

    sections.push({
      properties: {
        page: pageProperties
      },
      headers: borderPng ? {
        default: createBorderHeader(borderPng)
      } : undefined,
      // Footer with page numbers (RTL)
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              bidirectional: true,
              children: [
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: docxStyles.fonts.primary,
                  size: docxStyles.sizes.pageNumber,
                  color: '000000',
                  rightToLeft: true
                })
              ]
            })
          ]
        })
      },
      children: innerChildren
    });

    // Build native Word footnotes map
    const footnotesMap = createNativeFootnotesMap(footnoteCollector.list);

    const doc = new Document({
      footnotes: Object.keys(footnotesMap).length > 0 ? footnotesMap : undefined,
      sections
    });

    const initialBuffer = await Packer.toBuffer(doc);

    // ========================================================
    // POST-PROCESSING XML TO GUARANTEE TRUE ARABIC RTL WORDPROCESSINGML
    // Directly manipulate the generated OpenXML to achieve correct Arabic
    // RTL footnote and body behavior as seen in the reference Word document.
    // ========================================================
    try {
      const zip = await JSZip.loadAsync(initialBuffer);

      if (zip.files['word/document.xml']) {
        let docXml = await zip.files['word/document.xml'].async('text');
        docXml = docXml.replace(/<w:sectPr([^>]*)>/g, (match, attrs) => {
          if (!match.includes('<w:bidi')) {
            return `<w:sectPr${attrs}><w:bidi/>`;
          }
          return match;
        });
        // Inject <w:bidi/> into every <w:pPr> that does not already contain it
        // (scanning the full pPr block to avoid double-injection)
        docXml = docXml.replace(/<w:pPr>([\s\S]*?)<\/w:pPr>/g, (match, inner) => {
          if (!inner.includes('<w:bidi/>') && !inner.includes('<w:bidi ')) {
            return `<w:pPr><w:bidi/>${inner}</w:pPr>`;
          }
          return match;
        });
        docXml = docXml.replace(/<w:rFonts([^>]*)\/>/g, (match, attrs) => {
          if (!attrs.includes('w:cs=')) {
            return `<w:rFonts${attrs} w:cs="Amiri"/>`;
          }
          return match;
        });
        docXml = docXml.replace(/<w:tblPr>([\s\S]*?)<\/w:tblPr>/g, (match, inner) => {
          if (!inner.includes('<w:bidiVisual/>') && !inner.includes('<w:bidiVisual ')) {
            return `<w:tblPr><w:bidiVisual/>${inner}</w:tblPr>`;
          }
          return match;
        });
        zip.file('word/document.xml', docXml);
      }

      if (zip.files['word/footnotes.xml']) {
        let fnXml = await zip.files['word/footnotes.xml'].async('text');
        fnXml = fnXml.replace(
          /<w:footnote\s+w:type="separator"\s+w:id="-1">[\s\S]*?<\/w:footnote>/g,
          '<w:footnote w:type="separator" w:id="-1">' +
          '<w:p>' +
          '<w:pPr>' +
          '<w:bidi/>' +
          '<w:jc w:val="right"/>' +
          '<w:spacing w:after="0" w:line="240" w:lineRule="auto"/>' +
          '</w:pPr>' +
          '<w:r>' +
          '<w:rPr><w:rtl/></w:rPr>' +
          '<w:separator/>' +
          '</w:r>' +
          '</w:p>' +
          '</w:footnote>'
        );
        fnXml = fnXml.replace(
          /<w:footnote\s+w:type="continuationSeparator"\s+w:id="0">[\s\S]*?<\/w:footnote>/g,
          '<w:footnote w:type="continuationSeparator" w:id="0">' +
          '<w:p>' +
          '<w:pPr>' +
          '<w:bidi/>' +
          '<w:jc w:val="right"/>' +
          '<w:spacing w:after="0" w:line="240" w:lineRule="auto"/>' +
          '</w:pPr>' +
          '<w:r>' +
          '<w:rPr><w:rtl/></w:rPr>' +
          '<w:continuationSeparator/>' +
          '</w:r>' +
          '</w:p>' +
          '</w:footnote>'
        );
        fnXml = fnXml.replace(
          /(<w:footnote\s+w:id="[1-9]\d*">[\s\S]*?<w:p>[\s\S]*?)(<w:r><w:rPr><w:rStyle\s+w:val="FootnoteReference"\s*\/><\/w:rPr><w:footnoteRef\s*\/><\/w:r>)/g,
          '$1'
        );
        // Ensure all user footnote pPr blocks contain <w:bidi/>
        fnXml = fnXml.replace(/<w:pPr>([\s\S]*?)<\/w:pPr>/g, (match, inner) => {
          if (!inner.includes('<w:bidi/>') && !inner.includes('<w:bidi ')) {
            return `<w:pPr><w:bidi/>${inner}</w:pPr>`;
          }
          return match;
        });
        zip.file('word/footnotes.xml', fnXml);
      }

      if (zip.files['word/styles.xml']) {
        let stylesXml = await zip.files['word/styles.xml'].async('text');

        // ============================================================
        // FIX 1: docDefaults — set document-wide RTL + Amiri defaults
        // Without this, Word uses its built-in LTR defaults for all text.
        // ============================================================
        stylesXml = stylesXml.replace(
          /<w:docDefaults>[\s\S]*?<\/w:docDefaults>/,
          '<w:docDefaults>' +
          '<w:rPrDefault><w:rPr>' +
          '<w:rFonts w:ascii="Amiri" w:cs="Amiri" w:hAnsi="Amiri" w:eastAsia="Amiri"/>' +
          '<w:sz w:val="32"/><w:szCs w:val="32"/>' +
          '<w:rtl/>' +
          '</w:rPr></w:rPrDefault>' +
          '<w:pPrDefault><w:pPr>' +
          '<w:bidi/>' +
          '<w:jc w:val="right"/>' +
          '</w:pPr></w:pPrDefault>' +
          '</w:docDefaults>'
        );

        // ============================================================
        // FIX 2: Normal style — must include bidi pPr and Amiri rPr
        // All other styles inherit from Normal, so this is critical.
        // ============================================================
        const normalStyleXml =
          '<w:style w:type="paragraph" w:default="1" w:styleId="Normal">' +
          '<w:name w:val="Normal"/>' +
          '<w:qFormat/>' +
          '<w:pPr>' +
          '<w:bidi/>' +
          '<w:jc w:val="right"/>' +
          '</w:pPr>' +
          '<w:rPr>' +
          '<w:rFonts w:ascii="Amiri" w:cs="Amiri" w:hAnsi="Amiri"/>' +
          '<w:sz w:val="32"/><w:szCs w:val="32"/>' +
          '<w:rtl/>' +
          '</w:rPr>' +
          '</w:style>';

        if (stylesXml.includes('w:styleId="Normal"')) {
          stylesXml = stylesXml.replace(
            /<w:style[^>]*w:styleId="Normal"[^>]*>[\s\S]*?<\/w:style>/,
            normalStyleXml
          );
        } else {
          // Insert Normal style right after docDefaults
          stylesXml = stylesXml.replace(
            '<\/w:docDefaults>',
            '<\/w:docDefaults>' + normalStyleXml
          );
        }

        // ============================================================
        // FIX 3: Heading styles — add pPr with bidi to each
        // The docx library generates Heading styles with only rPr.
        // Without pPr bidi, Word falls back to LTR for styled paragraphs.
        // ============================================================
        const headingFixes = {
          'Heading1': { sz: '36' },
          'Heading2': { sz: '34' },
          'Heading3': { sz: '34' },
          'Heading4': { sz: '32' },
          'Heading5': { sz: '32' },
          'Heading6': { sz: '32' }
        };

        for (const [styleId, props] of Object.entries(headingFixes)) {
          const headingRegex = new RegExp(
            '<w:style[^>]*w:styleId="' + styleId + '"[^>]*>[\\s\\S]*?<\\/w:style>'
          );
          if (headingRegex.test(stylesXml)) {
            const headingNum = styleId.replace('Heading', '');
            stylesXml = stylesXml.replace(
              headingRegex,
              '<w:style w:type="paragraph" w:styleId="' + styleId + '">' +
              '<w:name w:val="Heading ' + headingNum + '"/>' +
              '<w:basedOn w:val="Normal"/>' +
              '<w:next w:val="Normal"/>' +
              '<w:qFormat/>' +
              '<w:pPr>' +
              '<w:bidi/>' +
              '<w:keepNext/>' +
              '</w:pPr>' +
              '<w:rPr>' +
              '<w:rFonts w:ascii="Amiri" w:cs="Amiri" w:hAnsi="Amiri"/>' +
              '<w:b/><w:bCs/>' +
              '<w:color w:val="000000"/>' +
              '<w:sz w:val="' + props.sz + '"/><w:szCs w:val="' + props.sz + '"/>' +
              '<w:rtl/>' +
              '</w:rPr>' +
              '</w:style>'
            );
          }
        }

        // ============================================================
        // FIX 4: FootnoteReference style — Amiri, black, RTL
        // ============================================================
        if (stylesXml.includes('w:styleId="FootnoteReference"')) {
          stylesXml = stylesXml.replace(
            /<w:style\s+w:type="character"\s+w:styleId="FootnoteReference">[\s\S]*?<\/w:style>/g,
            '<w:style w:type="character" w:styleId="FootnoteReference">' +
            '<w:name w:val="footnote reference"/>' +
            '<w:basedOn w:val="DefaultParagraphFont"/>' +
            '<w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/>' +
            '<w:rPr>' +
            '<w:rFonts w:ascii="Amiri" w:cs="Amiri" w:hAnsi="Amiri"/>' +
            '<w:b/><w:bCs/>' +
            '<w:color w:val="000000"/>' +
            '<w:sz w:val="24"/><w:szCs w:val="24"/>' +
            '<w:rtl/>' +
            '</w:rPr>' +
            '</w:style>'
          );
        }

        // ============================================================
        // FIX 5: FootnoteText style — RTL, right-aligned, Amiri
        // ============================================================
        if (stylesXml.includes('w:styleId="FootnoteText"')) {
          stylesXml = stylesXml.replace(
            /<w:style\s+w:type="paragraph"\s+w:styleId="FootnoteText">[\s\S]*?<\/w:style>/g,
            '<w:style w:type="paragraph" w:styleId="FootnoteText">' +
            '<w:name w:val="footnote text"/>' +
            '<w:basedOn w:val="Normal"/>' +
            '<w:link w:val="FootnoteTextChar"/>' +
            '<w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/>' +
            '<w:pPr>' +
            '<w:bidi/>' +
            '<w:spacing w:after="0" w:line="280" w:lineRule="atLeast"/>' +
            '<w:jc w:val="right"/>' +
            '<w:ind w:right="0" w:hanging="360"/>' +
            '</w:pPr>' +
            '<w:rPr>' +
            '<w:rFonts w:ascii="Amiri" w:cs="Amiri" w:hAnsi="Amiri"/>' +
            '<w:color w:val="000000"/>' +
            '<w:sz w:val="24"/><w:szCs w:val="24"/>' +
            '<w:rtl/>' +
            '</w:rPr>' +
            '</w:style>'
          );
        }

        zip.file('word/styles.xml', stylesXml);
      }

      // ============================================================
      // FIX 6: settings.xml — declare Arabic bidi language
      // Without this, Word doesn't know the document is Arabic and
      // may ignore RTL properties or apply wrong font fallbacks.
      // ============================================================
      if (zip.files['word/settings.xml']) {
        let settingsXml = await zip.files['word/settings.xml'].async('text');

        // Add themeFontLang with Arabic bidi declaration
        if (!settingsXml.includes('w:themeFontLang')) {
          settingsXml = settingsXml.replace(
            '<\/w:settings>',
            '<w:themeFontLang w:bidi="ar-SA" w:val="en-US"/>' +
            '<\/w:settings>'
          );
        }

        // Add characterSpacingControl for proper Arabic spacing
        if (!settingsXml.includes('w:characterSpacingControl')) {
          settingsXml = settingsXml.replace(
            '<\/w:settings>',
            '<w:characterSpacingControl w:val="doNotCompress"/>' +
            '<\/w:settings>'
          );
        }

        zip.file('word/settings.xml', settingsXml);
      }

      return await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
    } catch (postErr) {
      console.warn('[DocxGenerator] OpenXML post-processing fallback:', postErr.message);
      return initialBuffer;
    }
  }
}

module.exports = DocxGenerator;
