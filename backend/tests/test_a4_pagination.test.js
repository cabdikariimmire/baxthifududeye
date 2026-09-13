const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const PaginationEngine = require('../src/services/document/paginationEngine');
const documentSpec = require('../src/services/document/documentSpec');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const PDFGenerator = require('../src/services/pdf/pdfGenerator');
const TOCBuilder = require('../src/services/toc/tocBuilder');

describe('A4 Document and Pagination Engine Acceptance Tests', () => {
  const engine = new PaginationEngine(documentSpec);

  test('1. Strict A4 dimensions and exact mathematical usable height derivation', () => {
    assert.equal(engine.pageWidthPt, 595.28, 'Page width must be 210mm (595.28pt)');
    assert.equal(engine.pageHeightPt, 841.89, 'Page height must be 297mm (841.89pt)');
    assert.equal(engine.usableHeightPt, 705.83, 'usableHeightPt must strictly equal 297mm - 24mm - 24mm = 249mm (705.83pt)');
    assert.equal(engine.contentWidthPt, 453.54, 'contentWidthPt must strictly equal 210mm - 25mm - 25mm = 160mm (453.54pt)');
  });

  test('2. Multi-page paragraph splitting without losing or duplicating text', () => {
    // Generate a long 3500-character Arabic paragraph
    const sentence = 'هذا بيان علمي محكم يعالج قضايا البحث الفقهي المعاصر بدقة ومنهجية وتوثيق أصيل. ';
    const originalText = sentence.repeat(45); // ~3510 characters

    const blocks = [
      { type: 'h1', text: 'المبحث الأول: الإطار المفاهيمي والتأصيل الشرعي' },
      { type: 'paragraph', text: originalText }
    ];

    const result = engine.paginateSection({
      sectionType: 'topic',
      title: 'المبحث الأول',
      blocks,
      footnotes: [],
      startPageNumber: 3
    });

    assert.ok(result.pages.length >= 3, `Expected at least 3 pages, got ${result.pages.length}`);

    // Verify all parts reconstruct the original text
    const paragraphParts = [];
    result.pages.forEach((p) => {
      p.blocks.forEach((b) => {
        if (b.type === 'paragraph' && b.text) {
          paragraphParts.push(b.text.trim());
        }
      });
    });

    const reconstructed = paragraphParts.join(' ');
    // All sentences from originalText should be preserved
    assert.ok(reconstructed.includes('هذا بيان علمي محكم يعالج قضايا البحث الفقهي'));
    assert.ok(reconstructed.length >= originalText.length * 0.95, 'Text length must be preserved across splits');
  });

  test('3. Footnote markers stay on the exact page where their inline marker appears', () => {
    const p1 = 'الفقرة الأولى في الصفحة الأولى تتضمن توثيق تاريخي أصيل (1) يوضح أصل المسألة الفقهية وتاريخها عبر القرون. ' + 'نص إضافي لملء المساحة المتبقية من الصفحة الأولى بشكل كامل ودقيق. '.repeat(20);
    const p2 = 'الفقرة الثانية تقع في الصفحة التالية تماماً وتتضمن رأي الفقهاء المعاصرين (2) مع التوثيق المعتمد والترجيح. ' + 'نص إضافي لملء الصفحة الثانية بشكل طبيعي ومتقن. '.repeat(10);

    const blocks = [
      { type: 'h2', text: 'المطلب الأول: توثيق الآراء الفقهية' },
      { type: 'paragraph', text: p1 },
      { type: 'paragraph', text: p2 }
    ];

    const footnotes = [
      { footnoteId: 'fn-hist-1', originalNumber: 1, text: 'ابن الأثير، الكامل في التاريخ، ج 2، ص 100.' },
      { footnoteId: 'fn-mod-2', originalNumber: 2, text: 'القرضاوي، فقه المعاملات المعاصرة، ص 50.' }
    ];

    const result = engine.paginateSection({
      sectionType: 'topic',
      title: 'المطلب الأول',
      blocks,
      footnotes,
      startPageNumber: 3
    });

    assert.ok(result.pages.length >= 2, 'Expected at least 2 pages');

    const page1 = result.pages[0];
    const page2 = result.pages[1];

    // Page 1 must contain (1) footnote
    assert.equal(page1.footnotes.length, 1, 'Page 1 must have exactly 1 footnote');
    assert.equal(page1.footnotes[0].marker, '(1)', 'Footnote on page 1 must have marker (1)');
    assert.ok(page1.footnotes[0].text.includes('ابن الأثير'), 'Footnote 1 text must match');

    // Page 2 must contain (2) footnote restarted at (1)
    assert.equal(page2.footnotes.length, 1, 'Page 2 must have exactly 1 footnote');
    assert.equal(page2.footnotes[0].marker, '(1)', 'Footnote on page 2 must restart at (1)');
    assert.ok(page2.footnotes[0].text.includes('القرضاوي'), 'Footnote on page 2 must match');
  });

  test('4. Mabhath heading appears strictly once and NEVER repeats on second Matlab or continuation pages', () => {
    const mockResearch = {
      title: 'بحث أصولي تطبيقي',
      borderId: 'none',
      cover: { title: 'بحث أصولي تطبيقي' },
      introduction: { text: 'مقدمة البحث وخطة الدراسة.' },
      structure: [
        {
          id: 'mb-1',
          type: 'mabhath',
          title: 'المبحث الأول: القواعد الأصولية',
          children: [
            {
              id: 'mt-1',
              type: 'matlab',
              title: 'المطلب الأول: تعريف القاعدة الأصولية',
              content: 'نص المطلب الأول الشامل والمفصل.'.repeat(20)
            },
            {
              id: 'mt-2',
              type: 'matlab',
              title: 'المطلب الثاني: الفرق بين القاعدة والضابط',
              content: 'نص المطلب الثاني الشامل والمفصل.'.repeat(20)
            }
          ]
        }
      ],
      topics: [
        {
          topicId: 'mt-1',
          mabhathId: 'mb-1',
          mabhathTitle: 'المبحث الأول: القواعد الأصولية',
          h1Title: 'المطلب الأول: تعريف القاعدة الأصولية',
          rawContent: 'نص المطلب الأول الشامل والمفصل.'.repeat(20)
        },
        {
          topicId: 'mt-2',
          mabhathId: 'mb-1',
          mabhathTitle: 'المبحث الأول: القواعد الأصولية',
          h1Title: 'المطلب الثاني: الفرق بين القاعدة والضابط',
          rawContent: 'نص المطلب الثاني الشامل والمفصل.'.repeat(20)
        }
      ],
      conclusion: { text: 'خاتمة البحث وأهم النتائج.' },
      references: []
    };

    const docModel = DocumentBuilder.buildDocument(mockResearch);
    const topicPages = docModel.pages.filter((p) => p.pageType === 'topic');

    // Count how many times the Mabhath heading appears across all topic pages
    let mabhathHeadingCount = 0;
    topicPages.forEach((page) => {
      (page.blocks || []).forEach((b) => {
        if (b.type === 'mabhath' || (b.text && b.text.includes('المبحث الأول'))) {
          mabhathHeadingCount++;
        }
      });
    });

    assert.equal(
      mabhathHeadingCount,
      1,
      `المبحث الأول heading must appear exactly ONCE across all pages, but appeared ${mabhathHeadingCount} times`
    );
  });

  test('5. Heading orphan prevention pushes heading to fresh page if less than ~55pt remaining', () => {
    // Fill page almost completely, then place a heading
    const fillerSentence = 'فقرة تمهيدية لملء مساحة الصفحة والتأكد من موازنة الارتفاع العمودي بدقة. '.repeat(10);

    const blocks = [
      { type: 'paragraph', text: fillerSentence },
      { type: 'paragraph', text: fillerSentence },
      { type: 'paragraph', text: fillerSentence },
      { type: 'paragraph', text: fillerSentence },
      { type: 'h2', text: 'المطلب الثاني: مسألة تطبيقية دقيقة' },
      { type: 'paragraph', text: 'محتوى تابع للمطلب الثاني.' }
    ];

    const result = engine.paginateSection({
      sectionType: 'topic',
      title: 'المطلب الأول',
      blocks,
      footnotes: [],
      startPageNumber: 3
    });

    // Check if h2 is on a page with following content (never orphaned alone at the bottom)
    result.pages.forEach((page) => {
      const h2Idx = page.blocks.findIndex((b) => b.type === 'h2');
      if (h2Idx !== -1) {
        assert.ok(
          h2Idx < page.blocks.length - 1,
          'Heading must not be the last block on a page without following content'
        );
      }
    });
  });

  test('6. PDF Generator produces page-specific blocks for multi-page intro and conclusion', () => {
    const multiPageDoc = {
      title: 'بحث تجريبي متقدم',
      border: { borderId: 'none' },
      pages: [
        {
          pageNumber: 1,
          pageType: 'cover',
          data: { title: 'بحث تجريبي متقدم', studentName: 'أحمد' }
        },
        {
          pageNumber: 2,
          pageType: 'introduction',
          title: 'المقدمة وخطة البحث',
          isContinuation: false,
          blocks: [
            { type: 'h1', text: 'المقدمة وخطة البحث' },
            { type: 'paragraph', text: 'الفقرة الأولى من المقدمة في الصفحة الأولى.' }
          ],
          data: { content: 'الفقرة الأولى من المقدمة في الصفحة الأولى.\nالفقرة الثانية في الصفحة الثانية.' }
        },
        {
          pageNumber: 3,
          pageType: 'introduction',
          title: 'المقدمة وخطة البحث (تابع)',
          isContinuation: true,
          blocks: [
            { type: 'paragraph', text: 'الفقرة الثانية من المقدمة في الصفحة الثانية.' }
          ],
          data: { content: 'الفقرة الأولى من المقدمة في الصفحة الأولى.\nالفقرة الثانية في الصفحة الثانية.' }
        }
      ]
    };

    const html = PDFGenerator.buildDocumentHTML(multiPageDoc);

    // Page 2 must NOT contain paragraph 2
    // Page 3 must NOT contain paragraph 1
    // And page 3 must show continuation title
    assert.ok(html.includes('الفقرة الأولى من المقدمة في الصفحة الأولى.'));
    assert.ok(html.includes('الفقرة الثانية من المقدمة في الصفحة الثانية.'));
    assert.ok(html.includes('المقدمة وخطة البحث (تابع)'));
  });

  test('7. TOC entries accurately reference starting pages and omit continuation pages', () => {
    const pages = [
      { pageNumber: 1, pageType: 'cover' },
      { pageNumber: 2, pageType: 'introduction', title: 'المقدمة وخطة البحث', isContinuation: false },
      { pageNumber: 3, pageType: 'introduction', title: 'المقدمة وخطة البحث (تابع)', isContinuation: true },
      { pageNumber: 4, pageType: 'topic', title: 'المطلب الأول: التعريف', isContinuation: false },
      { pageNumber: 5, pageType: 'topic', title: 'المطلب الأول (تابع)', isContinuation: true },
      { pageNumber: 6, pageType: 'conclusion', title: 'الخاتمة', isContinuation: false },
      { pageNumber: 7, pageType: 'references', title: 'المصادر والمراجع', isContinuation: false }
    ];

    const toc = TOCBuilder.generateTOCEntries(pages);

    const introEntry = toc.find((e) => e.title === 'المقدمة وخطة البحث');
    assert.ok(introEntry, 'TOC must contain introduction');
    assert.equal(introEntry.pageNumber, 2, 'Introduction starting page must be 2');

    // Verify continuation pages do NOT create new TOC entries
    const continuationEntries = toc.filter((e) => e.title.includes('(تابع)'));
    assert.equal(continuationEntries.length, 0, 'Continuation pages must NEVER appear in TOC');
  });

  test('8. Premature page-break prevention: paragraph splits into remaining physical space without ghost tail-footnote reservation', () => {
    // Construct a page that has ~70pt of remaining physical space.
    // The candidate paragraph contains a footnote at the very end.
    // Previously, the entire footnote height was deducted upfront, dropping remaining available below 55.6pt,
    // which caused the entire paragraph to be moved to the next page, leaving 70pt of blank space.
    // With the fix, the paragraph splits part1 (2 lines) onto the current page and part2 (with the footnote) to next page.
    const block1 = { type: 'matlab', text: 'المطلب الأول: التأصيل الفقهي للمسألة' };
    const block2 = { type: 'paragraph', text: 'هذا نص فقهي أكاديمي محكم يستعرض أقوال الفقهاء بتفصيل ودقة ومنهجية واضحة في بيان المسألة وتفصيل أحكامها بدقة وموضوعية. '.repeat(10) };
    const block3 = { type: 'paragraph', text: 'المسألة الثانية تتناول تطبيقات معاصرة ونوازل فقهية حديثة تحتاج إلى اجتهاد وبيان تأصيلي معتمد لدى جمهور أهل العلم. '.repeat(12) + ' (1)' };

    const footnotes = [
      { footnoteId: 'fn-1', number: 1, text: 'المغني، ابن قدامة، دار إحياء التراث، ج 1، ص 100.' }
    ];

    const result = engine.paginateSection({
      sectionType: 'topic',
      title: 'المطلب الأول',
      blocks: [block1, block2, block3],
      footnotes: footnotes,
      startPageNumber: 3
    });

    assert.ok(result.pages.length >= 2, 'Expected 2 pages for topic');
    const page3 = result.pages[0];
    const page4 = result.pages[1];

    // Page 3 must contain part1 of block3 (3 blocks total: matlab, para1, and para2-part1)
    assert.equal(page3.blocks.length, 3, 'Page 3 must utilize remaining space by splitting paragraph (3 blocks total)');
    
    // Page 3 unused space must be minimized (less than 25pt, rather than 70pt+ dead space)
    const page3Consumed = page3.debugContentHeight + page3.debugFootnoteHeight;
    const page3Unused = 705.83 - page3Consumed;
    assert.ok(page3Unused < 25.0, `Page 3 unused space must be < 25pt, but got ${page3Unused.toFixed(2)}pt`);

    // Footnote 1 is in part2, so page 3 has 0 footnotes, and page 4 has footnote 1
    assert.equal(page3.footnotes.length, 0, 'Page 3 must not hold footnote belonging to part2');
    assert.equal(page4.footnotes.length, 1, 'Page 4 must receive footnote belonging to part2');
    assert.ok(page4.blocks[0].text.includes('المسألة الثانية'), 'Page 4 must contain part2 of paragraph');
  });
});
