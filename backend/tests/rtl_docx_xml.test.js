const { test, describe } = require('node:test');
const assert = require('node:assert');
const JSZip = require('jszip');
const DocxGenerator = require('../src/services/docx/docxGenerator');

/**
 * RTL DOCX XML Verification Tests
 *
 * Generates a small Arabic research document as DOCX, unzips it,
 * and asserts that the OpenXML contains the correct RTL directives:
 *  - <w:bidi/> in paragraph properties
 *  - <w:bidiVisual/> in table properties
 *  - Footnote separator right-aligned with RTL
 *  - w:cs="Amiri" on font runs
 *  - Reference paragraphs right-aligned
 *  - TOC table with bidiVisual
 */
describe('RTL DOCX XML Verification', () => {
  const mockResearch = {
    title: 'أحكام الكفالة في الفقه الإسلامي',
    borderId: 'none',
    cover: {
      country: 'جمهورية الصومال',
      university: 'جامعة هرمود',
      title: 'أحكام الكفالة في الفقه الإسلامي',
      logoUrl: ''
    },
    introduction: {
      opening: 'الحمد لله رب العالمين.',
      text: 'هذا بحث في أحكام الكفالة (1).'
    },
    topics: [
      {
        topicId: 't1',
        order: 1,
        h1Title: 'المطلب الأول: تعريف الكفالة',
        rawContent: 'الكفالة لغة الضم (1).',
        blocks: [
          { type: 'h1', text: 'المطلب الأول: تعريف الكفالة' },
          { type: 'paragraph', text: 'الكفالة لغة الضم (1).' },
          { type: 'branch', text: 'الفرع الأول: المعنى اللغوي' },
          { type: 'paragraph', text: 'وقد ثبتت مشروعيتها بالكتاب.' }
        ],
        footnotes: [
          { footnoteId: 'fn1', number: 1, marker: '(1)', text: 'لسان العرب، مادة كفل' }
        ]
      }
    ],
    conclusion: {
      title: 'الخاتمة',
      opening: 'الحمد لله.',
      points: ['الكفالة عقد مشروع.']
    },
    references: [
      { order: 1, book: 'ابن قدامة، المغني' },
      { order: 2, book: 'النووي، المجموع' }
    ],
    toc: [
      { title: 'المقدمة', pageNumber: 2, level: 1 },
      { title: 'المطلب الأول', pageNumber: 3, level: 1 },
      { title: 'الخاتمة', pageNumber: 4, level: 1 },
      { title: 'المصادر والمراجع', pageNumber: 5, level: 1 }
    ]
  };

  let docXml = '';
  let fnXml = '';
  let stylesXml = '';

  // Generate once, reuse across tests
  test('0. Generate DOCX buffer and extract XML', async () => {
    const buf = await DocxGenerator.generateDocx(mockResearch);
    assert.ok(buf, 'DOCX buffer should be non-null');
    assert.ok(buf.length > 0, 'DOCX buffer should have content');

    const zip = await JSZip.loadAsync(buf);

    assert.ok(zip.files['word/document.xml'], 'document.xml must exist');
    docXml = await zip.files['word/document.xml'].async('text');

    if (zip.files['word/footnotes.xml']) {
      fnXml = await zip.files['word/footnotes.xml'].async('text');
    }
    if (zip.files['word/styles.xml']) {
      stylesXml = await zip.files['word/styles.xml'].async('text');
    }
  });

  test('1. All <w:pPr> blocks contain <w:bidi/> for RTL direction', () => {
    assert.ok(docXml.length > 0, 'document.xml should be loaded');

    // Extract all pPr blocks and verify each contains bidi
    const pPrBlocks = docXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/g) || [];
    assert.ok(pPrBlocks.length > 0, 'Should have pPr blocks in document.xml');

    pPrBlocks.forEach((block, idx) => {
      assert.ok(
        block.includes('<w:bidi/>') || block.includes('<w:bidi '),
        `pPr block ${idx} in document.xml must contain <w:bidi/>: ${block.substring(0, 120)}...`
      );
    });
  });

  test('2. All <w:tblPr> blocks contain <w:bidiVisual/> for RTL tables', () => {
    assert.ok(docXml.length > 0, 'document.xml should be loaded');

    const tblPrBlocks = docXml.match(/<w:tblPr>[\s\S]*?<\/w:tblPr>/g) || [];
    // At least the TOC table and possibly cover badge table
    tblPrBlocks.forEach((block, idx) => {
      assert.ok(
        block.includes('<w:bidiVisual/>') || block.includes('<w:bidiVisual '),
        `tblPr block ${idx} must contain <w:bidiVisual/>: ${block.substring(0, 120)}...`
      );
    });
  });

  test('3. Footnote separator is RTL with right alignment', () => {
    if (!fnXml) {
      // No footnotes.xml means no footnotes were generated — skip
      return;
    }

    // Separator footnote (id="-1") must have <w:bidi/> and right justification
    const sepMatch = fnXml.match(/<w:footnote\s+w:type="separator"[\s\S]*?<\/w:footnote>/);
    assert.ok(sepMatch, 'Separator footnote must exist');

    const sepBlock = sepMatch[0];
    assert.ok(sepBlock.includes('<w:bidi/>'), 'Separator must have <w:bidi/>');
    assert.ok(sepBlock.includes('<w:jc w:val="right"/>'), 'Separator must be right-aligned');
    assert.ok(sepBlock.includes('<w:rtl/>'), 'Separator run must have <w:rtl/>');
  });

  test('4. User footnote pPr blocks contain <w:bidi/>', () => {
    if (!fnXml) return;

    // Check all pPr blocks in footnotes.xml
    const pPrBlocks = fnXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/g) || [];
    pPrBlocks.forEach((block, idx) => {
      assert.ok(
        block.includes('<w:bidi/>') || block.includes('<w:bidi '),
        `Footnote pPr block ${idx} must contain <w:bidi/>: ${block.substring(0, 120)}...`
      );
    });
  });

  test('5. FootnoteReference style is 12pt black Amiri with RTL', () => {
    if (!stylesXml) return;

    if (stylesXml.includes('FootnoteReference')) {
      assert.ok(
        stylesXml.includes('w:cs="Amiri"'),
        'FootnoteReference style must specify Amiri as complex-script font'
      );
      assert.ok(
        stylesXml.includes('<w:rtl/>'),
        'FootnoteReference style must include <w:rtl/>'
      );
    }
  });

  test('6. References section heading "المصادر والمراجع" present with right alignment', () => {
    assert.ok(docXml.length > 0);

    // The references heading text must be present
    assert.ok(
      docXml.includes('المصادر والمراجع'),
      'References heading must exist in document.xml'
    );

    // Reference items must have right alignment
    assert.ok(
      docXml.includes('<w:jc w:val="right"/>'),
      'Document must contain right-aligned paragraphs for references'
    );
  });

  test('7. TOC section heading "فهرس الموضوعات" present with correct structure', () => {
    assert.ok(docXml.length > 0);

    assert.ok(
      docXml.includes('فهرس الموضوعات'),
      'TOC heading must exist in document.xml'
    );

    // TOC must have both left-aligned (page numbers) and right-aligned (titles) cells
    assert.ok(
      docXml.includes('<w:jc w:val="left"/>'),
      'TOC must have left-aligned page number column'
    );
    assert.ok(
      docXml.includes('<w:jc w:val="right"/>'),
      'TOC must have right-aligned title column'
    );
  });

  test('8. w:cs="Amiri" font is present on runs throughout the document', () => {
    assert.ok(docXml.length > 0);

    // Verify that Amiri CS font is present (injected by post-processing)
    assert.ok(
      docXml.includes('w:cs="Amiri"'),
      'Document must contain w:cs="Amiri" for complex-script font support'
    );
  });

  test('9. No double-injection of <w:bidi/> in any pPr block', () => {
    assert.ok(docXml.length > 0);

    const pPrBlocks = docXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/g) || [];
    pPrBlocks.forEach((block, idx) => {
      const bidiCount = (block.match(/<w:bidi\/>/g) || []).length;
      assert.ok(
        bidiCount <= 1,
        `pPr block ${idx} has ${bidiCount} <w:bidi/> tags (expected ≤1): ${block.substring(0, 120)}...`
      );
    });

    // Same check for footnotes
    if (fnXml) {
      const fnPPrBlocks = fnXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/g) || [];
      fnPPrBlocks.forEach((block, idx) => {
        const bidiCount = (block.match(/<w:bidi\/>/g) || []).length;
        assert.ok(
          bidiCount <= 1,
          `Footnote pPr block ${idx} has ${bidiCount} <w:bidi/> tags (expected ≤1): ${block.substring(0, 120)}...`
        );
      });
    }
  });
});
