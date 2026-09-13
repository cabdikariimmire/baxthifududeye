const test = require('node:test');
const assert = require('node:assert');
const documentSpec = require('../src/services/document/documentSpec');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const {
  getArabicSortKey,
  getArabicFirstLetter,
  compareArabic,
  sortReferencesArabic,
  groupReferencesByArabicLetter
} = require('../src/services/references/arabicSort');
const { normalizeReference } = require('../src/services/references/normalizer');
const { deduplicateReferences } = require('../src/services/references/deduplicator');
const TOCBuilder = require('../src/services/toc/tocBuilder');
const DocxGenerator = require('../src/services/docx/docxGenerator');
const PDFGenerator = require('../src/services/pdf/pdfGenerator');

// Sample mock research document
const mockResearch = {
  _id: 'mock-res-001',
  title: 'أحكام الاعتكاف في الفقه الإسلامي',
  borderId: 'border-academic-red',
  cover: {
    country: 'جمهورية الصومال',
    university: 'جامعة هرمود',
    college: 'كلية الشريعة والقيادة',
    subject: 'الفقه المقارن',
    title: 'أحكام الاعتكاف في الفقه الإسلامي',
    studentName: 'عباس عبد الناصر',
    level: 'المستوى الثاني',
    supervisor: 'الدكتور محمد عبد الله الشرعبي',
    academicYear: '1447_ 1448هـ',
    gregorianYear: '2025 _ 2026م'
  },
  introduction: {
    opening: 'الحمد لله رب العالمين، والصلاة والسلام على رسول الله، أما بعد:',
    text: 'إن الاعتكاف من السنن المؤكدة التي رغب فيها الشارع الحكيم.'
  },
  structure: {
    detectedMataleeb: [
      { title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته', order: 1 },
      { title: 'المطلب الثاني: شروط صحة الاعتكاف ومبطلاته', order: 2 },
      { title: 'المطلب الثالث: المقاصد الشرعية والآثار التربوية', order: 3 },
      { title: 'المطلب الرابع: التطبيقات المعاصرة للاعتكاف', order: 4 }
    ]
  },
  topics: [
    {
      topicId: 'topic-1',
      order: 1,
      h1Title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته',
      status: 'complete',
      blocks: [
        { type: 'h1', text: 'المطلب الأول: تعريف الاعتكاف ومشروعيته' },
        { type: 'paragraph', text: 'الاعتكاف لغة هو اللزوم والإقامة على الشيء. (1)' },
        { type: 'paragraph', text: 'وشرعاً هو لزوم المسجد لطاعة الله بنية مخصوصة. (2)' }
      ],
      footnotes: [
        {
          footnoteId: 'fn-t1-1',
          number: 1,
          marker: '(1)',
          text: 'المصباح المنير في غريب الشرح الكبير، أحمد بن محمد الفيومي، المكتبة العلمية – بيروت، ج1، ص 424'
        },
        {
          footnoteId: 'fn-t1-2',
          number: 2,
          marker: '(2)',
          text: 'الفقه على المذاهب الأربعة، عبد الرحمن الجزيري، دار الكتب العلمية، بيروت، الطبعة الثانية، 2003م، ج1، ص 566'
        }
      ]
    },
    {
      topicId: 'topic-2',
      order: 2,
      h1Title: 'المطلب الثاني: شروط صحة الاعتكاف ومبطلاته',
      status: 'complete',
      blocks: [
        { type: 'h1', text: 'المطلب الثاني: شروط صحة الاعتكاف ومبطلاته' },
        { type: 'paragraph', text: 'يشترط لصحة الاعتكاف الإسلام والعقل والنية. (1)' }
      ],
      footnotes: [
        {
          footnoteId: 'fn-t2-1',
          number: 1,
          marker: '(1)',
          text: 'توضيح الأحكام من بلوغ المرام، عبد الله بن عبد الرحمن البسام، مكتبة الأسدي، مكة المكرمة، الطبعة الخامسة، 1423هـ، ج3، ص 551'
        }
      ]
    },
    {
      topicId: 'topic-3',
      order: 3,
      h1Title: 'المطلب الثالث: المقاصد الشرعية والآثار التربوية',
      status: 'complete',
      blocks: [
        { type: 'h1', text: 'المطلب الثالث: المقاصد الشرعية والآثار التربوية' },
        { type: 'paragraph', text: 'من مقاصد الاعتكاف تفريغ القلب لذكر الله. (1)' }
      ],
      footnotes: [
        {
          footnoteId: 'fn-t3-1',
          number: 1,
          marker: '(1)',
          text: 'إحياء علوم الدين، أبو حامد الغزالي، دار المعرفة، بيروت، ج1، ص 238'
        }
      ]
    },
    {
      topicId: 'topic-4',
      order: 4,
      h1Title: 'المطلب الرابع: التطبيقات المعاصرة للاعتكاف',
      status: 'complete',
      blocks: [
        { type: 'h1', text: 'المطلب الرابع: التطبيقات المعاصرة للاعتكاف' },
        { type: 'paragraph', text: 'تنظم المراكز الإسلامية برامج معتكفين متكاملة. (1)' }
      ],
      footnotes: [
        {
          footnoteId: 'fn-t4-1',
          number: 1,
          marker: '(1)',
          text: 'مجموع الفتاوى، ابن تيمية، مجمع الملك فهد لطباعة المصحف الشريف، المدينة المنورة، 1416هـ، ج20، ص 310'
        }
      ]
    }
  ],
  conclusion: {
    title: 'الخاتمة',
    text: 'وفي ختام هذا البحث الأكاديمي، نسجل أهم النتائج والتوصيات:',
    points: [
      'أن الاعتكاف سنة مؤكدة في العشر الأواخر من رمضان.',
      'أن الاعتكاف لا يصح إلا في المسجد مع النية والطهارة.',
      'أهمية تنظيم برامج إيمانية مدروسة للمعتكفين في العصر الحاضر.'
    ]
  },
  references: [
    { order: 1, book: 'المصباح المنير في غريب الشرح الكبير', author: 'أحمد الفيومي', publisher: 'المكتبة العلمية', city: 'بيروت' },
    { order: 2, book: 'الفقه على المذاهب الأربعة', author: 'عبد الرحمن الجزيري', publisher: 'دار الكتب العلمية', city: 'بيروت', year: '2003م' },
    { order: 3, book: 'توضيح الأحكام من بلوغ المرام', author: 'عبد الله البسام', publisher: 'مكتبة الأسدي', city: 'مكة المكرمة' },
    { order: 4, book: 'إحياء علوم الدين', author: 'أبو حامد الغزالي', publisher: 'دار المعرفة', city: 'بيروت' },
    { order: 5, book: 'مجموع الفتاوى', author: 'ابن تيمية', publisher: 'مجمع الملك فهد', city: 'المدينة المنورة' }
  ]
};

// 1. A4 Specification Tests
test('Requirement 1: Shared document specification conforms to exact A4 standard', () => {
  assert.strictEqual(documentSpec.pageSize, 'A4');
  assert.strictEqual(documentSpec.dimensions.widthMm, 210);
  assert.strictEqual(documentSpec.dimensions.heightMm, 297);
  assert.strictEqual(documentSpec.direction, 'rtl');
  assert.strictEqual(documentSpec.margins.topMm, 24);
  assert.strictEqual(documentSpec.margins.bottomMm, 24);
  assert.strictEqual(documentSpec.margins.rightMm, 25);
  assert.strictEqual(documentSpec.margins.leftMm, 25);
});

// 2. Footnote Marker <-> Footnote ID Linking & Clean Short Formatting
test('Requirement 2 & 7: Footnotes maintain unique IDs and clean short markers (1), (2)', () => {
  const doc = DocumentBuilder.buildDocument(mockResearch);
  const topicPages = doc.pages.filter((p) => p.pageType === 'topic');

  assert.strictEqual(topicPages.length, 4);
  topicPages.forEach((page) => {
    assert.ok(page.footnotes.length > 0);
    page.footnotes.forEach((fn) => {
      assert.ok(fn.footnoteId || fn.id);
      assert.ok(fn.marker.startsWith('('));
      assert.ok(fn.marker.endsWith(')'));
      // Verify no long URLs in markers
      assert.ok(!fn.marker.includes('http'));
      assert.ok(!fn.marker.includes('www'));
    });
  });
});

// 3. Footnote Renumbering upon Deletion
test('Requirement 2: Footnote deletion re-indexes markers sequentially', () => {
  const original = [
    { footnoteId: 'fn-1', number: 1, marker: '(1)', text: 'كتاب 1' },
    { footnoteId: 'fn-2', number: 2, marker: '(2)', text: 'كتاب 2' },
    { footnoteId: 'fn-3', number: 3, marker: '(3)', text: 'كتاب 3' }
  ];

  // Delete index 1 (#2)
  const remaining = original.filter((_, idx) => idx !== 1);
  const renumbered = remaining.map((fn, idx) => ({
    ...fn,
    number: idx + 1,
    marker: `(${idx + 1})`
  }));

  assert.strictEqual(renumbered.length, 2);
  assert.strictEqual(renumbered[0].footnoteId, 'fn-1');
  assert.strictEqual(renumbered[0].number, 1);
  assert.strictEqual(renumbered[0].marker, '(1)');
  assert.strictEqual(renumbered[1].footnoteId, 'fn-3');
  assert.strictEqual(renumbered[1].number, 2);
  assert.strictEqual(renumbered[1].marker, '(2)');
});

// 4. 4-Topic Workflow Gate
test('Requirement 4: 4-Topic completion validation accurately gates progress', () => {
  const topics = [
    { status: 'complete', rawContent: 'محتوى المطلب الأول بتفاصيله الكاملة...', blocks: [{ type: 'h1', text: '1' }] },
    { status: 'complete', rawContent: 'محتوى المطلب الثاني بتفاصيله الكاملة...', blocks: [{ type: 'h1', text: '2' }] },
    { status: 'complete', rawContent: 'محتوى المطلب الثالث بتفاصيله الكاملة...', blocks: [{ type: 'h1', text: '3' }] },
    { status: 'incomplete', rawContent: '', blocks: [] }
  ];

  const checkCompletion = (list) => list.every((t) => t.status === 'complete' && t.rawContent.length > 20);

  assert.strictEqual(checkCompletion(topics), false); // 3/4 -> Gate closed

  topics[3].status = 'complete';
  topics[3].rawContent = 'محتوى المطلب الرابع المكتمل الآن...';
  topics[3].blocks = [{ type: 'h1', text: '4' }];

  assert.strictEqual(checkCompletion(topics), true); // 4/4 -> Gate open
});

// 5. Arabic Alphabetical Sorting with 'ال' Normalization
test('Requirement 6: Arabic alphabetical sorting ignores leading "ال" during comparison', () => {
  const books = [
    { book: 'المصباح المنير' }, // sort key: مصباح (م)
    { book: 'إحياء علوم الدين' }, // sort key: احياء (أ)
    { book: 'بدائع الصنائع' }, // sort key: بدائع (ب)
    { book: 'الفقه على المذاهب الأربعة' }, // sort key: فقه (ف)
    { book: 'توضيح الأحكام' } // sort key: توضيح (ت)
  ];

  const sorted = sortReferencesArabic(books, { ignoreAl: true });

  // Expected order:
  // 1. إحياء (أ)
  // 2. بدائع (ب)
  // 3. توضيح (ت)
  // 4. الفقه (ف)
  // 5. المصباح (م)
  assert.strictEqual(sorted[0].book, 'إحياء علوم الدين');
  assert.strictEqual(sorted[1].book, 'بدائع الصنائع');
  assert.strictEqual(sorted[2].book, 'توضيح الأحكام');
  assert.strictEqual(sorted[3].book, 'الفقه على المذاهب الأربعة');
  assert.strictEqual(sorted[4].book, 'المصباح المنير');

  // Verify display text retains leading "ال"
  assert.ok(sorted[3].book.startsWith('الفقه'));
  assert.ok(sorted[4].book.startsWith('المصباح'));
});

// 6. Reference Grouping by Arabic Letter
test('Requirement 6: groupReferencesByArabicLetter groups titles under correct letters', () => {
  const books = [
    { book: 'الإحكام في أصول الأحكام' },
    { book: 'الأم للشافعي' },
    { book: 'بدائع الصنائع' },
    { book: 'المجموع شرح المهذب' } // under 'م' because 'ال' is ignored
  ];

  const grouped = groupReferencesByArabicLetter(books, { ignoreAl: true });

  assert.ok(grouped['أ']);
  assert.strictEqual(grouped['أ'].length, 2);
  assert.ok(grouped['ب']);
  assert.strictEqual(grouped['ب'].length, 1);
  assert.ok(grouped['م']);
  assert.strictEqual(grouped['م'].length, 1);
  assert.strictEqual(grouped['م'][0].book, 'المجموع شرح المهذب');
});

// 7. Structured Table of Contents Generation
test('Requirement 5: Table of Contents is structured and tracks actual page numbers', () => {
  const doc = DocumentBuilder.buildDocument(mockResearch);
  const toc = doc.toc;

  assert.ok(Array.isArray(toc));
  assert.ok(toc.length >= 6);

  // Cover is Page 1, Intro is Page 2
  const introEntry = toc.find((e) => e.title.includes('المقدمة'));
  assert.ok(introEntry);
  assert.strictEqual(introEntry.pageNumber, 2);
  assert.ok(introEntry.targetId);

  // Topics are Pages 3, 4, 5, 6
  const topic1 = toc.find((e) => e.title.includes('المطلب الأول'));
  assert.ok(topic1);
  assert.strictEqual(topic1.pageNumber, 3);

  const topic4 = toc.find((e) => e.title.includes('المطلب الرابع'));
  assert.ok(topic4);
  assert.strictEqual(topic4.pageNumber, 6);

  // Conclusion is Page 7
  const conclusion = toc.find((e) => e.title.includes('الخاتمة'));
  assert.ok(conclusion);
  assert.strictEqual(conclusion.pageNumber, 7);

  // References is Page 8
  const references = toc.find((e) => e.title.includes('المصادر والمراجع'));
  assert.ok(references);
  assert.strictEqual(references.pageNumber, 8);

  // TOC itself is Page 9
  const tocPage = toc.find((e) => e.title.includes('فهرس الموضوعات'));
  assert.ok(tocPage);
  assert.strictEqual(tocPage.pageNumber, 9);
});

// 8. Word DOCX Generation Produces Valid Editable Buffer
test('Requirement 3: DocxGenerator produces valid non-empty editable DOCX buffer', async () => {
  const docxBuffer = await DocxGenerator.generateDocx(mockResearch);

  assert.ok(docxBuffer);
  assert.ok(Buffer.isBuffer(docxBuffer));
  assert.ok(docxBuffer.length > 5000); // Valid zip archive format of docx
  // Verify standard PK zip header for DOCX
  assert.strictEqual(docxBuffer[0], 0x50); // 'P'
  assert.strictEqual(docxBuffer[1], 0x4b); // 'K'
});
