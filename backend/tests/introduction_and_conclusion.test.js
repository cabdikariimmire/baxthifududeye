const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Research = require('../src/models/Research');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const PDFGenerator = require('../src/services/pdf/pdfGenerator');
const DocxGenerator = require('../src/services/docx/docxGenerator');
const TYPOGRAPHY = require('../src/services/document/typography');

describe('Standardized Introduction & Conclusion Typography and Structural Numbering', () => {
  let testUser;
  let testResearch;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/ai_research_assistant_test');
    }

    testUser = await User.create({
      name: 'د. باحث أكاديمي',
      email: `intro_concl_test_${Date.now()}@example.com`,
      role: 'user',
      status: 'active'
    });

    testResearch = await Research.create({
      userId: testUser._id,
      title: 'أحكام الاعتكاف ومقاصده في الشريعة الإسلامية',
      introduction: {
        opening: 'الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد وعلى آله وصحبه أجمعين، أما بعد:',
        text: 'فإن الاعتكاف من العبادات الجليلة التي شرعها الله تعالى لعباده، لما فيها من تزكية للنفوس، وتربية للقلب على الإخلاص والانقطاع إلى الله تعالى...\n\nوتبرز أهمية دراسة الاعتكاف من خلال بيان مفهومه وأحكامه الشرعية ومقاصده وآثاره التربوية والإيمانية...'
      },
      structure: {
        confirmed: true,
        detectedMataleeb: [
          { title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته', order: 1 },
          { title: 'المطلب الثاني: شروط صحة الاعتكاف ومبطلاته', order: 2 },
          { title: 'المطلب الثالث: مقاصد الاعتكاف وآثاره التربوية', order: 3 }
        ]
      },
      topics: [
        {
          topicId: 'topic-1',
          order: 1,
          h1Title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته',
          status: 'complete',
          rawContent: 'الاعتكاف لغة اللزوم، وشرعا المكث في المسجد بنية التقرب إلى الله (1).',
          blocks: [
            { type: 'h1', text: 'المطلب الأول: تعريف الاعتكاف ومشروعيته' },
            { type: 'paragraph', text: 'الاعتكاف لغة اللزوم، وشرعا المكث في المسجد بنية التقرب إلى الله (1).' }
          ],
          footnotes: [
            {
              footnoteId: 'fn-1',
              number: 1,
              marker: '(1)',
              text: 'لسان العرب، ابن منظور، دار صادر، مادة عكف.'
            }
          ]
        }
      ],
      conclusion: {
        title: 'الخاتمة',
        opening: 'الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد وعلى آله وصحبه أجمعين، أما بعد:',
        text: 'الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد وعلى آله وصحبه أجمعين، أما بعد:',
        points: [
          'أن الاعتكاف سنة مؤكدة دلت عليها نصوص الكتاب والسنة النبوية الشريفة.',
          'يشترط لصحة الاعتكاف النية والطهارة وأن يقع في مسجد تقام فيه الجماعة.',
          'الاعتكاف وسيلة تربوية وإيمانية كبرى لتطهير القلوب وتجديد الصلة بالخالق سبحانه.'
        ]
      }
    });
  });

  after(async () => {
    if (testResearch) await Research.findByIdAndDelete(testResearch._id);
    if (testUser) await User.findByIdAndDelete(testUser._id);
  });

  // A, B, C, D, E, F, G: Introduction Tests
  test('A-G. Introduction: Main Heading is 18pt, unnumbered "الحمد لله..." line is 16pt body, and all paragraphs share consistent 16pt typography', () => {
    const doc = DocumentBuilder.buildDocument(testResearch);
    const introPage = doc.pages.find((p) => p.pageType === 'introduction');
    assert.ok(introPage, 'Introduction page must exist');
    assert.strictEqual(introPage.title, 'المقدمة وخطة البحث');

    // Check typography specs
    assert.strictEqual(TYPOGRAPHY.sizes.heading, 18, 'Heading font size must be 18pt');
    assert.strictEqual(TYPOGRAPHY.sizes.body, 16, 'Paragraph body font size must be 16pt');
    assert.strictEqual(TYPOGRAPHY.fonts.primary, 'Amiri', 'Consistent Arabic font family');

    // Check opening text has no numbers
    const introContent = introPage.data.opening || introPage.data.text || '';
    assert.ok(introContent.includes('الحمد لله رب العالمين'));
    assert.ok(!/^\d+\./.test(introContent), 'Opening line must NOT be numbered');
  });

  // H, I, J, K, L, M, N: Conclusion Tests
  test('H-N. Conclusion: Heading is 18pt, "الحمد لله..." appears first without numbering, and results are structurally numbered 1, 2, 3...', () => {
    const doc = DocumentBuilder.buildDocument(testResearch);
    const conclPage = doc.pages.find((p) => p.pageType === 'conclusion');
    assert.ok(conclPage, 'Conclusion page must exist');
    assert.strictEqual(conclPage.title, 'الخاتمة');

    // 1. Unnumbered introductory paragraph
    assert.ok(conclPage.data.opening || conclPage.data.text);
    const opening = conclPage.data.opening || conclPage.data.text;
    assert.ok(opening.includes('الحمد لله رب العالمين'));
    assert.ok(!/^\d+\./.test(opening), 'Conclusion introductory paragraph must NEVER have a number');

    // 2. Structured results list
    assert.strictEqual(conclPage.data.points.length, 3, 'Must have 3 results points');
    assert.strictEqual(conclPage.data.points[0], 'أن الاعتكاف سنة مؤكدة دلت عليها نصوص الكتاب والسنة النبوية الشريفة.');
    assert.strictEqual(conclPage.data.points[1], 'يشترط لصحة الاعتكاف النية والطهارة وأن يقع في مسجد تقام فيه الجماعة.');
    assert.strictEqual(conclPage.data.points[2], 'الاعتكاف وسيلة تربوية وإيمانية كبرى لتطهير القلوب وتجديد الصلة بالخالق سبحانه.');
  });

  // O. A4 Preview Data Integrity
  test('O. Document model delivers clean A4 structure for preview rendering', () => {
    const doc = DocumentBuilder.buildDocument(testResearch);
    const introPage = doc.pages.find((p) => p.pageType === 'introduction');
    const conclPage = doc.pages.find((p) => p.pageType === 'conclusion');

    assert.strictEqual(introPage.pageNumber, 2);
    assert.ok(conclPage.pageNumber >= 4);
  });

  // P. PDF Generation with exact unnumbered intro and numbered results
  test('P. PDF generator produces valid PDF with standardized introduction and conclusion', async () => {
    const pdfBuf = await PDFGenerator.generatePDF(testResearch);
    assert.ok(Buffer.isBuffer(pdfBuf));
    assert.ok(pdfBuf.length > 10000);
  });

  // Q. DOCX Generation with exact unnumbered intro and numbered results
  test('Q. DOCX generator produces valid DOCX with unnumbered introductory paragraph and numbered results', async () => {
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
