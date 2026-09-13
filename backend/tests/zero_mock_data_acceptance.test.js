const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

// Models & Services
const Research = require('../src/models/Research');
const { getDefaultCoverElements } = require('../src/services/document/coverLayout');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const docxGenerator = require('../src/services/docx/docxGenerator');
const pdfGenerator = require('../src/services/pdf/pdfGenerator');
const OpenRouterAdapter = require('../src/services/ai/OpenRouterAdapter');

describe('Zero Mock Data Acceptance Tests (Strict Invariants)', () => {
  it('1. Research schema defaults must not contain any fake or mock text', () => {
    const freshResearch = new Research({
      userId: new mongoose.Types.ObjectId()
    });

    assert.equal(freshResearch.title, '', 'Title should default to empty string');
    assert.equal(freshResearch.cover?.country || '', '', 'Cover country should be empty');
    assert.equal(freshResearch.cover?.university || '', '', 'Cover university should be empty');
    assert.equal(freshResearch.cover?.college || '', '', 'Cover college should be empty');
    assert.equal(freshResearch.cover?.studentName || '', '', 'Cover studentName should be empty');
    assert.equal(freshResearch.cover?.supervisor || '', '', 'Cover supervisor should be empty');
    assert.equal(freshResearch.cover?.logoUrl || '', '', 'Cover logoUrl should be empty');
    assert.equal(freshResearch.introduction?.opening || '', '', 'Intro opening should be empty');
    assert.equal(freshResearch.introduction?.text || '', '', 'Intro text should be empty');
    assert.deepEqual(freshResearch.structure?.tree || [], [], 'Structure tree should be empty array');
    assert.deepEqual(freshResearch.topics || [], [], 'Topics should be empty array');
    assert.deepEqual(freshResearch.conclusion?.points || [], [], 'Conclusion points should be empty');
    assert.deepEqual(freshResearch.references || [], [], 'References should be empty');
  });

  it('2. getDefaultCoverElements must have empty content for all fields by default', () => {
    const elements = getDefaultCoverElements({});
    for (const elem of elements) {
      if (elem.type === 'text') {
        assert.equal(
          elem.content,
          '',
          `Element ${elem.id} should have empty content, but had "${elem.content}"`
        );
      } else if (elem.type === 'image') {
        assert.equal(
          elem.source,
          '',
          `Image element ${elem.id} should have empty source, but had "${elem.source}"`
        );
      }
    }
  });

  it('3. DocumentBuilder.buildDocument on empty research generates 0 fake topics, 0 fake footnotes, 0 fake references', () => {
    const emptyResearch = {
      _id: 'test-123',
      title: '',
      cover: {},
      introduction: { opening: '', text: '', planSummary: '' },
      structure: { tree: [] },
      topics: [],
      conclusion: { title: 'الخاتمة', opening: '', text: '', points: [] },
      references: [],
      toc: []
    };

    const docModel = DocumentBuilder.buildDocument(emptyResearch);

    // Document & Cover
    assert.equal(docModel.title, '');
    const coverPage = docModel.pages.find(p => p.pageType === 'cover');
    assert.ok(coverPage);
    assert.equal(coverPage.data.title, '');
    assert.equal(coverPage.data.university, '');

    // Introduction page
    const introPages = docModel.pages.filter(p => p.pageType === 'introduction');
    assert.equal(introPages.length, 1);
    assert.equal(introPages[0].blocks.length, 1, 'Intro has only the header block, no fake body paragraphs');

    // Topic pages
    const topicPages = docModel.pages.filter(p => p.pageType === 'topic');
    assert.equal(topicPages.length, 0, 'Empty research should have 0 topic pages');

    // Conclusion pages
    const conclusionPages = docModel.pages.filter(p => p.pageType === 'conclusion');
    assert.equal(conclusionPages.length, 1);
    assert.equal(conclusionPages[0].data.opening, '');
    assert.deepEqual(conclusionPages[0].data.points, []);

    // Reference pages
    const referencePages = docModel.pages.filter(p => p.pageType === 'references');
    assert.equal(referencePages.length, 1);
    assert.deepEqual(referencePages[0].data.references, []);
  });

  it('4. DOCX generator runs on empty research without throwing and produces a valid zip/docx document', async () => {
    const emptyResearch = {
      _id: 'test-docx',
      title: '',
      cover: {},
      introduction: {},
      structure: { tree: [] },
      topics: [],
      conclusion: { points: [] },
      references: [],
      toc: []
    };

    const buffer = await docxGenerator.generateDocx(emptyResearch);
    assert.ok(buffer instanceof Buffer, 'Should generate valid buffer');
    assert.ok(buffer.length > 0, 'Buffer should not be empty');
  });

  it('5. PDF HTML builder runs on empty research without injecting mock text or mock logo', () => {
    const emptyResearch = {
      _id: 'test-pdf',
      title: '',
      cover: {},
      introduction: {},
      structure: { tree: [] },
      topics: [],
      conclusion: { points: [] },
      references: [],
      toc: []
    };

    const docModel = DocumentBuilder.buildDocument(emptyResearch);
    const html = pdfGenerator.buildDocumentHTML(docModel);

    assert.ok(typeof html === 'string');
    assert.ok(!html.includes('جامعة الإمام'), 'Should not contain mock university');
    assert.ok(!html.includes('الفيومي'), 'Should not contain mock author');
    assert.ok(!html.includes('الاعتكاف'), 'Should not contain mock topic');
  });

  it('6. AI OpenRouterAdapter heuristic parser returns empty tree and mataleeb when input has no structure', () => {
    const adapter = new OpenRouterAdapter('fake-key');
    const result = adapter._heuristicIntroductionAnalysis('مجرد نص بسيط لا يحتوي على أي تقسيمات ولا مطالب.');
    assert.deepEqual(result.tree, [], 'Heuristic tree should be empty array, not fabricated');
    assert.deepEqual(result.mataleeb, [], 'Heuristic mataleeb should be empty array, not fabricated');
  });
});
