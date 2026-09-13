const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Research = require('../src/models/Research');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const DocxGenerator = require('../src/services/docx/docxGenerator');

describe('Inline Footnotes & Document Integration Engine', () => {
  let testUser;
  let testResearch;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/ai_research_assistant_test');
    }

    testUser = await User.create({
      name: 'د. يوسف الباحث',
      email: `inline_fn_test_${Date.now()}@example.com`,
      role: 'user',
      status: 'active'
    });

    testResearch = await Research.create({
      userId: testUser._id,
      title: 'أحكام الاعتكاف في الفقه الإسلامي',
      currentStep: 4,
      status: 'in_progress',
      topics: [
        {
          topicId: 'topic-1',
          order: 1,
          h1Title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته',
          rawContent: 'الاعتكاف لغة هو اللزوم والمكث (1)، واصطلاحا لزوم المسجد لطاعة الله (2).',
          blocks: [
            { type: 'h1', text: 'المطلب الأول: تعريف الاعتكاف ومشروعيته' },
            { type: 'paragraph', text: 'الاعتكاف لغة هو اللزوم والمكث (1)، واصطلاحا لزوم المسجد لطاعة الله (2).' }
          ],
          footnotes: [
            {
              footnoteId: 'fn-topic-1-1',
              number: 1,
              marker: '(1)',
              text: 'ابن منظور، لسان العرب، دار صادر، بيروت، مادة عكف'
            },
            {
              footnoteId: 'fn-topic-1-2',
              number: 2,
              marker: '(2)',
              text: 'النووي، المجموع شرح المهذب، دار الفكر، ج6، ص 475'
            }
          ]
        },
        {
          topicId: 'topic-2',
          order: 2,
          h1Title: 'المطلب الثاني: شروط صحة الاعتكاف ومبطلاته',
          rawContent: 'يشترط لصحة الاعتكاف النية والطهارة وأن يكون في مسجد (1).',
          blocks: [
            { type: 'h1', text: 'المطلب الثاني: شروط صحة الاعتكاف ومبطلاته' },
            { type: 'paragraph', text: 'يشترط لصحة الاعتكاف النية والطهارة وأن يكون في مسجد (1).' }
          ],
          footnotes: [
            {
              footnoteId: 'fn-topic-2-1',
              number: 1,
              marker: '(1)',
              text: 'ابن قدامة، المغني، دار إحياء التراث العربي، بيروت، ج3، ص 187'
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

  test('1. Research topics retain structured footnotes with stable IDs in MongoDB', async () => {
    const fetched = await Research.findById(testResearch._id);
    assert.strictEqual(fetched.topics.length, 2);
    assert.strictEqual(fetched.topics[0].footnotes.length, 2);
    assert.strictEqual(fetched.topics[0].footnotes[0].footnoteId, 'fn-topic-1-1');
    assert.strictEqual(fetched.topics[0].footnotes[0].marker, '(1)');
    assert.strictEqual(fetched.topics[0].footnotes[1].footnoteId, 'fn-topic-1-2');
    assert.strictEqual(fetched.topics[0].footnotes[1].marker, '(2)');
  });

  test('2. DocumentBuilder builds A4 pages with page-based footnotes (restarting at 1 per page)', () => {
    const doc = DocumentBuilder.buildDocument(testResearch);
    assert.ok(doc.pages.length >= 6, 'Should generate cover, intro, topics, conclusion, references, toc');

    // Find topic pages
    const topicPages = doc.pages.filter((p) => p.pageType === 'topic');
    assert.ok(topicPages.length >= 2, 'Should have at least 2 topic pages');

    const firstTopicPage = topicPages[0];
    assert.ok(firstTopicPage.footnotes.length >= 2, 'First topic page must include its footnotes');
    assert.strictEqual(firstTopicPage.footnotes[0].number, 1);
    assert.strictEqual(firstTopicPage.footnotes[1].number, 2);

    const secondTopicPage = topicPages[1];
    assert.ok(secondTopicPage.footnotes.length >= 1, 'Second topic page must include its footnote');
    assert.strictEqual(secondTopicPage.footnotes[0].number, 1, 'Page 2 footnote numbering must restart at 1');
  });

  test('3. References page automatically aggregates bibliography from topic footnotes', () => {
    const doc = DocumentBuilder.buildDocument(testResearch);
    const refPage = doc.pages.find((p) => p.pageType === 'references');
    assert.ok(refPage, 'References page must exist');
    assert.ok(refPage.data.references.length >= 3, 'Should aggregate 3 distinct bibliography references');
  });

  test('4. DOCX Generator creates valid binary buffer with academic footnotes', async () => {
    const docxBuffer = await DocxGenerator.generateDocx(testResearch);
    assert.ok(Buffer.isBuffer(docxBuffer), 'DOCX result must be a valid Buffer');
    assert.ok(docxBuffer.length > 5000, 'DOCX buffer size must be substantial');
  });

  after(async () => {
    if (testResearch) await Research.findByIdAndDelete(testResearch._id);
    if (testUser) await User.findByIdAndDelete(testUser._id);
    await mongoose.disconnect();
  });
});
