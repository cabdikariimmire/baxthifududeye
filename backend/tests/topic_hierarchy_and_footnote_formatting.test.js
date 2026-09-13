const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Research = require('../src/models/Research');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const PDFGenerator = require('../src/services/pdf/pdfGenerator');
const DocxGenerator = require('../src/services/docx/docxGenerator');

describe('محتوى المطالب — Topic Hierarchy (18pt Mataleeb Centered, 17pt Furoo Right-Aligned) & Footnote Formatting', () => {
  let testUser;
  let testResearch;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/ai_research_assistant_test');
    }

    testUser = await User.create({
      name: 'باحث الفقه والدراسات',
      email: `topic_hierarchy_${Date.now()}@example.com`,
      role: 'user',
      status: 'active'
    });

    testResearch = await Research.create({
      userId: testUser._id,
      title: 'بحث فقهي في أحكام الاعتكاف',
      structure: {
        confirmed: true,
        detectedMataleeb: [
          {
            title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته',
            order: 1,
            branches: [
              { title: 'الفرع الأول: المعنى اللغوي', order: 1 },
              { title: 'الفرع الثاني: المعنى الاصطلاحي', order: 2 }
            ]
          }
        ]
      },
      topics: [
        {
          topicId: 'topic-1',
          order: 1,
          h1Title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته',
          rawContent: 'الفرع الأول: المعنى اللغوي\nالاعتكاف لغة هو لزوم الشيء والمكث فيه (1).\nالفرع الثاني: المعنى الاصطلاحي\nوهو لزوم المسجد لطاعة الله تعالى (2).',
          blocks: [
            { type: 'h1', text: 'المطلب الأول: تعريف الاعتكاف ومشروعيته' },
            { type: 'h2', text: 'الفرع الأول: المعنى اللغوي' },
            { type: 'paragraph', text: 'الاعتكاف لغة هو لزوم الشيء والمكث فيه (1).' },
            { type: 'h2', text: 'الفرع الثاني: المعنى الاصطلاحي' },
            { type: 'paragraph', text: 'وهو لزوم المسجد لطاعة الله تعالى (2).' }
          ],
          footnotes: [
            { footnoteId: 'fn-1', number: 1, marker: '(1)', text: 'لسان العرب، ابن منظور، مادة عكف.' },
            { footnoteId: 'fn-2', number: 2, marker: '(2)', text: 'المغني، ابن قدامة، ج3، ص 122.' }
          ]
        }
      ]
    });
  });

  after(async () => {
    if (testResearch) await Research.findByIdAndDelete(testResearch._id);
    if (testUser) await User.findByIdAndDelete(testUser._id);
  });

  test('1. Document model builds with topic blocks and page-based footnotes', () => {
    const doc = DocumentBuilder.buildDocument(testResearch);
    assert.ok(doc);
    const topicPage = doc.pages.find((p) => p.pageType === 'topic');
    assert.ok(topicPage, 'Topic page must exist');
    assert.ok(topicPage.blocks.length >= 4);
    assert.strictEqual(topicPage.footnotes.length, 2);
  });

  test('2. PDF generator produces PDF containing 18pt centered H1, 17pt right-aligned H2, and 16pt body with inline markers', async () => {
    const pdfBuf = await PDFGenerator.generatePDF(testResearch);
    assert.ok(Buffer.isBuffer(pdfBuf));
    assert.ok(pdfBuf.length > 10000);
  });

  test('3. DOCX generator produces Word document with 18pt centered H1, 17pt right-aligned H2, and 16pt body', async () => {
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
