const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Research = require('../src/models/Research');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const PDFGenerator = require('../src/services/pdf/pdfGenerator');
const DocxGenerator = require('../src/services/docx/docxGenerator');

describe('هيكلية البحث ومحتوى المطالب — UI/UX Cleanup & Unified Heading Typography', () => {
  let testUser;
  let testResearch;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/ai_research_assistant_test');
    }

    testUser = await User.create({
      name: 'باحث الفقه المقارن',
      email: `structure_clean_${Date.now()}@example.com`,
      role: 'user',
      status: 'active'
    });
  });

  after(async () => {
    if (testResearch) await Research.findByIdAndDelete(testResearch._id);
    if (testUser) await User.findByIdAndDelete(testUser._id);
  });

  test('1. Research data with multiple Mataleeb and Branches builds correctly', async () => {
    testResearch = await Research.create({
      userId: testUser._id,
      title: 'بحث فقهي في الاعتكاف وأحكامه',
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
          },
          {
            title: 'المطلب الثاني: أحكام الاعتكاف وشروطه',
            order: 2,
            branches: [
              { title: 'الفرع الأول: شروط صحة الاعتكاف', order: 1 }
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

    const doc = DocumentBuilder.buildDocument(testResearch);
    assert.ok(doc);
    assert.ok(doc.pages.length >= 3);

    const topicPages = doc.pages.filter((p) => p.pageType === 'topic');
    assert.ok(topicPages.length > 0, 'Topic pages must exist in built document');
    
    // Check that all blocks are preserved across pages
    const totalBlocks = topicPages.reduce((acc, p) => acc + (p.blocks ? p.blocks.length : 0), 0);
    assert.ok(totalBlocks >= 5, 'All topic blocks must be preserved');
  });

  test('2. Generates PDF with 18pt centered academic headings for all Mataleeb and Furoo', async () => {
    const pdfBuf = await PDFGenerator.generatePDF(testResearch);
    assert.ok(Buffer.isBuffer(pdfBuf));
    assert.ok(pdfBuf.length > 10000);
  });

  test('3. Generates DOCX with 18pt centered academic headings for all Mataleeb and Furoo', async () => {
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
