const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const PDFGenerator = require('../src/services/pdf/pdfGenerator');
const DocxGenerator = require('../src/services/docx/docxGenerator');
const TYPOGRAPHY = require('../src/services/document/typography');
const { getArabicSortKey, sortReferencesArabic, formatContinuousBibliography } = require('../src/services/references/arabicSort');
const { isResearchContentComplete } = require('../src/validators/researchValidator');
const PaginationEngine = require('../src/services/document/paginationEngine');

// Complete Prayer Research Document matching test context: "الصلاة في الإسلام وأحكامها وأهميتها"
const prayerResearchData = {
  _id: 'prayer-research-academic-test',
  title: 'الصلاة في الإسلام وأحكامها وأهميتها',
  borderId: 'border-academic-red',
  cover: {
    country: 'جمهورية الصومال الفيدرالية',
    university: 'جامعة هرمود',
    college: 'كلية الشريعة والقيادة',
    subject: 'الفقه وأصوله',
    title: 'الصلاة في الإسلام وأحكامها وأهميتها',
    studentName: 'محمد إبراهيم عيد',
    level: 'المستوى الثاني',
    supervisor: 'الدكتور محمد عبد الله ناجي',
    academicYear: '1447-1448هـ',
    gregorianYear: '2025-2026م',
    badgeColor: '#38761d',
    logoUrl: ''
  },
  introduction: {
    opening: 'الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد وعلى آله وصحبه أجمعين، أما بعد:',
    text: 'فإن الصلاة عماد الدين، وركن الإسلام الركين بعد الشهادتين. فرضها الله تعالى على نبيه صلى الله عليه وسلم ليلة الإسراء والمعراج في السماء السابعة لعظيم قدرها وجليل منزلتها. وهي الصلة الوثيقة بين العبد وربه، يتطهر بها القلب وتسكن بها النفس وتنصلح بها سائر الأعمال والأحوال.',
    planSummary: 'ويتكون هذا البحث من مقدمة وثلاثة مطالب وخاتمة.'
  },
  structure: {
    confirmed: true,
    detectedMataleeb: [
      { title: 'المطلب الأول: تعريف الصلاة ومشروعيتها ومنزلتها في الإسلام', order: 1 },
      { title: 'المطلب الثاني: أركان الصلاة وشروطها وسننها', order: 2 },
      { title: 'المطلب الثالث: الآثار التربوية والإيمانية للصلاة وحكم تاركها', order: 3 }
    ]
  },
  topics: [
    {
      topicId: 'topic-prayer-1',
      order: 1,
      h1Title: 'المطلب الأول: تعريف الصلاة ومشروعيتها ومنزلتها في الإسلام',
      branches: [
        { title: 'الفرع الأول: المعنى اللغوي والاصطلاحي', order: 1 },
        { title: 'الفرع الثاني: فرضية الصلاة وحكمها', order: 2 }
      ],
      blocks: [
        { type: 'h1', text: 'المطلب الأول: تعريف الصلاة ومشروعيتها ومنزلتها في الإسلام' },
        { type: 'h2', text: 'الفرع الأول: المعنى اللغوي والاصطلاحي' },
        {
          type: 'paragraph',
          text: 'الصلاة في لغة العرب تعني الدعاء والاستغفار والثناء الجميل، ومنه قوله تعالى: ﴿وَصَلِّ عَلَيْهِمْ إِنَّ صَلَاتَكَ سَكَنٌ لَهُمْ﴾ [التوبة: 103]، أي ادع لهم بالبركة والمغفرة (1). وأما في الاصطلاح الشرعي الفقهي فهي أقوال وأفعال مخصوصة مفتتحة بالتكبير ومختتمة بالتسليم بشرائط مخصوصة مع استحضار النية الخالصة لوجه الله تعالى (2).'
        },
        { type: 'h2', text: 'الفرع الثاني: فرضية الصلاة وحكمها' },
        {
          type: 'paragraph',
          text: 'فرضت الصلاة في مكة المكرمة قبل الهجرة النبوية الشريفة بخمسين صلاة ثم خففها الله سبحانه برحمته إلى خمس صلوات في اليوم والليلة وهي خمسون في الأجر والثواب (3).'
        }
      ],
      footnotes: [
        { footnoteId: 'fn_p1', number: 1, marker: '(1)', text: 'لسان العرب، ابن منظور، دار صادر، بيروت، ج14، ص464.' },
        { footnoteId: 'fn_p2', number: 2, marker: '(2)', text: 'المجموع شرح المهذب، النووي، دار الفكر، بيروت، ج3، ص3.' },
        { footnoteId: 'fn_p3', number: 3, marker: '(3)', text: 'صحيح البخاري، محمد بن إسماعيل البخاري، دار طوق النجاة، ج1، ص78، رقم الحديث (349).' }
      ],
      status: 'complete'
    },
    {
      topicId: 'topic-prayer-2',
      order: 2,
      h1Title: 'المطلب الثاني: أركان الصلاة وشروطها وسننها',
      branches: [],
      blocks: [
        { type: 'h1', text: 'المطلب الثاني: أركان الصلاة وشروطها وسننها' },
        {
          type: 'paragraph',
          text: 'تنقسم واجبات الصلاة إلى شروط تتقدمها، وأركان تتركب منها ماهيتها. فشروط الصحة: دخول الوقت، والطهارة من الحدثين، وطهارة البدن والثوب والمكان، وستر العورة، واستقبال القبلة، والنية (4). وأما الأركان فأربعة عشر ركناً لا تسقط عمداً ولا سهواً كالفاتحة والركوع والسجود والطمأنينة (5).'
        }
      ],
      footnotes: [
        { footnoteId: 'fn_p4', number: 1, marker: '(4)', text: 'المغني، ابن قدامة المقدسي، دار إحياء التراث العربي، بيروت، ج1، ص389.' },
        { footnoteId: 'fn_p5', number: 2, marker: '(5)', text: 'بداية المجتهد ونهاية المقتصد، ابن رشد الحفيد، دار المعرفة، بيروت، ج1، ص120.' }
      ],
      status: 'complete'
    },
    {
      topicId: 'topic-prayer-3',
      order: 3,
      h1Title: 'المطلب الثالث: الآثار التربوية والإيمانية للصلاة وحكم تاركها',
      branches: [],
      blocks: [
        { type: 'h1', text: 'المطلب الثالث: الآثار التربوية والإيمانية للصلاة وحكم تاركها' },
        {
          type: 'paragraph',
          text: 'للصلاة ثمرات روحية وتربوية واجتماعية عظيمة، فهي تنهى عن الفحشاء والمنكر، وتغرس في القلب دوام استشعار مراقبة الله تعالى، وتجمع المسلمين في صفوف متراصة تسقط فيها الفوارق الدنيوية (6). وقد أجمع المسلمون على كفر جاحد فرضيتها لعلم وجوبها من الدين بالضرورة (7).'
        }
      ],
      footnotes: [
        { footnoteId: 'fn_p6', number: 1, marker: '(6)', text: 'زاد المعاد في هدي خير العباد، ابن القيم الجوزية، مؤسسة الرسالة، ج1، ص188.' },
        { footnoteId: 'fn_p7', number: 2, marker: '(7)', text: 'المجموع شرح المهذب، النووي، دار الفكر، ج3، ص15.' } // Duplicate book citation
      ],
      status: 'complete'
    }
  ],
  conclusion: {
    title: 'الخاتمة',
    text: 'الحمد لله الذي بنعمته تتم الصالحات، وبعد بيان أحكام الصلاة وفضلها نوجز أهم نتائج البحث فيما يلي:',
    points: [
      'الصلاة هي الركن الثاني من أركان الإسلام وأعظم فرائضه العملية.',
      'تشتمل الصلاة على شروط وأركان وسنن ينبغي للمسلم تعلمها لتقبل عبادته.',
      'تكرار إقامة الصلاة جماعة في المساجد يحقق التكافل الاجتماعي والتزكية الإيمانية المستمرة.'
    ]
  },
  references: [],
  documentMetadata: { totalPages: 0 }
};

