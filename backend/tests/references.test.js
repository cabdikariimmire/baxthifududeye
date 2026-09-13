const test = require('node:test');
const assert = require('node:assert');
const { normalizeReference } = require('../src/services/references/normalizer');
const { deduplicateReferences } = require('../src/services/references/deduplicator');

test('Reference Normalizer strips volume and page numbers per project rule', () => {
  const sample1 = {
    book: 'المصباح المنير في غريب الشرح الكبير، أحمد بن محمد بن علي الفيومي ثم الحموي، أبو العباس (المتوفى: نحو 770هـ) ،المكتبة العلمية – بيروت ج1 ص 424',
    rawFootnote: 'المصباح المنير في غريب الشرح الكبير، أحمد بن محمد بن علي الفيومي ثم الحموي، أبو العباس (المتوفى: نحو 770هـ) ،المكتبة العلمية – بيروت ج1 ص 424'
  };

  const normalized1 = normalizeReference(sample1);
  assert.ok(normalized1.book.includes('المصباح المنير'));
  assert.ok(!normalized1.book.includes('ج1'));
  assert.ok(!normalized1.book.includes('ص 424'));

  const sample2 = {
    book: 'الفقه على المذاهب الأربعة، عبد الرحمن الجزيري، دار الكتب العلمية، بيروت، الطبعة الثانية، 2003م، ج1، ص-566 569.',
    rawFootnote: '...'
  };

  const normalized2 = normalizeReference(sample2);
  assert.ok(!normalized2.book.includes('ج1'));
  assert.ok(!normalized2.book.includes('ص-566'));
});

test('Reference Deduplicator combines repeated citations of the same book', () => {
  const refs = [
    {
      book: 'إحياء علوم الدين',
      author: 'أبو حامد الغزالي',
      publisher: 'دار المعرفة',
      city: 'بيروت',
      normalizedKey: 'احياءعلومالدين_ابوحامدالغزالي'
    },
    {
      book: 'إحياء علوم الدين',
      author: 'أبو حامد الغزالي',
      publisher: 'دار المعرفة',
      city: 'بيروت',
      normalizedKey: 'احياءعلومالدين_ابوحامدالغزالي'
    },
    {
      book: 'الفقه على المذاهب الأربعة',
      author: 'عبد الرحمن الجزيري',
      publisher: 'دار الكتب العلمية',
      city: 'بيروت',
      normalizedKey: 'الفقهعليالمذاهبالاربعه_عبدالرحمنالجزيري'
    }
  ];

  const unique = deduplicateReferences(refs);
  assert.strictEqual(unique.length, 2);
  assert.strictEqual(unique[0].order, 1);
  assert.strictEqual(unique[1].order, 2);
});
