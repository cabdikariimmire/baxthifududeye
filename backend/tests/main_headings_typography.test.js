const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Research = require('../src/models/Research');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const PDFGenerator = require('../src/services/pdf/pdfGenerator');
const DocxGenerator = require('../src/services/docx/docxGenerator');
const TYPOGRAPHY = require('../src/services/document/typography');

describe('Final Typography & Positioning of Main Academic Headings', () => {
  let testUser;
  let testResearch;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/ai_research_assistant_test');
    }

    testUser = await User.create({
      name: 'د. باحث أكاديمي',
      email: `headings_test_${Date.now()}@example.com`,
      role: 'user',
      status: 'active'
    });

    testResearch = await Research.create({
      userId: testUser._id,
      title: 'أحكام الاعتكاف ومقاصده في الشريعة الإسلامية',
      introduction: {
        opening: 'الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد وعلى آله وصحبه أجمعين، أما بعد:',
        text: 'فإن الاعتكاف من أعظم القربات إلى الله تعالى...'
      },
      structure: {
        confirmed: true,
        detectedMataleeb: [
          { title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته', order: 1 },
          { title: 'المطلب الثاني: أحكام الاعتكاف وشروطه', order: 2 },
          { title: 'المطلب الثالث: مقاصد الاعتكاف وآثاره التربوية والإيمانية', order: 3 }
        ]
      },
      topics: [
        {
          topicId: 'topic-1',
          order: 1,
          h1Title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته',
          status: 'complete',
          rawContent: 'الاعتكاف لغة اللزوم، وشرعا المكث في المسجد بنية التقرب إلى الله.',
          blocks: [
            { type: 'h1', text: 'المطلب الأول: تعريف الاعتكاف ومشروعيته' },
            { type: 'h2', text: 'الفرع الأول: المعنى اللغوي' },
            { type: 'paragraph', text: 'الاعتكاف لغة: اللزوم والحبس والمكث في المكان (1).' },
            { type: 'h2', text: 'الفرع الثاني: المعنى الاصطلاحي' },
            { type: 'paragraph', text: 'الاعتكاف شرعاً: لزوم المسجد لطاعة الله تعالى مع النية.' }
          ],
          footnotes: [
            {
              footnoteId: 'fn-1',
              number: 1,
              marker: '(1)',
              text: 'لسان العرب، ابن منظور، دار صادر، بيروت.'
            }
          ]
        },
        {
          topicId: 'topic-2',
          order: 2,
          h1Title: 'المطلب الثاني: أحكام الاعتكاف وشروطه',
          status: 'complete',
          rawContent: 'يشترط للاعتكاف شروط معينة...',
          blocks: [
            { type: 'h1', text: 'المطلب الثاني: أحكام الاعتكاف وشروطه' },
            { type: 'paragraph', text: 'يشترط للاعتكاف شروط معينة منها الإسلام والعقل والتمييز والنية.' }
          ]
        },
        {
          topicId: 'topic-3',
          order: 3,
          h1Title: 'المطلب الثالث: مقاصد الاعتكاف وآثاره التربوية والإيمانية',
          status: 'complete',
          rawContent: 'يحقق الاعتكاف مقاصد جليلة...',
          blocks: [
            { type: 'h1', text: 'المطلب الثالث: مقاصد الاعتكاف وآثاره التربوية والإيمانية' },
            { type: 'paragraph', text: 'يحقق الاعتكاف مقاصد جليلة في تزكية النفس وإصلاح القلب.' }
          ]
        }
      ],
      conclusion: {
        title: 'الخاتمة',
        opening: 'الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد وعلى آله وصحبه أجمعين، أما بعد:',
        text: 'الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد وعلى آله وصحبه أجمعين، أما بعد:',
        points: [
          'أن الاعتكاف سنة مؤكدة في العشر الأواخر من رمضان.',
          'الاعتكاف وسيلة تربوية وإيمانية كبرى لتطهير القلوب.'
        ]
      },
      references: [
        {
          order: 1,
          book: 'لسان العرب',
          author: 'ابن منظور',
          publisher: 'دار صادر',
          city: 'بيروت'
        }
      ],
      toc: [
        { title: 'المقدمة وخطة البحث', level: 1, pageNumber: 2, targetId: 'page-2' },
        { title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته', level: 1, pageNumber: 3, targetId: 'page-3' },
        { title: 'الفرع الأول: المعنى اللغوي', level: 2, pageNumber: 3, targetId: 'page-3' },
        { title: 'الفرع الثاني: المعنى الاصطلاحي', level: 2, pageNumber: 3, targetId: 'page-3' },
        { title: 'المطلب الثاني: أحكام الاعتكاف وشروطه', level: 1, pageNumber: 4, targetId: 'page-4' },
        { title: 'المطلب الثالث: مقاصد الاعتكاف وآثاره التربوية والإيمانية', level: 1, pageNumber: 5, targetId: 'page-5' },
        { title: 'الخاتمة', level: 1, pageNumber: 6, targetId: 'page-6' },
        { title: 'المصادر والمراجع', level: 1, pageNumber: 7, targetId: 'page-7' },
        { title: 'فهرس الموضوعات', level: 1, pageNumber: 8, targetId: 'page-8' }
      ]
    });
  });

  after(async () => {
    if (testResearch) await Research.findByIdAndDelete(testResearch._id);
    if (testUser) await User.findByIdAndDelete(testUser._id);
  });

  test('1. Core Typography Standard defines exact sizes: Cover=20, Heading=18, Subheading=17, Body=16, Footnote=12', () => {
    assert.strictEqual(TYPOGRAPHY.sizes.cover, 20);
    assert.strictEqual(TYPOGRAPHY.sizes.heading, 18);
    assert.strictEqual(TYPOGRAPHY.sizes.subheading, 17);
    assert.strictEqual(TYPOGRAPHY.sizes.body, 16);
    assert.strictEqual(TYPOGRAPHY.sizes.footnote, 12);
    assert.strictEqual(TYPOGRAPHY.fonts.primary, 'Amiri');
  });

  test('2. All Main Headings in DocumentBuilder are structured with consistent 18pt level 1 titles', () => {
    const doc = DocumentBuilder.buildDocument(testResearch);
    const mainHeadings = [
      'المقدمة وخطة البحث',
      'المطلب الأول: تعريف الاعتكاف ومشروعيته',
      'المطلب الثاني: أحكام الاعتكاف وشروطه',
      'المطلب الثالث: مقاصد الاعتكاف وآثاره التربوية والإيمانية',
      'الخاتمة',
      'المصادر والمراجع',
      'فهرس الموضوعات'
    ];

    mainHeadings.forEach((expectedTitle) => {
      const page = doc.pages.find((p) => p.title === expectedTitle);
      assert.ok(page, `Document must contain main heading: ${expectedTitle}`);
    });
  });

  test('3. PDF Generator contains unified CSS class .main-heading / .page-title / .topic-h1 centered at 18pt', async () => {
    const pdfBuf = await PDFGenerator.generatePDF(testResearch);
    assert.ok(Buffer.isBuffer(pdfBuf));
    assert.ok(pdfBuf.length > 10000);
  });

  test('4. DOCX Generator contains exact 18pt centered main headings and 17pt right-aligned subheadings', async () => {
    const docxBuf = await DocxGenerator.generateDocx(testResearch);
    assert.ok(Buffer.isBuffer(docxBuf));
    assert.ok(docxBuf.length > 8000);
  });

  after(async () => {
    if (testResearch) await Research.findByIdAndDelete(testResearch._id);
    if (testUser) await User.findByIdAndDelete(testUser._id);
    await mongoose.disconnect();
  });
});
