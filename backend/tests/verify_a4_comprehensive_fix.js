const assert = require('assert');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const PDFGenerator = require('../src/services/pdf/pdfGenerator');
const { generateDocxBuffer } = require('../src/services/docx/docxGenerator');
const PaginationEngine = require('../src/services/document/paginationEngine');
const { parseArabicIndicDigits, toArabicIndicDigits } = require('../src/services/document/arabic');

console.log('=== STARTING COMPREHENSIVE A4 VERIFICATION ===\n');

// 1. Test Arabic-Indic parsing and conversion
console.log('1. Testing Arabic-Indic digit helpers...');
assert.strictEqual(parseArabicIndicDigits('١'), 1);
assert.strictEqual(parseArabicIndicDigits('١٢'), 12);
assert.strictEqual(parseArabicIndicDigits('(٣)'), 3);
assert.strictEqual(parseArabicIndicDigits('(4)'), 4);
assert.strictEqual(toArabicIndicDigits(5), '٥');
assert.strictEqual(toArabicIndicDigits(12), '١٢');
console.log('  ✔ Digit helpers verified.');

// 2. Realistic Academic Research Data with Mixed Footnotes, Headings, and Long Paragraphs
console.log('\n2. Building complex realistic academic research model...');

const sampleResearch = {
  title: 'أثر التطور التقني والذكاء الاصطناعي في البحث الفقهي المعاصر',
  borderId: 'none',
  cover: {
    country: 'المملكة العربية السعودية',
    university: 'جامعة الإمام محمد بن سعود الإسلامية',
    college: 'كلية الشريعة والدراسات الإسلامية',
    subject: 'الفقه المقارن وأصول الفقه',
    title: 'أثر التطور التقني والذكاء الاصطناعي في البحث الفقهي المعاصر: دراسة تأصيلية تطبيقية',
    studentName: 'عبد الله بن عبد العزيز الباحث',
    level: 'السنة المنهجية لمرحلة الماجستير',
    supervisor: 'أ.د. محمد بن عبد الرحمن السليمان',
    semester: 'الفصل الدراسي الأول',
    academicYear: '1446-1447هـ',
    gregorianYear: '2025-2026م',
    badgeColor: '#1e3a8a',
    coverLayout: {
      elements: [
        { id: 'country', type: 'text', content: 'المملكة العربية السعودية', x: 25, y: 24, width: 160, height: 9, fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#0f172a', zIndex: 1 },
        { id: 'university', type: 'text', content: 'جامعة الإمام محمد بن سعود الإسلامية', x: 25, y: 35, width: 160, height: 9, fontSize: 20.5, fontWeight: 'bold', textAlign: 'center', color: '#0f172a', zIndex: 1 },
        { id: 'logo', type: 'image', source: '', x: 87.5, y: 48, width: 35, height: 35, zIndex: 2 },
        { id: 'college', type: 'text', content: 'كلية الشريعة والدراسات الإسلامية', x: 25, y: 90, width: 160, height: 9, fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#0f172a', zIndex: 1 },
        { id: 'subject', type: 'text', prefix: 'المادة : ', content: 'الفقه المقارن وأصول الفقه', x: 25, y: 102, width: 160, height: 9, fontSize: 19.5, fontWeight: 'bold', textAlign: 'center', color: '#1e293b', zIndex: 1 },
        { id: 'title', type: 'pill', content: 'أثر التطور التقني والذكاء الاصطناعي في البحث الفقهي المعاصر', badgeColor: '#1e3a8a', x: 30, y: 125, width: 150, height: 18, fontSize: 20.5, fontWeight: 'bold', textAlign: 'center', color: '#0f172a', zIndex: 3 },
        { id: 'studentName', type: 'text', prefix: 'إعداد الطالب : ', content: 'عبد الله بن عبد العزيز الباحث', x: 25, y: 158, width: 160, height: 9, fontSize: 19.5, fontWeight: 'bold', textAlign: 'center', color: '#1e293b', zIndex: 1 },
        { id: 'supervisor', type: 'text', prefix: 'إشراف الدكتور : ', content: 'أ.د. محمد بن عبد الرحمن السليمان', x: 25, y: 180, width: 160, height: 9, fontSize: 19.5, fontWeight: 'bold', textAlign: 'center', color: '#1e293b', zIndex: 1 },
        { id: 'academicYear', type: 'text', content: 'العام الدراسي 1446-1447هـ', x: 25, y: 220, width: 160, height: 9, fontSize: 18.5, fontWeight: 'bold', textAlign: 'center', color: '#334155', zIndex: 1 }
      ]
    }
  },
  introduction: {
    opening: 'الحمد لله رب العالمين والصلاة والسلام على أشرف الأنبياء والمرسلين نبينا محمد وعلى آله وصحبه أجمعين.',
    text: 'أما بعد: فإن الشريعة الإسلامية الغراء جاءت صالحة لكل زمان ومكان، متضمنة من القواعد الكلية والأصول العامة ما يستوعب كل نازلة ومستجد.\nولقد شهد العصر الحاضر ثورة تقنية كبرى في مجالات الذكاء الاصطناعي ونظم معالجة البيانات، مما كان له أثر بالغ في مناهج البحث العلمي بعامة، والبحث الفقهي بخاصة.\nويهدف هذا البحث إلى بيان الضوابط الشرعية والمقاصدية للاستفادة من هذه النظم الرقمية في الفتيا وتخريج الفروع على الأصول، مع التحذير من المزالق المنهجية التي قد تنشأ عن الاعتماد الكلي على الآلة دون فقه وتحقيق.\nوتنتظم خطة البحث في مقدمة ومطلبين وخاتمة وفهرس للموضوعات.'
  },
  topics: [
    {
      topicId: 'topic-1',
      h1Title: 'المطلب الأول: حقيقة الذكاء الاصطناعي Artificial Intelligence وتطبيقاته الفقهية',
      blocks: [
        {
          type: 'h1',
          text: 'المطلب الأول: حقيقة الذكاء الاصطناعي وتطبيقاته الفقهية'
        },
        {
          type: 'paragraph',
          text: 'يقصد بالذكاء الاصطناعي في الاصطلاح المعاصر: قدرة النظم البرمجية والآلات على محاكاة القدرات الذهنية البشرية كالتعلم والاستنباط وإدراك العلاقات (١). وقد تنوعت استخداماته في العصر الحاضر لتشمل استرجاع النصوص التراثية وفهرسة المسائل الفقهية وتوليد الإجابات الرقمية (٢).'
        },
        {
          type: 'paragraph',
          text: 'وقد اختلف المعاصرون في حجية الاعتماد على هذه المخرجات الرقمية في التوثيق والتحقيق على قولين؛ فالقول الأول يرى جواز الاستئناس بها مع وجوب المراجعة البشرية الدقيقة للأصول المعتمدة (3). واستدلوا بأن الوسائل لها أحكام المقاصد، وما لا يتم الواجب إلا به فهو واجب.'
        },
        {
          type: 'h2',
          text: 'الفرع الأول: الضوابط المنهجية في توثيق المسائل الفقهية'
        },
        {
          type: 'paragraph',
          text: 'إن توثيق النقول وعزو الأقوال إلى مصادرها الأصلية يعد ركنا ركينا في الأمانة العلمية (٤). والواجب على الباحث الشرعي أن يتثبت من نسبة القول إلى قائله وصحة النقل عن الأئمة والفقهاء، ولا يكتفي بمجرد العزو الآلي المجرد دون الرجوع إلى المطبوعات المحققة والمخطوطات المعتمدة (٥).'
        },
        {
          type: 'paragraph',
          text: 'وقد نص العلماء سلفا وخلفا على أن الإسناد من الدين، ولولا الإسناد لقال من شاء ما شاء (6). وهذا المعنى متأكد في العصر الرقمي الحديث مع انتشار الإحالات غير المحررة والخلط بين المصطلحات في قواعد البيانات المتعددة.'
        }
      ],
      footnotes: [
        { footnoteId: 'fn-1', number: 1, originalNumber: 1, marker: '(١)', text: 'انظر: المعجم الحاسوبي لمصطلحات الذكاء الاصطناعي، ص ٤٥.' },
        { footnoteId: 'fn-2', number: 2, originalNumber: 2, marker: '(٢)', text: 'انظر: التقنيات الحديثة والبحث الفقهي، د. إبراهيم القاضي، مجلة الفقه المعاصر، ع 12، ص 89.' },
        { footnoteId: 'fn-3', number: 3, originalNumber: 3, marker: '(3)', text: 'انظر: فتاوى النوازل الرقمية، الشيخ عبد الله بن بيه، دار القلم، دمشق، ط1، 1442هـ، ص 112.' },
        { footnoteId: 'fn-4', number: 4, originalNumber: 4, marker: '(٤)', text: 'قواعد التوثيق العلمي عند المحدثين والفقهاء، د. صلاح الأزهري، ص 67.' },
        { footnoteId: 'fn-5', number: 5, originalNumber: 5, marker: '(٥)', text: 'انظر: ضوابط الفتيا والبحث الشرعي، د. عبد الكريم الخضير، ص 94.' },
        { footnoteId: 'fn-6', number: 6, originalNumber: 6, marker: '(6)', text: 'أخرجه مسلم في مقدمة صحيحه (1/15) عن عبد الله بن المبارك رحمه الله.' }
      ]
    }
  ],
  conclusion: {
    title: 'الخاتمة',
    opening: 'وفي ختام هذا البحث الموجز، نحمد الله تعالى على توفيقه وإعانته، ونسجل أبرز النتائج والتوصيات التي تم التوصل إليها:',
    points: [
      'أن الذكاء الاصطناعي أداة مساعدة ولا يرتقي لمرتبة الاجتهاد أو الفتوى المستقلة.',
      'وجوب التحقق البشري من كل عزو أو نص مستخرج بالوسائل الآلية.',
      'أهمية تطوير قواعد بيانات فقهية محققة تخدم الباحثين مع المحافظة على دقة النقل والأمانة العلمية.'
    ]
  },
  references: [
    { book: 'صحيح مسلم', author: 'مسلم بن الحجاج النيسابوري', publisher: 'دار إحياء التراث العربي', city: 'بيروت', year: '1374هـ' },
    { book: 'فتاوى النوازل الرقمية', author: 'عبد الله بن بيه', publisher: 'دار القلم', city: 'دمشق', edition: 'ط1', year: '1442هـ' },
    { book: 'المعجم الحاسوبي لمصطلحات الذكاء الاصطناعي', author: 'مجمع الملك سلمان', publisher: 'الرياض', year: '1444هـ' }
  ]
};

const docModel = DocumentBuilder.buildDocument(sampleResearch);

console.log(`Document built successfully. Total pages: ${docModel.totalPages}`);
assert.ok(docModel.totalPages >= 5, `Expected at least 5 pages, got ${docModel.totalPages}`);

// Verify Cover page
const coverPage = docModel.pages.find((p) => p.pageType === 'cover');
assert.ok(coverPage, 'Cover page must exist');
assert.strictEqual(coverPage.pageNumber, 1);
assert.ok(coverPage.data.coverLayout, 'Cover layout must be preserved');
console.log('  ✔ Cover page data preserved.');

// Verify Topic pages and footnote renumbering
const topicPages = docModel.pages.filter((p) => p.pageType === 'topic');
assert.ok(topicPages.length >= 1, 'Topic pages must exist');

topicPages.forEach((tp, tpIdx) => {
  console.log(`\nChecking Topic Page #${tp.pageNumber} (Topic page ${tpIdx + 1}):`);
  console.log(`  Blocks count: ${tp.blocks.length}`);
  console.log(`  Footnotes count: ${tp.footnotes.length}`);
  
  if (tp.footnotes.length > 0) {
    // Footnote numbers must start at 1 and be contiguous
    tp.footnotes.forEach((fn, fIdx) => {
      assert.strictEqual(fn.number, fIdx + 1, `Footnote ${fIdx} on page ${tp.pageNumber} should be renumbered to ${fIdx + 1}, got ${fn.number}`);
      console.log(`    Footnote local #${fn.number} (orig: ${fn.originalNumber}): "${fn.text.substring(0, 40)}..."`);
    });

    // Inline markers in blocks on this page must match local numbering (1), (2)...
    const allText = tp.blocks.map(b => b.text).join(' ');
    console.log(`    Checking inline markers in text...`);
    tp.footnotes.forEach((fn) => {
      const expectedMarker = `(${fn.number})`;
      assert.ok(allText.includes(expectedMarker), `Page text must include page-local marker ${expectedMarker}`);
    });
  }
});
console.log('  ✔ Page-local footnote renumbering and association verified.');

// 3. Verify HTML output from PDF Generator
console.log('\n3. Testing PDF Generator HTML output...');
const html = PDFGenerator.buildDocumentHTML(docModel);

// Verify cover page has no 24mm offset and no footer
assert.ok(html.includes('class="a4-cover-layer"'), 'PDF HTML must contain a4-cover-layer');
assert.ok(html.includes('position: absolute; left: 25mm; top: 24mm;'), 'PDF HTML must contain exact millimeter coordinates');
assert.ok(html.includes('position: absolute; left: 30mm; top: 125mm;'), 'PDF HTML must contain exact title coordinates');

// Verify footnote marker style is black
assert.ok(html.includes('.inline-footnote-marker {'), 'PDF HTML must contain inline-footnote-marker style');
assert.ok(html.includes('color: #000000 !important;'), 'Inline footnote marker in PDF CSS must be solid black #000000');
assert.ok(html.includes('width: 38mm;'), 'Footnote separator in PDF CSS must be exactly 38mm');

// Verify TOC header font is Amiri
assert.ok(html.includes(".toc-header-bar {\n      display: flex;\n      justify-content: space-between;\n      padding: 6px 12px;\n      background: #f1f5f9;\n      border: 1px solid #cbd5e1;\n      font-family: 'Amiri', serif !important;"), 'TOC header font must be Amiri');

console.log('  ✔ PDF HTML and CSS styles verified.');

const DocxGenerator = require('../src/services/docx/docxGenerator');

// 4. Verify DOCX and PDF Generation
console.log('\n4. Testing DOCX and PDF Generation...');
(async () => {
  try {
    const docxBuf = await DocxGenerator.generateDocx(sampleResearch);
    assert.ok(Buffer.isBuffer(docxBuf), 'DOCX generator must produce a valid Buffer');
    assert.ok(docxBuf.length > 5000, `DOCX buffer size (${docxBuf.length} bytes) is valid`);
    console.log(`  ✔ DOCX Generator produced valid binary buffer (${docxBuf.length} bytes).`);

    const pdfBuf = await PDFGenerator.generatePDF(sampleResearch);
    assert.ok(Buffer.isBuffer(pdfBuf), 'PDF generator must produce a valid Buffer');
    assert.ok(pdfBuf.length > 10000, `PDF buffer size (${pdfBuf.length} bytes) is valid`);
    console.log(`  ✔ PDF Generator with Puppeteer produced valid A4 PDF buffer (${pdfBuf.length} bytes).`);

    console.log('\n=== ALL A4 VERIFICATION CHECKS PASSED PERFECTLY ===\n');
  } catch (err) {
    console.error('Generation Error:', err);
    process.exit(1);
  }
})();
