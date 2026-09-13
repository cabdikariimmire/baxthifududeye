const test = require('node:test');
const assert = require('node:assert');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const TOCBuilder = require('../src/services/toc/tocBuilder');
const { toArabicIndicDigits } = require('../src/services/document/arabic');

test('Arabic numerals conversion operates accurately', () => {
  assert.strictEqual(toArabicIndicDigits(1), '١');
  assert.strictEqual(toArabicIndicDigits(2), '٢');
  assert.strictEqual(toArabicIndicDigits(8), '٨');
  assert.strictEqual(toArabicIndicDigits(2026), '٢٠٢٦');
});

test('DocumentBuilder generates exact 8-page sequence matching the reference PDF', () => {
  const sampleResearch = {
    title: 'الإعتكاف',
    borderId: 'border-academic-red',
    cover: {
      university: 'جامعة هرمود',
      college: 'كلية الشريعة والقيادة',
      subject: 'الفقه',
      title: 'الإعتكاف',
      studentName: 'عباس عبد الناصر',
      level: 'المستوى الثاني',
      supervisor: 'الدكتور محمد عبد الله الشرعبي'
    },
    introduction: {
      text: 'فإن الاعتكاف من العبادات الجليلة...',
      opening: 'الحمد لله رب العالمين...'
    },
    structure: {
      detectedMataleeb: [
        { title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته' },
        { title: 'المطلب الثاني: أحكام الاعتكاف وشروطه' },
        { title: 'المطلب الثالث: مقاصد الاعتكاف وآثاره التربوية والإيمانية' }
      ]
    },
    topics: [
      {
        topicId: 'topic-1',
        order: 1,
        h1Title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته',
        blocks: [{ type: 'h1', text: 'المطلب الأول' }],
        footnotes: [{ number: 1, text: 'المصباح المنير' }, { number: 2, text: 'الفقه على المذاهب الأربعة' }]
      },
      {
        topicId: 'topic-2',
        order: 2,
        h1Title: 'المطلب الثاني: أحكام الاعتكاف وشروطه',
        blocks: [{ type: 'h1', text: 'المطلب الثاني' }],
        footnotes: [{ number: 3, text: 'توضيح الأحكام' }]
      },
      {
        topicId: 'topic-3',
        order: 3,
        h1Title: 'المطلب الثالث: مقاصد الاعتكاف وآثاره التربوية والإيمانية',
        blocks: [{ type: 'h1', text: 'المطلب الثالث' }],
        footnotes: [{ number: 4, text: 'إحياء علوم الدين' }]
      }
    ],
    conclusion: {
      title: 'الخاتمة',
      points: ['النتيجة 1', 'النتيجة 2', 'النتيجة 3']
    },
    references: [
      { order: 1, book: 'إحياء علوم الدين، أبو حامد الغزالي، دار المعرفة، بيروت' },
      { order: 2, book: 'توضيح الأحكام من بلوغ المرام، عبد الله بن عبد الرحمن البسام' },
      { order: 3, book: 'الفقه على المذاهب الأربعة، عبد الرحمن الجزيري' },
      { order: 4, book: 'المصباح المنير في غريب الشرح الكبير، أحمد بن محمد بن علي الفيومي' }
    ]
  };

  const document = DocumentBuilder.buildDocument(sampleResearch);
  assert.strictEqual(document.totalPages, 8);
  assert.strictEqual(document.pages[0].pageType, 'cover');
  assert.strictEqual(document.pages[1].pageType, 'introduction');
  assert.strictEqual(document.pages[2].pageType, 'topic');
  assert.strictEqual(document.pages[3].pageType, 'topic');
  assert.strictEqual(document.pages[4].pageType, 'topic');
  assert.strictEqual(document.pages[5].pageType, 'conclusion');
  assert.strictEqual(document.pages[6].pageType, 'references');
  assert.strictEqual(document.pages[7].pageType, 'toc');

  // Verify TOC mapping matches actual pages
  const toc = document.toc;
  assert.ok(toc.some(t => t.title.includes('المقدمة') && t.pageNumber === 2));
  assert.ok(toc.some(t => t.title.includes('المطلب الأول') && t.pageNumber === 3));
  assert.ok(toc.some(t => t.title.includes('المطلب الثاني') && t.pageNumber === 4));
  assert.ok(toc.some(t => t.title.includes('المطلب الثالث') && t.pageNumber === 5));
  assert.ok(toc.some(t => t.title.includes('الخاتمة') && t.pageNumber === 6));
  assert.ok(toc.some(t => t.title.includes('المصادر والمراجع') && t.pageNumber === 7));
  assert.ok(toc.some(t => t.title.includes('فهرس الموضوعات') && t.pageNumber === 8));
});
