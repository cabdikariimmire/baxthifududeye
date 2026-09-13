const { describe, it } = require('node:test');
const assert = require('node:assert');
const JSZip = require('jszip');
const DocxGenerator = require('../src/services/docx/docxGenerator');
const docxStyles = require('../src/services/docx/docxStyles');

describe('DOCX Hierarchy Order Regression Tests', () => {
  // Helper to extract non-empty paragraph text from DOCX buffer
  async function extractDocxParagraphs(buffer) {
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.files['word/document.xml'].async('text');
    const pMatches = xml.match(/<w:p[\s>].*?<\/w:p>/g) || [];
    return pMatches
      .map((p) => {
        const tMatches = p.match(/<w:t[\s>].*?<\/w:t>/g) || [];
        return tMatches.map((t) => t.replace(/<[^>]+>/g, '')).join('').trim();
      })
      .filter((t) => t.length > 0);
  }

  // 1. One Mabhath with Multiple Mataleeb + Mabhath content + Matlab content
  it('1. Correctly orders: Mabhath -> Mabhath Content -> Matlab 1 -> Matlab 1 Content -> Matlab 2 -> Matlab 2 Content', async () => {
    const research = {
      title: 'بحث تجريبي',
      cover: { title: 'بحث تجريبي' },
      introduction: { text: 'مقدمة البحث' },
      structure: {
        tree: [
          {
            id: 'mabhath-1',
            type: 'mabhath',
            title: 'مفهوم الاعتكاف ومشروعيته',
            order: 1,
            children: [
              {
                id: 'matlab-1',
                type: 'matlab',
                title: 'تعريف الاعتكاف',
                order: 1,
                children: []
              },
              {
                id: 'matlab-2',
                type: 'matlab',
                title: 'مشروعية الاعتكاف',
                order: 2,
                children: []
              }
            ]
          }
        ]
      },
      topics: [
        {
          topicId: 'matlab-1',
          structureNodeId: 'matlab-1',
          h1Title: 'المطلب الأول: تعريف الاعتكاف',
          mabhathId: 'mabhath-1',
          mabhathTitle: 'المبحث الأول: مفهوم الاعتكاف ومشروعيته',
          mabhathOrder: 1,
          matlabOrder: 1,
          blocks: [
            { type: 'mabhath', text: 'المبحث الأول: مفهوم الاعتكاف ومشروعيته' },
            { type: 'paragraph', text: 'هذا هو نص محتوى المبحث الأول التمهيدي.' },
            { type: 'matlab', text: 'المطلب الأول: تعريف الاعتكاف' },
            { type: 'paragraph', text: 'هذا هو نص محتوى المطلب الأول الخاص بالتعريف.' }
          ]
        },
        {
          topicId: 'matlab-2',
          structureNodeId: 'matlab-2',
          h1Title: 'المطلب الثاني: مشروعية الاعتكاف',
          mabhathId: 'mabhath-1',
          mabhathTitle: 'المبحث الأول: مفهوم الاعتكاف ومشروعيته',
          mabhathOrder: 1,
          matlabOrder: 2,
          blocks: [
            { type: 'matlab', text: 'المطلب الثاني: مشروعية الاعتكاف' },
            { type: 'paragraph', text: 'هذا هو نص محتوى المطلب الثاني الخاص بالمشروعية.' }
          ]
        }
      ]
    };

    const buf = await DocxGenerator.generateDocx(research);
    const paragraphs = await extractDocxParagraphs(buf);

    // Filter to topic content items
    const relevant = paragraphs.filter((p) =>
      p.includes('المبحث الأول') ||
      p.includes('نص محتوى المبحث') ||
      p.includes('المطلب الأول') ||
      p.includes('نص محتوى المطلب الأول') ||
      p.includes('المطلب الثاني') ||
      p.includes('نص محتوى المطلب الثاني')
    );

    // In TOC, headings are also present. Let's find the content occurrences
    const mbIdx = relevant.indexOf('المبحث الأول: مفهوم الاعتكاف ومشروعيته');
    assert.ok(mbIdx !== -1, 'Mabhath heading must be present');

    const mbContentIdx = relevant.indexOf('هذا هو نص محتوى المبحث الأول التمهيدي.');
    assert.ok(mbContentIdx !== -1, 'Mabhath content must be present');

    const m1Idx = relevant.indexOf('المطلب الأول: تعريف الاعتكاف');
    assert.ok(m1Idx !== -1, 'Matlab 1 heading must be present');

    const m1ContentIdx = relevant.indexOf('هذا هو نص محتوى المطلب الأول الخاص بالتعريف.');
    assert.ok(m1ContentIdx !== -1, 'Matlab 1 content must be present');

    const m2Idx = relevant.indexOf('المطلب الثاني: مشروعية الاعتكاف');
    assert.ok(m2Idx !== -1, 'Matlab 2 heading must be present');

    const m2ContentIdx = relevant.indexOf('هذا هو نص محتوى المطلب الثاني الخاص بالمشروعية.');
    assert.ok(m2ContentIdx !== -1, 'Matlab 2 content must be present');

    // Verify EXACT ordering:
    // Mabhath -> Mabhath Content -> Matlab 1 -> Matlab 1 Content -> Matlab 2 -> Matlab 2 Content
    assert.ok(mbIdx < mbContentIdx, 'Mabhath heading must precede Mabhath content');
    assert.ok(mbContentIdx < m1Idx, 'Mabhath content must precede Matlab 1 heading');
    assert.ok(m1Idx < m1ContentIdx, 'Matlab 1 heading must precede Matlab 1 content');
    assert.ok(m1ContentIdx < m2Idx, 'Matlab 1 content must precede Matlab 2 heading');
    assert.ok(m2Idx < m2ContentIdx, 'Matlab 2 heading must precede Matlab 2 content');
  });

  // 2. Multiple Mabaheth
  it('2. Correctly renders multiple Mabaheth without flattening or misnumbering Mataleeb', async () => {
    const research = {
      title: 'بحث متعدد المباحث',
      cover: { title: 'بحث متعدد المباحث' },
      structure: {
        tree: [
          {
            id: 'mb-1',
            type: 'mabhath',
            title: 'المبحث الأول التجريبي',
            order: 1,
            children: [
              { id: 'mt-1-1', type: 'matlab', title: 'مطلب أول في مبحث أول', order: 1, children: [] },
              { id: 'mt-1-2', type: 'matlab', title: 'مطلب ثان في مبحث أول', order: 2, children: [] }
            ]
          },
          {
            id: 'mb-2',
            type: 'mabhath',
            title: 'المبحث الثاني التجريبي',
            order: 2,
            children: [
              { id: 'mt-2-1', type: 'matlab', title: 'مطلب أول في مبحث ثان', order: 1, children: [] },
              { id: 'mt-2-2', type: 'matlab', title: 'مطلب ثان في مبحث ثان', order: 2, children: [] }
            ]
          }
        ]
      },
      topics: [
        { topicId: 'mt-1-1', structureNodeId: 'mt-1-1', h1Title: 'المطلب الأول: مطلب أول في مبحث أول', mabhathId: 'mb-1' },
        { topicId: 'mt-1-2', structureNodeId: 'mt-1-2', h1Title: 'المطلب الثاني: مطلب ثان في مبحث أول', mabhathId: 'mb-1' },
        { topicId: 'mt-2-1', structureNodeId: 'mt-2-1', h1Title: 'المطلب الأول: مطلب أول في مبحث ثان', mabhathId: 'mb-2' },
        { topicId: 'mt-2-2', structureNodeId: 'mt-2-2', h1Title: 'المطلب الثاني: مطلب ثان في مبحث ثان', mabhathId: 'mb-2' }
      ]
    };

    const buf = await DocxGenerator.generateDocx(research);
    const paragraphs = await extractDocxParagraphs(buf);

    const bodyHeadings = paragraphs.filter((p) =>
      p.startsWith('المبحث') || p.startsWith('المطلب')
    );

    // Verify Mabhath 1 is before Mabhath 2
    const mb1Idx = bodyHeadings.indexOf('المبحث الأول: المبحث الأول التجريبي');
    const mb2Idx = bodyHeadings.indexOf('المبحث الثاني: المبحث الثاني التجريبي');
    assert.ok(mb1Idx !== -1 && mb2Idx !== -1, 'Both Mabaheth must be present');
    assert.ok(mb1Idx < mb2Idx, 'Mabhath 1 must appear before Mabhath 2');

    // Verify under Mabhath 2, Mataleeb restart numbering at الأول and الثاني (NOT الثالث and الرابع)
    const m21Idx = bodyHeadings.indexOf('المطلب الأول: مطلب أول في مبحث ثان');
    const m22Idx = bodyHeadings.indexOf('المطلب الثاني: مطلب ثان في مبحث ثان');
    assert.ok(m21Idx !== -1, 'Matlab under Mabhath 2 must be numbered المطلب الأول');
    assert.ok(m22Idx !== -1, 'Second Matlab under Mabhath 2 must be numbered المطلب الثاني');
    assert.ok(mb2Idx < m21Idx, 'Mabhath 2 must precede its first Matlab');
    assert.ok(m21Idx < m22Idx, 'Matlab 1 must precede Matlab 2 under Mabhath 2');
  });

  // 3. One Mabhath with One Matlab
  it('3. Works correctly for one Mabhath with one Matlab', async () => {
    const research = {
      title: 'مبحث ومطلب واحد',
      cover: { title: 'مبحث ومطلب واحد' },
      structure: {
        tree: [
          {
            id: 'mb-1',
            type: 'mabhath',
            title: 'المبحث الوحيد',
            order: 1,
            children: [
              { id: 'mt-1', type: 'matlab', title: 'المطلب الوحيد', order: 1, children: [] }
            ]
          }
        ]
      },
      topics: [
        {
          topicId: 'mt-1',
          structureNodeId: 'mt-1',
          h1Title: 'المطلب الأول: المطلب الوحيد',
          mabhathId: 'mb-1',
          blocks: [
            { type: 'mabhath', text: 'المبحث الأول: المبحث الوحيد' },
            { type: 'paragraph', text: 'محتوى المبحث الوحيد' },
            { type: 'matlab', text: 'المطلب الأول: المطلب الوحيد' },
            { type: 'paragraph', text: 'محتوى المطلب الوحيد' }
          ]
        }
      ]
    };

    const buf = await DocxGenerator.generateDocx(research);
    const paragraphs = await extractDocxParagraphs(buf);

    const mbIdx = paragraphs.indexOf('المبحث الأول: المبحث الوحيد');
    const mbCIdx = paragraphs.indexOf('محتوى المبحث الوحيد');
    const mtIdx = paragraphs.indexOf('المطلب الأول: المطلب الوحيد');
    const mtCIdx = paragraphs.indexOf('محتوى المطلب الوحيد');

    assert.ok(mbIdx < mbCIdx, 'Mabhath heading before Mabhath content');
    assert.ok(mbCIdx < mtIdx, 'Mabhath content before Matlab heading');
    assert.ok(mtIdx < mtCIdx, 'Matlab heading before Matlab content');
  });

  // 4. Empty Mabhath content and empty Matlab content
  it('4. Handles empty Mabhath and Matlab content cleanly without inserting fake/mock text', async () => {
    const research = {
      title: 'بحث بدون محتوى',
      cover: { title: 'بحث بدون محتوى' },
      structure: {
        tree: [
          {
            id: 'mb-1',
            type: 'mabhath',
            title: 'المبحث الخالي',
            order: 1,
            children: [
              { id: 'mt-1', type: 'matlab', title: 'المطلب الخالي', order: 1, children: [] }
            ]
          }
        ]
      },
      topics: [
        {
          topicId: 'mt-1',
          structureNodeId: 'mt-1',
          h1Title: 'المطلب الأول: المطلب الخالي',
          mabhathId: 'mb-1',
          blocks: [],
          rawContent: ''
        }
      ]
    };

    const buf = await DocxGenerator.generateDocx(research);
    const paragraphs = await extractDocxParagraphs(buf);

    const mbIdx = paragraphs.indexOf('المبحث الأول: المبحث الخالي');
    const mtIdx = paragraphs.indexOf('المطلب الأول: المطلب الخالي');

    assert.ok(mbIdx !== -1, 'Mabhath heading must exist');
    assert.ok(mtIdx !== -1, 'Matlab heading must exist');
    assert.ok(mbIdx < mtIdx, 'Mabhath must precede Matlab');
  });

  // 5. Native Word Footnotes preserved
  it('5. Native Word Footnotes are correctly linked in footnotes.xml and document.xml', async () => {
    const research = {
      title: 'بحث مع هوامش',
      cover: { title: 'بحث مع هوامش' },
      structure: {
        tree: [
          {
            id: 'mb-1',
            type: 'mabhath',
            title: 'المبحث',
            order: 1,
            children: [
              { id: 'mt-1', type: 'matlab', title: 'المطلب', order: 1, children: [] }
            ]
          }
        ]
      },
      topics: [
        {
          topicId: 'mt-1',
          structureNodeId: 'mt-1',
          h1Title: 'المطلب الأول: المطلب',
          mabhathId: 'mb-1',
          blocks: [
            { type: 'paragraph', text: 'نص بهامش في المطلب (1).' }
          ],
          footnotes: [
            { footnoteId: 'fn-1', number: 1, marker: '(1)', text: 'صحيح البخاري، كتاب الصلاة، رقم 100.' }
          ]
        }
      ]
    };

    const buf = await DocxGenerator.generateDocx(research);
    const zip = await JSZip.loadAsync(buf);

    assert.ok(zip.files['word/footnotes.xml'], 'footnotes.xml must exist');
    const fnXml = await zip.files['word/footnotes.xml'].async('text');
    assert.ok(fnXml.includes('صحيح البخاري، كتاب الصلاة، رقم 100'), 'Footnote text must exist in footnotes.xml');

    const docXml = await zip.files['word/document.xml'].async('text');
    assert.ok(docXml.includes('<w:footnoteReference'), 'Body must contain footnote reference run');
  });

  // 6. Research without Mabhath (Case B)
  it('6. Correctly renders research without Mabhath (Mataleeb are main 18pt headings)', async () => {
    const research = {
      title: 'بحث بدون مباحث',
      cover: { title: 'بحث بدون مباحث' },
      structure: {
        tree: [
          { id: 'mt-1', type: 'matlab', title: 'المطلب الأول المستقل', order: 1, children: [] },
          { id: 'mt-2', type: 'matlab', title: 'المطلب الثاني المستقل', order: 2, children: [] }
        ]
      },
      topics: [
        {
          topicId: 'mt-1',
          structureNodeId: 'mt-1',
          h1Title: 'المطلب الأول: المطلب الأول المستقل',
          blocks: [{ type: 'paragraph', text: 'محتوى المطلب الأول' }]
        },
        {
          topicId: 'mt-2',
          structureNodeId: 'mt-2',
          h1Title: 'المطلب الثاني: المطلب الثاني المستقل',
          blocks: [{ type: 'paragraph', text: 'محتوى المطلب الثاني' }]
        }
      ]
    };

    const buf = await DocxGenerator.generateDocx(research);
    const paragraphs = await extractDocxParagraphs(buf);

    const mt1Idx = paragraphs.indexOf('المطلب الأول: المطلب الأول المستقل');
    const mt1CIdx = paragraphs.indexOf('محتوى المطلب الأول');
    const mt2Idx = paragraphs.indexOf('المطلب الثاني: المطلب الثاني المستقل');
    const mt2CIdx = paragraphs.indexOf('محتوى المطلب الثاني');

    assert.ok(mt1Idx !== -1 && mt2Idx !== -1, 'Both Mataleeb must exist');
    assert.ok(mt1Idx < mt1CIdx, 'Matlab 1 heading before content');
    assert.ok(mt1CIdx < mt2Idx, 'Matlab 1 content before Matlab 2 heading');
    assert.ok(mt2Idx < mt2CIdx, 'Matlab 2 heading before content');
  });
});
