const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const DocxGenerator = require('../src/services/docx/docxGenerator');

describe('Arabic RTL Alignment Acceptance Test', () => {
  const mockResearch = {
    title: 'أحكام الكفالة والضمان في الفقه الإسلامي',
    borderId: 'none',
    cover: {
      country: 'جمهورية الصومال الفيدرالية',
      university: 'جامعة هرمود',
      title: 'أحكام الكفالة والضمان في الفقه الإسلامي',
      logoUrl: ''
    },
    introduction: {
      opening: 'الحمد لله رب العالمين، والصلاة والسلام على أشرف الأنبياء والمرسلين.',
      text: 'هذه مقدمة البحث التي تبين خطة البحث وأهميته وأهدافه في الشريعة الإسلامية.'
    },
    topics: [
      {
        topicId: 't1',
        order: 1,
        h1Title: 'المطلب الأول: تعريف الكفالة ومشروعيتها',
        rawContent: 'الكفالة لغة الضم (1). واصطلاحا ضم ذمة إلى ذمة في المطالبة بالحق.\nالفرع الأول: المعنى اللغوي والاصطلاحي\nوقد ثبتت مشروعيتها بالكتاب والسنة والإجماع.',
        blocks: [
          { type: 'h1', text: 'المطلب الأول: تعريف الكفالة ومشروعيتها' },
          { type: 'paragraph', text: 'الكفالة لغة الضم (1). واصطلاحا ضم ذمة إلى ذمة في المطالبة بالحق.' },
          { type: 'branch', text: 'الفرع الأول: المعنى اللغوي والاصطلاحي' },
          { type: 'paragraph', text: 'وقد ثبتت مشروعيتها بالكتاب والسنة والإجماع.' }
        ],
        footnotes: [
          {
            footnoteId: 'fn-t1-1',
            number: 1,
            marker: '(1)',
            text: 'ابن منظور، لسان العرب، دار صادر، مادة كفل'
          }
        ]
      }
    ],
    conclusion: {
      title: 'الخاتمة',
      opening: 'الحمد لله الذي بنعمته تتم الصالحات.',
      points: [
        'الكفالة عقد تبرع مشروع لحفظ الحقوق.',
        'يشترط في الكفيل أهلية التصرف والرضا.'
      ]
    },
    references: [
      { order: 1, book: 'ابن قدامة، المغني، دار إحياء التراث العربي' },
      { order: 2, book: 'النووي، المجموع شرح المهذب، دار الفكر' }
    ],
    toc: [
      { title: 'المقدمة وخطة البحث', pageNumber: 2, level: 1 },
      { title: 'المطلب الأول: تعريف الكفالة ومشروعيتها', pageNumber: 3, level: 1 },
      { title: 'الفرع الأول: المعنى اللغوي والاصطلاحي', pageNumber: 3, level: 2 },
      { title: 'الخاتمة', pageNumber: 4, level: 1 },
      { title: 'المصادر والمراجع', pageNumber: 5, level: 1 }
    ]
  };

  test('1. Arabic content paragraphs and branch headings use strict RTL direction and right alignment in DOM', () => {
    const a4PagePath = path.resolve(__dirname, '../../frontend/src/components/common/A4Page.jsx');
    const a4Content = fs.readFileSync(a4PagePath, 'utf8');

    // Sheet and content layer must enforce RTL
    assert.ok(a4Content.includes('className="a4-sheet" id={page.anchorId} dir="rtl"'));
    assert.ok(a4Content.includes('className="a4-content-layer" dir="rtl" style={{ direction: \'rtl\', textAlign: \'right\' }}'));

    // Sub-headings (الفرع) must have right alignment and RTL direction
    assert.ok(a4Content.includes('textAlign: \'right\''));
    assert.ok(a4Content.includes('direction: \'rtl\''));

    // CSS must enforce right-aligned sub-headings and justified/RTL body text
    const cssPath = path.resolve(__dirname, '../../frontend/src/styles/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    assert.ok(cssContent.includes('.sub-heading,'));
    assert.ok(cssContent.includes('text-align: right !important;'));
    assert.ok(cssContent.includes('direction: rtl !important;'));
  });

  test('2. Footnote markers follow RTL direction and isolate bidi in text and page bottom', () => {
    const a4PagePath = path.resolve(__dirname, '../../frontend/src/components/common/A4Page.jsx');
    const a4Content = fs.readFileSync(a4PagePath, 'utf8');

    // Inline footnote markers must have RTL direction and unicodeBidi: isolate
    assert.ok(a4Content.includes('className="inline-footnote-marker"'));
    assert.ok(a4Content.includes('unicodeBidi: \'isolate\''));

    // Page footnote item and separator must be right-aligned
    assert.ok(a4Content.includes('className="page-footnotes-container mt-3 pt-1" dir="rtl"'));
    assert.ok(a4Content.includes('marginRight: 0, marginLeft: \'auto\''));

    const cssPath = path.resolve(__dirname, '../../frontend/src/styles/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    assert.ok(cssContent.includes('unicode-bidi: isolate !important;'));
    assert.ok(cssContent.includes('.page-footnotes-separator'));
    assert.ok(cssContent.includes('margin-right: 0 !important;'));
    assert.ok(cssContent.includes('margin-left: auto !important;'));
  });

  test('3. References section uses RTL direction, right-aligned text, and preserves numbering', () => {
    const a4PagePath = path.resolve(__dirname, '../../frontend/src/components/common/A4Page.jsx');
    const a4Content = fs.readFileSync(a4PagePath, 'utf8');

    // References container must have dir="rtl" and right-alignment
    assert.ok(a4Content.includes('case \'references\':'));
    assert.ok(a4Content.includes('dir="rtl" style={{ direction: \'rtl\', textAlign: \'right\' }}'));
    assert.ok(a4Content.includes('{ref.orderAr || ref.order}.'));
    assert.ok(a4Content.includes('{ref.displayText || ref.book}'));
  });

  test('4. Table of Contents: topic title right-aligned, page number left-aligned, structure preserved', async () => {
    const a4PagePath = path.resolve(__dirname, '../../frontend/src/components/common/A4Page.jsx');
    const a4Content = fs.readFileSync(a4PagePath, 'utf8');

    // Browser TOC preview header and rows
    assert.ok(a4Content.includes('case \'toc\':'));
    assert.ok(a4Content.includes('<span className="text-right" style={{ textAlign: \'right\' }}>الموضوع</span>'));
    assert.ok(a4Content.includes('<span className="text-left" style={{ textAlign: \'left\' }}>الصفحة</span>'));
    assert.ok(a4Content.includes('className="text-right whitespace-nowrap" dir="rtl" style={{ textAlign: \'right\' }}'));
    assert.ok(a4Content.includes('className="font-bold font-amiri text-black text-left"'));
    assert.ok(a4Content.includes('style={{ textAlign: \'left\', minWidth: \'24px\' }}'));

    // DOCX TOC table: page column left-aligned, topic title right-aligned
    const docxBuf = await DocxGenerator.generateDocx(mockResearch);
    const zip = await JSZip.loadAsync(docxBuf);
    const docXml = await zip.files['word/document.xml'].async('text');

    assert.ok(docXml.includes('فهرس الموضوعات'));
    assert.ok(docXml.includes('الموضوع'));
    assert.ok(docXml.includes('الصفحة'));
    assert.ok(docXml.includes('<w:jc w:val="left"/>'));
    assert.ok(docXml.includes('<w:jc w:val="right"/>'));
  });
});
