const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Research = require('../src/models/Research');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const PDFGenerator = require('../src/services/pdf/pdfGenerator');
const DocxGenerator = require('../src/services/docx/docxGenerator');

describe('المقدمة وخطة البحث — Unified Continuous Editor & Output', () => {
  let testUser;
  let testResearch;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/ai_research_assistant_test');
    }

    testUser = await User.create({
      name: 'باحث المقدمة والخطة',
      email: `intro_test_${Date.now()}@example.com`,
      role: 'user',
      status: 'active'
    });
  });

  after(async () => {
    if (testResearch) await Research.findByIdAndDelete(testResearch._id);
    if (testUser) await User.findByIdAndDelete(testUser._id);
  });

  test('1. Heading is strictly "المقدمة وخطة البحث"', async () => {
    testResearch = await Research.create({
      userId: testUser._id,
      title: 'بحث فقهي حول الاعتكاف',
      introduction: {
        text: `الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد وعلى آله وصحبه أجمعين، أما بعد:

إن الاعتكاف من العبادات الجليلة التي شرعها الله تعالى لعباده، لما فيها من تزكية للنفوس، وتربية للقلب على الإخلاص والانقطاع إلى الله تعالى.

ويتكون هذا البحث من ثلاثة مطالب وخاتمة، على النحو الآتي:
المطلب الأول: تعريف الاعتكاف ومشروعيته
المطلب الثاني: أحكام الاعتكاف
المطلب الثالث: مقاصد الاعتكاف وآثاره
الخاتمة`
      }
    });

    const doc = DocumentBuilder.buildDocument(testResearch);
    const introPage = doc.pages.find((p) => p.pageType === 'introduction');

    assert.ok(introPage, 'Introduction page must exist');
    assert.strictEqual(introPage.title, 'المقدمة وخطة البحث');
  });

  test('2. "الحمد لله..." and plan are in ONE continuous content flow without duplicate plan rendering', async () => {
    const doc = DocumentBuilder.buildDocument(testResearch);
    const introPage = doc.pages.find((p) => p.pageType === 'introduction');

    assert.ok(introPage.data.text.includes('الحمد لله رب العالمين'));
    assert.ok(introPage.data.text.includes('المطلب الأول: تعريف الاعتكاف'));

    // Count occurrences of "المطلب الأول" to ensure NO duplicate plan
    const occurrences = (introPage.data.text.match(/المطلب الأول/g) || []).length;
    assert.strictEqual(occurrences, 1, 'Plan items must appear exactly once, no duplicate plan');
  });

  test('3. Generates valid PDF with single unified introduction stream', async () => {
    const pdfBuf = await PDFGenerator.generatePDF(testResearch);
    assert.ok(Buffer.isBuffer(pdfBuf));
    assert.ok(pdfBuf.length > 10000);
  });

  test('4. Generates valid DOCX with single unified introduction stream', async () => {
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