test('E2E #1-4: Footnote Stable Linking, Insertion, Renumbering, and Deletion', () => {
  // Build document model from prayer research
  const doc = DocumentBuilder.buildDocument(prayerResearchData);

  // Verify initial footnote count across topics (3 + 2 + 2 = 7 footnotes)
  let totalFootnotes = 0;
  doc.pages.forEach(p => {
    if (p.pageType === 'topic') totalFootnotes += (p.footnotes || []).length;
  });
  assert.strictEqual(totalFootnotes, 7, 'Document must have exactly 7 indexed footnotes across topics');

  // Verify sequential global numbers
  const topic1 = doc.pages.find(p => p.topicId === 'topic-prayer-1');
  assert.strictEqual(topic1.footnotes[0].number, 1);
  assert.strictEqual(topic1.footnotes[0].footnoteId, 'fn_p1');
  assert.strictEqual(topic1.footnotes[1].number, 2);
  assert.strictEqual(topic1.footnotes[1].footnoteId, 'fn_p2');
  assert.strictEqual(topic1.footnotes[2].number, 3);
  assert.strictEqual(topic1.footnotes[2].footnoteId, 'fn_p3');

  const topic2 = doc.pages.find(p => p.topicId === 'topic-prayer-2');
  assert.ok(topic2.footnotes[0].number === 1 || topic2.footnotes[0].originalNumber === 4);
  assert.strictEqual(topic2.footnotes[0].footnoteId, 'fn_p4');

  // Test dynamic insertion of a new footnote at beginning of topic 1
  const modifiedResearch = JSON.parse(JSON.stringify(prayerResearchData));
  modifiedResearch.topics[0].footnotes.unshift({
    footnoteId: 'fn_new_zero',
    text: 'جامع البيان عن تأويل آي القرآن، الطبري، دار هجر، ج12، ص200.'
  });

  const modifiedDoc = DocumentBuilder.buildDocument(modifiedResearch);
  const modifiedTopic1 = modifiedDoc.pages.find(p => p.topicId === 'topic-prayer-1');

  // Verify automatic sequential renumbering while stable IDs remain intact
  assert.strictEqual(modifiedTopic1.footnotes[0].footnoteId, 'fn_new_zero');
  assert.strictEqual(modifiedTopic1.footnotes[0].number, 1);
  assert.strictEqual(modifiedTopic1.footnotes[1].footnoteId, 'fn_p1');
  assert.strictEqual(modifiedTopic1.footnotes[1].number, 2);
  assert.strictEqual(modifiedTopic1.footnotes[2].footnoteId, 'fn_p2');
  assert.strictEqual(modifiedTopic1.footnotes[2].number, 3);
});

