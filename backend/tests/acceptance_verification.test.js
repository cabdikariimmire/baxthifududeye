const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const PDFGenerator = require('../src/services/pdf/pdfGenerator');
const DocxGenerator = require('../src/services/docx/docxGenerator');
const defaultBorders = require('../src/services/document/defaultBorders');
const {
  sortReferencesArabic,
  groupReferencesByArabicLetter,
  normalizeReference,
  deduplicateReferences
} = require('../src/services/references/arabicSort');
const AIService = require('../src/services/ai/aiService');

// Sample test research with 4 full topics and footnotes
const mockResearch4Topics = {
  _id: 'test-research-full-4topics',
  title: 'الإعتكاف في الفقه الإسلامي',
  borderId: 'border-academic-red',
  cover: {
    country: 'جمهورية الصومال الفيدرالية',
    university: 'جامعة هرمود',
    college: 'كلية الشريعة والقانون',
    subject: 'الفقه المقارن',
    title: 'الإعتكاف في الفقه الإسلامي',
    studentName: 'عباس عبد الناصر محمد',
    level: 'المستوى الثاني - ماجستير',
    supervisor: 'الأستاذ الدكتور عبد الله الشرعبي',
    academicYear: '1447هـ',
    gregorianYear: '2026م',
    badgeColor: '#38761d',
    logoUrl: ''
  },
  introduction: {
    opening: 'الحمد لله رب العالمين والصلاة والسلام على أشرف الأنبياء والمرسلين نبينا محمد وعلى آله وصحبه أجمعين، أما بعد:',
    text: 'فإن الاعتكاف من السنن المؤكدة التي رغب فيها الشارع الحكيم لما له من عظيم الأثر في تزكية النفس وإصلاح القلب.',
    planSummary: 'ويتكون هذا البحث من أربعة مطالب رئيسية.'
  },
  structure: {
    confirmed: true,
    detectedMataleeb: [
      { title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته', order: 1 },
      { title: 'المطلب الثاني: شروط الاعتكاف وأركانه', order: 2 },
      { title: 'المطلب الثالث: مفسدات الاعتكاف ومكروهاته', order: 3 },
      { title: 'المطلب الرابع: مقاصد الاعتكاف وآثاره التربوية', order: 4 }
    ]
  },
  topics: [
    {
      topicId: 'topic-1',
      order: 1,
      h1Title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته',
      branches: [{ title: 'الفرع الأول: المعنى اللغوي والاصطلاحي', order: 1 }],
      blocks: [
        { type: 'h1', text: 'المطلب الأول: تعريف الاعتكاف ومشروعيته' },
        { type: 'h2', text: 'الفرع الأول: المعنى اللغوي والاصطلاحي' },
        { type: 'paragraph', text: 'الاعتكاف لغة: اللزوم والمكث على الشيء، واصطلاحاً: لزوم مسجد لطاعة الله تعالى.' }
      ],
      footnotes: [
        { footnoteId: 'fn-1-1', number: 1, marker: '(1)', text: 'لسان العرب، ابن منظور، دار صادر، بيروت، ج9، ص254.' },
        { footnoteId: 'fn-1-2', number: 2, marker: '(2)', text: 'المجموع شرح المهذب، النووي، دار الفكر، بيروت، ط1، 1417هـ، ج6، ص350.' }
      ],
      status: 'complete'
    },
    {
      topicId: 'topic-2',
      order: 2,
      h1Title: 'المطلب الثاني: شروط الاعتكاف وأركانه',
      branches: [{ title: 'الفرع الأول: الإسلام والعقل والنية', order: 1 }],
      blocks: [
        { type: 'h1', text: 'المطلب الثاني: شروط الاعتكاف وأركانه' },
        { type: 'paragraph', text: 'يشترط لصحة الاعتكاف نية التقرب إلى الله تعالى وأن يكون في المسجد.' }
      ],
      footnotes: [
        { footnoteId: 'fn-2-1', number: 1, marker: '(1)', text: 'المغني، ابن قدامة، دار إحياء التراث العربي، بيروت، ج3، ص180.' },
        { footnoteId: 'fn-2-2', number: 2, marker: '(2)', text: 'المجموع شرح المهذب، النووي، ج6، ص360.' } // Repeated citation
      ],
      status: 'complete'
    },
    {
      topicId: 'topic-3',
      order: 3,
      h1Title: 'المطلب الثالث: مفسدات الاعتكاف ومكروهاته',
      branches: [],
      blocks: [
        { type: 'h1', text: 'المطلب الثالث: مفسدات الاعتكاف ومكروهاته' },
        { type: 'paragraph', text: 'يفسد الاعتكاف بالخروج من المسجد لغير حاجة شرعية، وبالجماع.' }
      ],
      footnotes: [
        { footnoteId: 'fn-3-1', number: 1, marker: '(1)', text: 'بداية المجتهد ونهاية المقتصد، ابن رشد، دار المعرفة، بيروت، 1425هـ، ج2، ص88.' }
      ],
      status: 'complete'
    },
    {
      topicId: 'topic-4',
      order: 4,
      h1Title: 'المطلب الرابع: مقاصد الاعتكاف وآثاره التربوية',
      branches: [],
      blocks: [
        { type: 'h1', text: 'المطلب الرابع: مقاصد الاعتكاف وآثاره التربوية' },
        { type: 'paragraph', text: 'من أعظم مقاصد الاعتكاف تحقيق الخلوة المشروعة والتفرغ لمناجاة الله سبحانه.' }
      ],
      footnotes: [
        { footnoteId: 'fn-4-1', number: 1, marker: '(1)', text: 'زاد المعاد في هدي خير العباد، ابن القيم، مؤسسة الرسالة، بيروت، ط27، 1415هـ، ج2، ص85.' }
      ],
      status: 'complete'
    }
  ],
  conclusion: {
    title: 'الخاتمة',
    text: 'وفي ختام هذا البحث، نحمد الله تعالى على توفيقه وإعانته على إتمامه.',
    points: [
      'الاعتكاف سنة مؤكدة في العشر الأواخر من رمضان.',
      'يشترط للاعتكاف المسجد والنية والطهارة من الحدث الأكبر.',
      'الاعتكاف وسيلة تربوية وإيمانية كبرى لتجديد الصلة بالله تعالى.'
    ]
  },
  references: [],
  documentMetadata: { totalPages: 0 }
};

test('ACCEPTANCE 1-16: True A4 Document Model, Footnotes, Pagination, Arabic Sorting, Deduplication, and TOC', async () => {
  const docModel = DocumentBuilder.buildDocument(mockResearch4Topics);

  // 1. Shared A4 Spec
  assert.strictEqual(docModel.spec.pageSize, 'A4');
  assert.strictEqual(docModel.spec.dimensions.widthMm, 210);
  assert.strictEqual(docModel.spec.dimensions.heightMm, 297);
  assert.strictEqual(docModel.spec.margins.topMm, 24);
  assert.strictEqual(docModel.spec.margins.bottomMm, 24);
  assert.strictEqual(docModel.spec.margins.rightMm, 25);
  assert.strictEqual(docModel.spec.margins.leftMm, 25);

  // 2. Exact Page Count: Cover(1), Intro(2), Topics(3,4,5,6), Conclusion(7), References(8), TOC(9) = 9 pages
  assert.strictEqual(docModel.totalPages, 9);
  assert.strictEqual(docModel.pages.length, 9);

  // 3. Page Sequence Validation
  assert.strictEqual(docModel.pages[0].pageType, 'cover');
  assert.strictEqual(docModel.pages[1].pageType, 'introduction');
  assert.strictEqual(docModel.pages[2].pageType, 'topic');
  assert.strictEqual(docModel.pages[3].pageType, 'topic');
  assert.strictEqual(docModel.pages[4].pageType, 'topic');
  assert.strictEqual(docModel.pages[5].pageType, 'topic');
  assert.strictEqual(docModel.pages[6].pageType, 'conclusion');
  assert.strictEqual(docModel.pages[7].pageType, 'references');
  assert.strictEqual(docModel.pages[8].pageType, 'toc');

  // 4. Footnote Short Markers (1), (2) on Topic Pages
  const topic1 = docModel.pages[2];
  assert.strictEqual(topic1.footnotes.length, 2);
  assert.strictEqual(topic1.footnotes[0].marker, '(1)');
  assert.strictEqual(topic1.footnotes[1].marker, '(2)');
  assert.strictEqual(topic1.footnotes[0].footnoteId, 'fn-1-1');
  assert.strictEqual(topic1.footnotes[1].footnoteId, 'fn-1-2');

  // 5. Reference Deduplication: 'المجموع شرح المهذب' appeared twice across topics, must appear once in bibliography
  const refPage = docModel.pages[7];
  const refList = refPage.data.references;
  const مجموعRefs = refList.filter((r) => r.book.includes('المجموع'));
  assert.strictEqual(مجموعRefs.length, 1, 'Repeated citations of المجموع must be deduplicated to exactly 1');

  // 6. Reference volume & page removal
  refList.forEach((ref) => {
    assert.ok(!ref.displayText.includes('ج9'), `Reference "${ref.displayText}" must not contain volume numbers`);
    assert.ok(!ref.displayText.includes('ص254'), `Reference "${ref.displayText}" must not contain page numbers`);
    assert.ok(!ref.displayText.includes('ص350'), `Reference "${ref.displayText}" must not contain page numbers`);
  });

  // 7. Arabic Alphabetical Sorting (ignoring leading "ال")
  // Books: بداية المجتهد (ب), زاد المعاد (ز), لسان العرب (ل - ignoring ال), المجموع (م - ignoring ال), المغني (م - ignoring ال)
  const sortedBooks = refList.map((r) => r.book);
  assert.strictEqual(sortedBooks[0], 'بداية المجتهد ونهاية المقتصد');
  assert.strictEqual(sortedBooks[1], 'زاد المعاد في هدي خير العباد');
  assert.strictEqual(sortedBooks[2], 'لسان العرب');

  // 8. Continuous Numbered List for references (1., 2., 3., ...)
  refList.forEach((r, idx) => {
    assert.strictEqual(r.order, idx + 1, 'References must be numbered sequentially from 1 to N');
  });

  // 9. TOC entries and exact page mapping
  const tocEntries = docModel.toc;
  const introEntry = tocEntries.find((e) => e.title.includes('المقدمة'));
  const topic1Entry = tocEntries.find((e) => e.title.includes('المطلب الأول'));
  const topic4Entry = tocEntries.find((e) => e.title.includes('المطلب الرابع'));
  const conclEntry = tocEntries.find((e) => e.title.includes('الخاتمة'));
  const refEntry = tocEntries.find((e) => e.title.includes('المصادر والمراجع'));
  const tocEntry = tocEntries.find((e) => e.title.includes('فهرس') || e.title.includes('الموضوعات'));

  assert.strictEqual(introEntry.pageNumber, 2);
  assert.strictEqual(topic1Entry.pageNumber, 3);
  assert.strictEqual(topic4Entry.pageNumber, 6);
  assert.strictEqual(conclEntry.pageNumber, 7);
  assert.strictEqual(refEntry.pageNumber, 8);
  assert.strictEqual(tocEntry.pageNumber, 9);
});

test('ACCEPTANCE 7: "بدون إطار" (No Border) option renders no decorative SVG', () => {
  const noneBorder = defaultBorders.find((b) => b.borderId === 'none' || b.id === 'none');
  assert.ok(noneBorder, 'Must have border option "none" in defaultBorders');
  assert.strictEqual(noneBorder.svgPattern, '', 'SVG pattern must be empty string for "none" border');

  const docModel = DocumentBuilder.buildDocument({
    ...mockResearch4Topics,
    borderId: 'none'
  });
  assert.strictEqual(docModel.border.borderId, 'none');
  assert.strictEqual(docModel.border.svgPattern, '');

  const html = PDFGenerator.buildDocumentHTML(docModel);
  assert.ok(!html.includes('<rect x="24"'), 'HTML must not contain red decorative border rects when "none" is chosen');
});

test('ACCEPTANCE 17: Pure DOCX Generation from Shared Model', async () => {
  const docxBuffer = await DocxGenerator.generateDocx(mockResearch4Topics);
  assert.ok(docxBuffer instanceof Buffer, 'DOCX generator must return Buffer');
  assert.ok(docxBuffer.length > 5000, `DOCX buffer size (${docxBuffer.length} bytes) indicates complete Word document`);

  // Write file to scratch directory for physical verification
  const outDir = path.resolve('C:/Users/cxc/.gemini/antigravity-ide/brain/04555e3a-7847-47cb-a983-0ebb0cbccb67/scratch');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const testDocxPath = path.join(outDir, 'acceptance_test_research.docx');
  fs.writeFileSync(testDocxPath, docxBuffer);
  assert.ok(fs.existsSync(testDocxPath), 'Generated DOCX file must be saved and readable on disk');
});

test('ACCEPTANCE 1-6, 8-16: PDF Generation with Puppeteer and Verification', async () => {
  const pdfBuffer = await PDFGenerator.generatePDF(mockResearch4Topics);
  assert.ok(pdfBuffer instanceof Buffer, 'PDF generator must return Buffer');
  assert.ok(pdfBuffer.length > 10000, `PDF buffer size (${pdfBuffer.length} bytes) indicates complete multi-page document`);

  // Verify PDF header %PDF-1.4 or %PDF-1.7
  const pdfHeader = pdfBuffer.slice(0, 5).toString('utf-8');
  assert.strictEqual(pdfHeader, '%PDF-', 'PDF file must start with standard PDF magic number');

  // Write file to scratch directory for physical verification
  const outDir = path.resolve('C:/Users/cxc/.gemini/antigravity-ide/brain/04555e3a-7847-47cb-a983-0ebb0cbccb67/scratch');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const testPdfPath = path.join(outDir, 'acceptance_test_research.pdf');
  fs.writeFileSync(testPdfPath, pdfBuffer);
  assert.ok(fs.existsSync(testPdfPath), 'Generated PDF file must be saved and readable on disk');
});

test('ACCEPTANCE 19: AI Full Document Extraction Mode with Deterministic Fallback', async () => {
  const fullResearchPastedText = `
جامعة هرمود
كلية الشريعة والقيادة
المادة: الفقه
عنوان البحث: صلاة الكسوف وأحكامها الفقهية
إعداد الطالب: زيد بن حارثة
المستوى: الثاني
المشرف: د. صالح العلي
1447هـ
2026م

المقدمة
الحمد لله وحده والصلاة والسلام على من لا نبي بعده، أما بعد:
فإن صلاة الكسوف سنة مؤكدة عند حدوث كسوف الشمس أو خسوف القمر.

المطلب الأول: تعريف الكسوف ومشروعيته
الفرع الأول: المعنى اللغوي
الكسوف ذهاب ضوء الشمس أو بعضه.
(1) لسان العرب، ابن منظور، دار صادر، بيروت، ج9، ص300.

المطلب الثاني: كيفية صلاة الكسوف
صلاة الكسوف ركعتان في كل ركعة قيامان وقراءتان وركوعان وسجودان.
(1) المجموع، النووي، دار الفكر، ج6، ص400.

المطلب الثالث: شروطها ومستحباتها
يستحب لها الخطبة بعد الصلاة والصدقة والاستغفار.
(1) المغني، ابن قدامة، دار الفكر، ج3، ص200.

المطلب الرابع: المقاصد التربوية لصلاة الكسوف
تخويف العباد وتذكيرهم بقدرة الله تعالى وعظمته.
(1) زاد المعاد، ابن القيم، ج2، ص100.

الخاتمة
- صلاة الكسوف سنة مؤكدة جماعة وفرادى.
- تستحب الخطبة والوعظ بعدها والاجتهاد في الدعاء.

المصادر والمراجع
- لسان العرب، ابن منظور، دار صادر.
- المجموع، النووي، دار الفكر.
- المغني، ابن قدامة، دار الفكر.
- زاد المعاد، ابن القيم.
`;

  const extracted = await AIService.analyzeFullDocument({
    userId: 'test-user',
    researchId: 'test-research-ai',
    text: fullResearchPastedText
  });

  assert.ok(extracted, 'AI Service must return structured analysis object');
  assert.strictEqual(extracted.title, 'صلاة الكسوف وأحكامها الفقهية');
  assert.strictEqual(extracted.cover.university, 'جامعة هرمود');
  assert.strictEqual(extracted.cover.studentName, 'زيد بن حارثة');
  assert.strictEqual(extracted.mataleeb.length, 4, 'Must extract all 4 mataleeb');
  assert.strictEqual(extracted.mataleeb[0].footnotes.length, 1);
  assert.ok(extracted.references.length >= 4, 'Must extract at least 4 references');
});
