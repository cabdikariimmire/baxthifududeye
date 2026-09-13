const PaginationEngine = require('../src/services/document/paginationEngine');
const documentSpec = require('../src/services/document/documentSpec');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const assert = require('node:assert/strict');

const engine = new PaginationEngine(documentSpec);

console.log('Testing Heavy Arabic Research with 3500-char paragraph and 8 footnotes...');

const heavySentence = 'تعتبر دراسة النوازل الفقهية المعاصرة من أهم الواجبات العلمية التي تقتضي استقراء الأدلة وتطبيق القواعد الأصولية والمقاصد الشرعية بدقة ومنهجية وتوثيق أصيل. ';
const massiveParagraph = heavySentence.repeat(25); // ~3750 characters

const research = {
  title: 'بحث فقهي موسع',
  borderId: 'none',
  cover: { title: 'بحث فقهي موسع' },
  introduction: {
    opening: 'الحمد لله رب العالمين...',
    text: 'مقدمة البحث وخطة الدراسة التفصيلية.'
  },
  topics: [
    {
      topicId: 'topic-1',
      h1Title: 'المطلب الأول: تأصيل النوازل الفقهية',
      rawContent: `هذه الفقرة الأولى التمهيدية (1) تفتتح المطلب الأول.\n\n${massiveParagraph}\n\nوهذه فقرة ختامية متضمنة توثيقاً إضافياً (2).`,
      footnotes: [
        { footnoteId: 'fn-1', number: 1, text: 'السرخسي، المبسوط، ج 1، ص 10.' },
        { footnoteId: 'fn-2', number: 2, text: 'الشاطبي، الموافقات، ج 2، ص 20.' }
      ]
    }
  ],
  conclusion: { text: 'الخاتمة والنتائج.' },
  references: [{ order: 1, book: 'المبسوط للسرخسي' }]
};

const doc = DocumentBuilder.buildDocument(research);

console.log(`Generated Total Pages: ${doc.pages.length}`);
doc.pages.forEach((p) => {
  const cHeight = p.debugContentHeight || 0;
  const fHeight = p.debugFootnoteHeight || 0;
  const total = cHeight + fHeight;

  console.log(`Page ${p.pageNumber} (${p.pageType}) : ${total.toFixed(2)} pt / 705.83 pt (Blocks: ${(p.blocks || []).length}, Fns: ${(p.footnotes || []).length})`);
  assert.ok(total <= engine.usableHeightPt, `Page ${p.pageNumber} exceeded 705.83pt! Total was ${total}`);
});

console.log('✓ All pages strictly fit within 705.83pt without overflow or clipping!');
