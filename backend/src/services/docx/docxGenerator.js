const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Footer,
  PageNumber,
  AlignmentType
} = require('docx');
const JSZip = require('jszip');
const DocumentBuilder = require('../document/documentBuilder');
const docxStyles = require('./docxStyles');
const {
  buildCoverChildren,
  buildIntroductionChildren,
  buildAcademicContentChildren,
  buildTopicLogicalSection,
  buildConclusionChildren,
  buildReferencesChildren,
  buildTocChildren
} = require('./docxSections');
const { createNativeFootnotesMap } = require('./docxFootnotes');
const { hasMabhathLevel } = require('../document/academicHierarchy');

/**
 * Word DOCX Generator Service
 * Generates an authentic, fully-editable A4 Arabic RTL DOCX document
 * consuming the exact same logical document model as PDF and Web preview.
 *
 * CRITICAL ARABIC WORD FOOTNOTE FEATURES:
 * - Native Microsoft Word footnotes (placed in the Word footnote area at the bottom of pages)
 * - RTL footnote separator line starting on the Arabic RIGHT margin extending to the left
 * - Footnote markers in body text stop the current line and force following text to start on the next line
 * - Footnote markers and numbers are strictly black
 * - Dynamic academic heading hierarchy (المبحث 18pt Center / المطلب 17pt Right / الفرع 17pt Right)
 * - 16pt Normal body text with clean RTL paragraph direction
 * - Standard A4 geometry with 25mm academic margins
 */
class DocxGenerator {
  /**
   * Generates a DOCX Buffer from a research document
   * @param {Object} research - Research Mongoose model or plain object
   * @param {Object} options - Generation options
   * @returns {Promise<Buffer>}
   */
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

    // Resolve selected border for DOCX
    const selectedBorder = documentModel.border || {};
    let pageBordersConfig = undefined;

    if (selectedBorder.borderId && selectedBorder.borderId !== 'none') {
      const docxB = selectedBorder.docxBorder || { style: 'double', size: 12, color: 'DAA520' };
      if (docxB.style !== 'none') {
        const borderStyle = docxB.style || 'double';
        const borderColor = (docxB.color || 'DAA520').replace('#', '');
        const borderSize = docxB.size || 12;

        pageBordersConfig = {
          pageBorderTop: { style: borderStyle, size: borderSize, color: borderColor },
          pageBorderBottom: { style: borderStyle, size: borderSize, color: borderColor },
          pageBorderLeft: { style: borderStyle, size: borderSize, color: borderColor },
          pageBorderRight: { style: borderStyle, size: borderSize, color: borderColor }
        };
      }
    }

    const pageProperties = {
      ...docxStyles.page,
      ...(pageBordersConfig ? { borders: pageBordersConfig } : {})
    };

    // ========================================================
    // SECTION 1: الغلاف (Cover Page - Dedicated Section without Footer)
    // ========================================================
    const coverPage = documentModel.pages.find((p) => p.pageType === 'cover');
    const coverData = coverPage?.data || research?.cover || {};
    const coverChildren = buildCoverChildren(coverData);

    sections.push({
      properties: {
        page: pageProperties
      },
      children: coverChildren
    });

    // ========================================================
    // SECTION 2: Inner Content (Intro, Topics, Conclusion, References, TOC)
    // Flowing naturally with native Word footnotes and footer page numbers
    // ========================================================
    const innerChildren = [];

    // 1. Introduction & Research Plan
    const introPage = documentModel.pages.find((p) => p.pageType === 'introduction');
    const introData = introPage?.data || research?.introduction || {};
    innerChildren.push(...buildIntroductionChildren(introData, { footnoteCollector }));

    // 2. Academic Research Topics (Mabahith, Mataleeb, Branches & Content)
    // Strictly follows canonical semantic hierarchy: المبحث -> [محتوى المبحث] -> المطلب -> [محتوى المطلب]
    innerChildren.push(...buildAcademicContentChildren(research, { footnoteCollector, documentModel }));

    // 3. Conclusion
    const conclusionPage = documentModel.pages.find((p) => p.pageType === 'conclusion');
    const conclusionData = conclusionPage?.data || research?.conclusion || {};
    innerChildren.push(...buildConclusionChildren(conclusionData, { footnoteCollector }));

    // 4. References
    const refPage = documentModel.pages.find((p) => p.pageType === 'references');
    const refData = refPage?.data || research?.references || {};
    innerChildren.push(...buildReferencesChildren(refData));

    // 5. Table of Contents
    const tocEntries = documentModel.toc || [];
    innerChildren.push(...buildTocChildren(tocEntries));

    sections.push({
      properties: {
        page: pageProperties
      },
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
    // ========================================================
    // POST-PROCESSING XML TO GUARANTEE TRUE ARABIC RTL WORDPROCESSINGML
    // Directly manipulate the generated OpenXML to achieve correct Arabic
    // RTL footnote and body behavior as seen in the reference Word document.
    // ========================================================
    try {
      const zip = await JSZip.loadAsync(initialBuffer);

      // 1. Process document.xml for Section RTL, Paragraph bidi, and Table bidiVisual
      if (zip.files['word/document.xml']) {
        let docXml = await zip.files['word/document.xml'].async('text');

        // A. Inject <w:bidi/> into all <w:sectPr> section properties
        docXml = docXml.replace(/<w:sectPr([^>]*)>/g, (match, attrs) => {
          if (!match.includes('<w:bidi')) {
            return `<w:sectPr${attrs}><w:bidi/>`;
          }
          return match;
        });

        // B. Ensure all paragraph properties have <w:bidi/>
        docXml = docXml.replace(/<w:pPr>(?!<w:bidi\/>)/g, '<w:pPr><w:bidi/>');

        // C. Ensure all text runs with Arabic font have complex script mapping
        docXml = docXml.replace(/<w:rFonts([^>]*)\/>/g, (match, attrs) => {
          if (!attrs.includes('w:cs=')) {
            return `<w:rFonts${attrs} w:cs="Amiri"/>`;
          }
          return match;
        });

        // D. Ensure tables have <w:bidiVisual/> for RTL column layout
        docXml = docXml.replace(/<w:tblPr>(?!<w:bidiVisual\/>)/g, '<w:tblPr><w:bidiVisual/>');

        zip.file('word/document.xml', docXml);
      }

      // 2. Process footnotes.xml for RTL separator and native Arabic footnote structure
      if (zip.files['word/footnotes.xml']) {
        let fnXml = await zip.files['word/footnotes.xml'].async('text');

        // A. Clean and replace separator footnote (id="-1")
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

        // B. Clean and replace continuation separator footnote (id="0")
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

        // C. Remove duplicate <w:footnoteRef/> in regular footnotes if present
        fnXml = fnXml.replace(
          /(<w:footnote\s+w:id="[1-9]\d*">[\s\S]*?<w:p>[\s\S]*?)(<w:r><w:rPr><w:rStyle\s+w:val="FootnoteReference"\s*\/><\/w:rPr><w:footnoteRef\s*\/><\/w:r>)/g,
          '$1'
        );

        // D. Ensure all footnote paragraphs have <w:bidi/>
        fnXml = fnXml.replace(
          /(<w:footnote\s+w:id="[1-9]\d*">[\s\S]*?<w:pPr>)(?!<w:bidi\/>)/g,
          '$1<w:bidi/>'
        );

        zip.file('word/footnotes.xml', fnXml);
      }

      // 3. Process styles.xml for FootnoteReference and FootnoteText styles
      if (zip.files['word/styles.xml']) {
        let stylesXml = await zip.files['word/styles.xml'].async('text');

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