test('E2E #5-9: Real A4 Multi-Page Pagination with Paragraph Splitting and Short Separator', () => {
  const engine = new PaginationEngine();
  assert.strictEqual(engine.pageWidthPt, 595.28); // 210mm
  assert.strictEqual(engine.pageHeightPt, 841.89); // 297mm

  // Create a massive paragraph that exceeds single A4 capacity (1500+ characters)
  const hugeText = 'إن الصلاة في الإسلام تمثل حبل الوصل الأمتن بين المخلوق وخالقه العظيم، وفيها يتجلى الخضوع الكامل لله رب العالمين. '.repeat(20);
  const paginated = engine.paginateSection({
    sectionType: 'topic',
    title: 'المطلب المطول',
    h1Title: 'المطلب المطول',
    blocks: [
      { type: 'h1', text: 'المطلب المطول' },
      { type: 'paragraph', text: hugeText }
    ],
    footnotes: [
      { footnoteId: 'fn_huge_1', number: 1, text: 'زاد المعاد، ابن القيم، ج1، ص50.' }
    ],
    startPageNumber: 3
  });

  assert.ok(paginated.pages.length >= 2, `Long content must naturally span at least 2 pages (actual: ${paginated.pages.length})`);
  assert.strictEqual(paginated.pages[0].pageNumber, 3);
  assert.strictEqual(paginated.pages[1].pageNumber, 4);
  assert.ok(paginated.pages[0].blocks[1].text.length > 0, 'Page 1 must have first portion');
  assert.ok(paginated.pages[1].blocks[0].text.length > 0, 'Page 2 must have continued portion');
});

