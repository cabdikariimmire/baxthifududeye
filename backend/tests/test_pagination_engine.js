const PaginationEngine = require('../src/services/document/paginationEngine');
const documentSpec = require('../src/services/document/documentSpec');

const engine = new PaginationEngine(documentSpec);

// Let's create a test with a long text
const longParagraph = 'هذا نص تجريبي أكاديمي طويل جداً يهدف إلى اختبار كفاءة تقسيم الفقرات على صفحات متعددة في نظام المستندات الأكاديمية. '.repeat(40);

const blocks = [
  { type: 'h1', text: 'المبحث الأول: مفهوم العدالة الانتقالية وتطبيقاتها' },
  { type: 'paragraph', text: longParagraph },
  { type: 'h2', text: 'المطلب الأول: تعريف العدالة في الفقه والاصطلاح' },
  { type: 'paragraph', text: 'هذه فقرة المطلب الأول وتحتوي على هامش (1) لتوثيق المصدر.' },
  { type: 'paragraph', text: longParagraph },
  { type: 'h3', text: 'الفرع الأول: أركان المفهوم' },
  { type: 'paragraph', text: 'فقرة قصيرة ختامية مع هامش آخر (2) للتأكيد.' }
];

const footnotes = [
  { footnoteId: 'fn-1', originalNumber: 1, text: 'ابن منظور، لسان العرب، دار صادر، بيروت، ج 4، ص 120.' },
  { footnoteId: 'fn-2', originalNumber: 2, text: 'الغزالي، المستصفى في علم الأصول، ج 1، ص 45.' }
];

const result = engine.paginateSection({
  sectionType: 'topic',
  title: 'المبحث الأول',
  blocks,
  footnotes,
  startPageNumber: 3
});

console.log('Total pages generated:', result.pages.length);
result.pages.forEach((p, idx) => {
  console.log(`Page ${p.pageNumber}: ${p.blocks.length} blocks, ${p.footnotes.length} footnotes`);
  p.blocks.forEach((b, bIdx) => {
    console.log(`   Block ${bIdx} (${b.type}): ${b.text ? b.text.substring(0, 50) : ''}... (len: ${b.text ? b.text.length : 0})`);
  });
  p.footnotes.forEach((f) => {
    console.log(`   Footnote: ${f.marker} ${f.text}`);
  });
});
