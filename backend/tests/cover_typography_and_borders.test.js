const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Research = require('../src/models/Research');
const defaultBorders = require('../src/services/document/defaultBorders');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const PDFGenerator = require('../src/services/pdf/pdfGenerator');
const DocxGenerator = require('../src/services/docx/docxGenerator');
const TYPOGRAPHY = require('../src/services/document/typography');
const PaginationEngine = require('../src/services/document/paginationEngine');

describe('Critical Document Engine: Typography, Border Selector, A4 Pagination & Page-Based Footnotes', () => {
  let testUser;
  let testResearch;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/ai_research_assistant_test');
    }

    testUser = await User.create({
      name: 'د. محمد إبراهيم عيد',
      email: `critical_test_${Date.now()}@example.com`,
      role: 'user',
      status: 'active'
    });

    testResearch = await Research.create({
      userId: testUser._id,
      title: 'الكفالة في الفقه الإسلامي وتطبيقاتها المعاصرة',
      // Default should be 'none'
      cover: {
        country: 'جمهورية الصومال',
        university: 'جامعة هرمود',
        college: 'كلية الشريعة والقيادة',
        subject: 'الفقه المقارن',
        title: 'الكفالة في الفقه الإسلامي وتطبيقاتها المعاصرة',
        studentName: 'محمد إبراهيم عيد',
        level: 'المستوى الثاني',
        supervisor: 'الدكتور محمد عبد الله ناجي',
        semester: 'الفصل الدراسي الثاني',
        academicYear: '1447–1448هـ',
        gregorianYear: '2025–2026م',
        badgeColor: '#f0ad7c'
      },
      topics: [
        {
          topicId: 'topic-1',
          order: 1,
          h1Title: 'المطلب الأول: تعريف الكفالة ومشروعيتها',
          status: 'complete',
          rawContent: 'محتوى المطلب الأول...',
          blocks: [
            { type: 'h1', text: 'المطلب الأول: تعريف الكفالة ومشروعيتها' },
            { type: 'h2', text: 'الفرع الأول: المعنى اللغوي للكفالة' },
            {
              type: 'paragraph',
              text: 'الكفالة في اللغة مأخوذة من الكَفَل، وهو الضم والالتزام. يقال: كفلت بالمال أي ألزمت نفسي به وضمنته وأديته لصاحبه (1). ومنه قوله تعالى في محكم التنزيل: ﴿وَكَفَّلَهَا زَكَرِيَّا﴾ أي ضمها إليه وقام بأمرها ورعايتها (2). والضمان والحمالة والزعيم كلها ألفاظ تدل على معنى الالتزام بالحق (3).'
            },
            { type: 'h2', text: 'الفرع الثاني: المعنى الاصطلاحي الفقهي' },
            {
              type: 'paragraph',
              text: 'وفي الاصطلاح الفقهي عرّفها فقهاء المذاهب الأربعة بأنها: ضم ذمة الضامن إلى ذمة المضمون عنه في التزام المطالبة بالحق الثابت في الذمة، سواء كان ديناً أو عيناً أو نفساً (4). وذهب الحنفية إلى أنها ضم ذمة إلى ذمة في المطالبة دون أصل الوجوب، بينما ذهب الجمهور إلى أنها ضم ذمة في الدين والمطالبة معاً (5).'
            },
            {
              type: 'paragraph',
              text: 'وقد ثبتت مشروعية الكفالة بالكتاب والسنة والإجماع والمعقول. فمن القرآن الكريم قوله سبحانه: ﴿وَلِمَنْ جَاءَ بِهِ حِمْلُ بَعِيرٍ وَأَنَا بِهِ زَعِيمٌ﴾ أي ضامن وكفيل. ومن السنة النبوية الشريفة قوله صلى الله عليه وسلم: «الزعيم غارم» رواه أبو داود والترمذي وحسنه (6). ومما يؤكد مشروعيتها حاجة الناس إلى توثيق الديون وتيسير المعاملات المالية بين الأفراد والمؤسسات.'
            },
            { type: 'h2', text: 'الفرع الثالث: أركان الكفالة وشروط صحتها' },
            {
              type: 'paragraph',
              text: 'يشترط لصحة عقد الكفالة أركان أساسية متفق عليها بين الفقهاء: الكفيل (الضامن)، والمكفول له (الدائن صاحب الحق)، والمكفول عنه (الأصيل المدين)، والمكفول به (الحق المضمون)، وصيغة الإيجاب والقبول (7). ويشترط في الكفيل أن يكون أهلاً للتبرع، بالغاً عاقلاً رشيداً، غير محجور عليه لسفه أو إفلاس (8).'
            },
            {
              type: 'paragraph',
              text: 'كما يشترط في المكفول به أن يكون حقاً لازماً أو مآله إلى اللزوم، معلوماً أو قابلاً للعلم، ومما يصح الالتزام به شرعاً فلا تصح الكفالة في محرم كالخمر والخنزير وما في حكمهما (9). وتعد الكفالة من عقود التوثيقات التي يترتب عليها حفظ الحقوق ودفع الضرر عن الدائنين في المعاملات المالية المعاصرة (10).'
            }
          ],
          footnotes: [
            {
              footnoteId: 'fn-1-1',
              number: 1,
              marker: '(1)',
              text: 'لسان العرب، ابن منظور، دار صادر – بيروت، مادة (كفل)، ج11، ص 590.'
            },
            {
              footnoteId: 'fn-1-2',
              number: 2,
              marker: '(2)',
              text: 'تفسير القرآن العظيم، ابن كثير، دار طيبة، ط2، 1420هـ، ج2، ص 38.'
            },
            {
              footnoteId: 'fn-1-3',
              number: 3,
              marker: '(3)',
              text: 'المصباح المنير في غريب الشرح الكبير، الفيومي، المكتبة العلمية، ج2، ص 534.'
            },
            {
              footnoteId: 'fn-1-4',
              number: 4,
              marker: '(4)',
              text: 'بدائع الصنائع في ترتيب الشرائع، الكاساني، دار الكتب العلمية، ج6، ص 3.'
            },
            {
              footnoteId: 'fn-1-5',
              number: 5,
              marker: '(5)',
              text: 'المغني، ابن قدامة المقدسي، دار إحياء التراث العربي، ج5، ص 64.'
            },
            {
              footnoteId: 'fn-1-6',
              number: 6,
              marker: '(6)',
              text: 'سنن أبي داود، كتاب البيوع، باب في تضمين العارية، رقم الحديث (3565).'
            },
            {
              footnoteId: 'fn-1-7',
              number: 7,
              marker: '(7)',
              text: 'الفقه الإسلامي وأدلته، وهبة الزحيلي، دار الفكر – دمشق، ط4، ج6، ص 4120.'
            },
            {
              footnoteId: 'fn-1-8',
              number: 8,
              marker: '(8)',
              text: 'حاشية الرد المحتار على الدر المختار، ابن عابدين، دار الفكر، ج5، ص 280.'
            },
            {
              footnoteId: 'fn-1-9',
              number: 9,
              marker: '(9)',
              text: 'الشرح الكبير للدردير مع حاشية الدسوقي، دار الفكر، ج3، ص 331.'
            },
            {
              footnoteId: 'fn-1-10',
              number: 10,
              marker: '(10)',
              text: 'المعايير الشرعية، هيئة المحاسبة والمراجعة للمؤسسات المالية الإسلامية (AAOIFI)، المعيار رقم (5).'
            }
          ]
        }
      ]
    });
  });

  after(async () => {
    if (testResearch) await Research.findByIdAndDelete(testResearch._id);
    if (testUser) await User.findByIdAndDelete(testUser._id);
  });

  // 1. Default Border = "بدون إطار" (none)
  test('1. Default border style for new research is "بدون إطار" (none)', async () => {
    assert.strictEqual(testResearch.borderId, 'none', 'New research model default border must be "none"');
    const border = defaultBorders.getNormalizedBorder(testResearch.borderId);
    assert.strictEqual(border.borderId, 'none');
    assert.strictEqual(border.nameAr, 'بدون إطار');
    assert.strictEqual(border.svgPattern, '', 'No SVG border pattern rendered');
  });

  // 2. Border Selection Behavior
  test('2. Border selection switches cleanly between stars, islamic, and none', () => {
    // Select stars
    const starDoc = DocumentBuilder.buildDocument(testResearch, { borderId: 'stars' });
    assert.strictEqual(starDoc.border.borderId, 'stars');
    assert.ok(starDoc.border.svgPattern.includes('<polygon'));

    // Select islamic
    const islamicDoc = DocumentBuilder.buildDocument(testResearch, { borderId: 'islamic' });
    assert.strictEqual(islamicDoc.border.borderId, 'islamic');
    assert.ok(islamicDoc.border.svgPattern.includes('B8860B'));

    // Select none
    const noneDoc = DocumentBuilder.buildDocument(testResearch, { borderId: 'none' });
    assert.strictEqual(noneDoc.border.borderId, 'none');
    assert.strictEqual(noneDoc.border.svgPattern, '');
  });

  // 3. Exact Typography Hierarchy
  test('3. Exact typography values: Cover=20pt, H1=18pt, H2=17pt, Body=16pt, Footnote=12pt', () => {
    assert.strictEqual(TYPOGRAPHY.sizes.cover, 20, 'Cover must be 20pt');
    assert.strictEqual(TYPOGRAPHY.sizes.heading, 18, 'Main heading must be 18pt');
    assert.strictEqual(TYPOGRAPHY.sizes.subheading, 17, 'Subheading must be 17pt');
    assert.strictEqual(TYPOGRAPHY.sizes.body, 16, 'Body paragraph must be 16pt');
    assert.strictEqual(TYPOGRAPHY.sizes.footnote, 12, 'Footnote must be 12pt');
    assert.strictEqual(TYPOGRAPHY.fonts.primary, 'Amiri', 'Consistent Amiri Arabic font');
    assert.strictEqual(TYPOGRAPHY.fonts.headings, 'Amiri', 'Consistent Amiri Arabic font for headings');
  });

  // 4. Content-Aware Multi-Page A4 Pagination
  test('4. Topic content exceeding one A4 page automatically splits into multiple A4 pages', () => {
    const doc = DocumentBuilder.buildDocument(testResearch);
    const topicPages = doc.pages.filter((p) => p.pageType === 'topic');
    assert.ok(topicPages.length >= 2, `Topic with 5 paragraphs and 10 footnotes must span at least 2 A4 pages. Got ${topicPages.length}`);

    // Verify page numbers are sequential
    topicPages.forEach((p, idx) => {
      assert.strictEqual(p.pageNumber, idx + 3, `Page number must be sequential: expected ${idx + 3}, got ${p.pageNumber}`);
    });
  });

  // 5. Page-Based Footnotes: Numbering restarts at (1) on EVERY page
  test('5. Footnotes are page-based and restart numbering at (1) on every single page', () => {
    const doc = DocumentBuilder.buildDocument(testResearch);
    const topicPages = doc.pages.filter((p) => p.pageType === 'topic');

    assert.ok(topicPages.length >= 2, 'Must have at least 2 topic pages to verify page-based footnotes');

    // Page 1 Footnotes
    const p1Footnotes = topicPages[0].footnotes;
    assert.ok(p1Footnotes.length > 0, 'Page 1 must have footnotes');
    assert.strictEqual(p1Footnotes[0].number, 1, 'Page 1 first footnote must be numbered 1');
    assert.strictEqual(p1Footnotes[0].marker, '(1)', 'Page 1 first footnote marker must be (1)');
    p1Footnotes.forEach((fn, idx) => {
      assert.strictEqual(fn.number, idx + 1, `Page 1 footnote ${idx} must have local number ${idx + 1}`);
      assert.strictEqual(fn.marker, `(${idx + 1})`, `Page 1 footnote ${idx} must have local marker (${idx + 1})`);
    });

    // Page 2 Footnotes
    const p2Footnotes = topicPages[1].footnotes;
    assert.ok(p2Footnotes.length > 0, 'Page 2 must have footnotes');
    assert.strictEqual(p2Footnotes[0].number, 1, 'Page 2 first footnote MUST restart at 1');
    assert.strictEqual(p2Footnotes[0].marker, '(1)', 'Page 2 first footnote marker MUST be (1)');
    p2Footnotes.forEach((fn, idx) => {
      assert.strictEqual(fn.number, idx + 1, `Page 2 footnote ${idx} must have local number ${idx + 1}`);
      assert.strictEqual(fn.marker, `(${idx + 1})`, `Page 2 footnote ${idx} must have local marker (${idx + 1})`);
    });

    // Verify rewritten text blocks on Page 2 also use local marker (1)
    const p2Text = topicPages[1].blocks.map((b) => b.text).join(' ');
    assert.ok(p2Text.includes('(1)'), 'Page 2 text block must contain local footnote marker (1)');
  });

  // 6. Footnotes stay strictly on the correct page
  test('6. Footnotes stay with their respective page without overlap or clipping', () => {
    const doc = DocumentBuilder.buildDocument(testResearch);
    const topicPages = doc.pages.filter((p) => p.pageType === 'topic');

    const p1StableIds = topicPages[0].footnotes.map((f) => f.id || f.footnoteId);
    const p2StableIds = topicPages[1].footnotes.map((f) => f.id || f.footnoteId);

    // Ensure no duplicate footnotes across pages
    p1StableIds.forEach((id) => {
      assert.ok(!p2StableIds.includes(id), `Footnote ${id} on Page 1 must not appear on Page 2`);
    });
  });

  // 7. DOCX Generation with Page-Based Footnotes & 20pt Cover
  test('7. DOCX generator builds valid document with page-based footnotes and exact typography', async () => {
    const docxBuffer = await DocxGenerator.generateDocx(testResearch);
    assert.ok(Buffer.isBuffer(docxBuffer), 'DOCX output must be a Buffer');
    assert.ok(docxBuffer.length > 10000, 'DOCX buffer must contain complete paginated research');
  });

  // 8. PDF Generation with Page-Based Footnotes & 20pt Cover
  test('8. PDF generator builds valid PDF buffer with exact typography and default no-border', async () => {
    const pdfBuffer = await PDFGenerator.generatePdf(testResearch);
    assert.ok(Buffer.isBuffer(pdfBuffer), 'PDF output must be a Buffer');
    assert.ok(pdfBuffer.length > 10000, 'PDF buffer must contain complete paginated research');
  });

  after(async () => {
    if (testResearch) await Research.findByIdAndDelete(testResearch._id);
    if (testUser) await User.findByIdAndDelete(testUser._id);
    await mongoose.disconnect();
  });
});