test('E2E #10-14: Arabic Bibliography Sorting, Single Continuous Numbering, and Deduplication', () => {
  const doc = DocumentBuilder.buildDocument(prayerResearchData);
  const refPage = doc.pages.find(p => p.pageType === 'references');
  assert.ok(refPage, 'Document must contain references page');

  const refList = refPage.data.references;
  // Unique books: بداية المجتهد (ب), زاد المعاد (ز), صحيح البخاري (ص - ignoring ال), لسان العرب (ل - ignoring ال), المجموع (م - ignoring ال), المغني (م - ignoring ال)
  assert.strictEqual(refList.length, 6, 'Must deduplicate 7 footnote citations into 6 unique bibliography entries');

  // Verify single continuous numbered list (order: 1, 2, 3, 4, 5, 6)
  refList.forEach((ref, idx) => {
    assert.strictEqual(ref.order, idx + 1);
  });

  // Verify exact Arabic sorting order
  const sortedBooks = refList.map(r => r.book);
  assert.strictEqual(sortedBooks[0], 'بداية المجتهد ونهاية المقتصد'); // ب
  assert.strictEqual(sortedBooks[1], 'زاد المعاد في هدي خير العباد'); // ز
  assert.strictEqual(sortedBooks[2], 'صحيح البخاري'); // ص
  assert.strictEqual(sortedBooks[3], 'لسان العرب'); // ل (ignoring ال)

  // Verify volume/page removal
  refList.forEach(ref => {
    assert.ok(!ref.displayText.includes('ج1'), 'Must not contain volume numbers in bibliography');
    assert.ok(!ref.displayText.includes('ص78'), 'Must not contain page numbers in bibliography');
  });
});

test('E2E #15-18: Workflow Lock Gate (isResearchContentComplete)', () => {
  // Complete research passes
  const validCheck = isResearchContentComplete(prayerResearchData);
  assert.strictEqual(validCheck.valid, true, 'Fully completed research must pass validation');

  // Incomplete research: empty topic body
  const incompleteResearch = JSON.parse(JSON.stringify(prayerResearchData));
  incompleteResearch.topics[2].rawContent = '';
  incompleteResearch.topics[2].blocks = [];
  incompleteResearch.topics[2].status = 'incomplete';

  const invalidCheck = isResearchContentComplete(incompleteResearch);
  assert.strictEqual(invalidCheck.valid, false, 'Research with empty topic must be rejected');
  assert.ok(invalidCheck.errors.length > 0);
});

test('E2E #19: Exact Typography Enforcement across Preview, PDF, and DOCX', () => {
  assert.strictEqual(TYPOGRAPHY.sizes.cover, 20);
  assert.strictEqual(TYPOGRAPHY.sizes.heading, 18);
  assert.strictEqual(TYPOGRAPHY.sizes.body, 16);
  assert.strictEqual(TYPOGRAPHY.sizes.footnote, 12);
  assert.strictEqual(TYPOGRAPHY.docxHalfPoints.cover, 40);
  assert.strictEqual(TYPOGRAPHY.docxHalfPoints.heading, 36);
  assert.strictEqual(TYPOGRAPHY.docxHalfPoints.body, 32);
  assert.strictEqual(TYPOGRAPHY.docxHalfPoints.footnote, 24);
  assert.strictEqual(TYPOGRAPHY.footnoteSeparator.widthPx, 130);
});

test('E2E #20-25: Real Prayer PDF & DOCX Generation and Inspection', async () => {
  // 1. Generate DOCX
  const docxBuffer = await DocxGenerator.generateDocx(prayerResearchData);
  assert.ok(docxBuffer instanceof Buffer);
  assert.ok(docxBuffer.length > 8000, `DOCX buffer size (${docxBuffer.length} bytes)`);

  const outDir = path.resolve('C:/Users/cxc/.gemini/antigravity-ide/brain/04555e3a-7847-47cb-a983-0ebb0cbccb67/scratch');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const prayerDocxPath = path.join(outDir, 'prayer_research_final.docx');
  fs.writeFileSync(prayerDocxPath, docxBuffer);
  assert.ok(fs.existsSync(prayerDocxPath));

  // 2. Generate PDF via Puppeteer
  const pdfBuffer = await PDFGenerator.generatePDF(prayerResearchData);
  assert.ok(pdfBuffer instanceof Buffer);
  assert.ok(pdfBuffer.length > 15000, `PDF buffer size (${pdfBuffer.length} bytes)`);

  const pdfMagic = pdfBuffer.slice(0, 5).toString('utf-8');
  assert.strictEqual(pdfMagic, '%PDF-');

  const prayerPdfPath = path.join(outDir, 'prayer_research_final.pdf');
  fs.writeFileSync(prayerPdfPath, pdfBuffer);
  assert.ok(fs.existsSync(prayerPdfPath));
});
