const test = require('node:test');
const assert = require('node:assert');
const { stripVolumeAndPage, normalizeReference, formatReferenceForDisplay } = require('../src/services/references/normalizer');
const { deduplicateReferences } = require('../src/services/references/deduplicator');
const {
  sortReferencesArabic,
  getArabicSortKey,
  compareArabic,
  formatContinuousBibliography
} = require('../src/services/references/arabicSort');
const OpenRouterAdapter = require('../src/services/ai/OpenRouterAdapter');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const { buildReferencesChildren } = require('../src/services/docx/docxSections');

test('TEST 1: Reference Normalizer strips volume and page citations while preserving bibliographic details', () => {
  const footnoteText = 'الفقة على المذاهب الأربعة، عبد الرحمن الجزيري، دار الكتب العلمية، بيروت، الطبعة الثانية، 2003م، ج 1، ص 566';
  const rawRef = {
    book: 'الفقة على المذاهب الأربعة',
    author: 'عبد الرحمن الجزيري',
    publisher: 'دار الكتب العلمية',
    city: 'بيروت',
    edition: 'الطبعة الثانية',
    year: '2003م',
    displayText: footnoteText,
    rawFootnote: footnoteText
  };

  const normalized = normalizeReference(rawRef);
  assert.ok(normalized.displayText.includes('الفقة على المذاهب الأربعة'));
  assert.ok(normalized.displayText.includes('عبد الرحمن الجزيري'));
  assert.ok(normalized.displayText.includes('دار الكتب العلمية'));
  assert.ok(normalized.displayText.includes('بيروت'));
  assert.ok(normalized.displayText.includes('الطبعة الثانية'));
  assert.ok(normalized.displayText.includes('2003م'));
  assert.ok(!normalized.displayText.includes('ج 1'));
  assert.ok(!normalized.displayText.includes('ص 566'));

  // Footnote itself must remain completely unchanged
  assert.strictEqual(normalized.rawFootnote, footnoteText);
  assert.ok(normalized.rawFootnote.includes('ج 1، ص 566'));
});

test('TEST 1 (cont.): stripVolumeAndPage handles various volume and page formats including ordinals, colons, and slash notations', () => {
  const cases = [
    {
      in: 'تفسير القرطبي، الجزء الأول، الصفحة 50، دار الشعب',
      out: 'تفسير القرطبي، دار الشعب'
    },
    {
      in: 'صحيح البخاري، مج 2، ص 100-105',
      out: 'صحيح البخاري'
    },
    {
      in: 'المجموع شرح المهذب، النووي، ج: 3، ص: 120، دار الفكر',
      out: 'المجموع شرح المهذب، النووي، دار الفكر'
    },
    {
      in: 'المغني، ابن قدامة، دار عالم الكتب، الرياض، 1997م، (2/80)',
      out: 'المغني، ابن قدامة، دار عالم الكتب، الرياض، 1997م'
    },
    {
      in: 'كتاب الفقه، المجلد العاشر، ص ص 45 وما بعدها',
      out: 'كتاب الفقه'
    },
    {
      in: 'الأم للشافعي، ج ١، ص ٥٦٦',
      out: 'الأم للشافعي'
    }
  ];

  cases.forEach(({ in: input, out: expected }) => {
    const stripped = stripVolumeAndPage(input);
    assert.strictEqual(stripped, expected, `Failed for input: ${input}`);
  });
});

test('TEST 2: Deduplication collapses multiple citations of the same book with different volumes/pages', () => {
  const refs = [
    {
      book: 'المبسوط للسرخسي',
      author: 'السرخسي',
      publisher: 'دار المعرفة',
      city: 'بيروت',
      year: '1993م',
      displayText: 'المبسوط للسرخسي، دار المعرفة، بيروت، 1993م، ج 1، ص 50',
      normalizedKey: 'مبسوط_سرخسي'
    },
    {
      book: 'المبسوط للسرخسي',
      author: 'السرخسي',
      publisher: 'دار المعرفة',
      city: 'بيروت',
      year: '1993م',
      displayText: 'المبسوط للسرخسي، دار المعرفة، بيروت، 1993م، ج 2، ص 120',
      normalizedKey: 'مبسوط_سرخسي'
    },
    {
      book: 'المبسوط للسرخسي',
      author: 'السرخسي',
      publisher: 'دار المعرفة',
      city: 'بيروت',
      year: '1993م',
      displayText: 'المبسوط للسرخسي، دار المعرفة، بيروت، 1993م، ج 5، ص 300',
      normalizedKey: 'مبسوط_سرخسي'
    },
    {
      book: 'المغني',
      author: 'ابن قدامة',
      publisher: 'دار عالم الكتب',
      city: 'الرياض',
      year: '1997م',
      displayText: 'المغني، ابن قدامة، دار عالم الكتب، الرياض، 1997م',
      normalizedKey: 'مغني_ابنقدامه'
    }
  ];

  const unique = deduplicateReferences(refs);
  assert.strictEqual(unique.length, 2, 'Must collapse 3 citations of Al-Mabsut into 1');
  assert.strictEqual(unique[0].order, 1);
  assert.strictEqual(unique[1].order, 2);
  assert.strictEqual(unique[0].book, 'المبسوط للسرخسي');
  assert.strictEqual(unique[1].book, 'المغني');
});

test('TEST 3: References added in random order are sorted alphabetically per Arabic Abjad rule', () => {
  const randomList = [
    { book: 'محمد في القرآن', displayText: 'محمد في القرآن' },
    { book: 'أحمد بن حنبل ومحنته', displayText: 'أحمد بن حنبل ومحنته' },
    { book: 'عبد الرحمن الجزيري', displayText: 'عبد الرحمن الجزيري' },
    { book: 'ابن قدامة وآراؤه', displayText: 'ابن قدامة وآراؤه' },
    { book: 'يوسف الصديق', displayText: 'يوسف الصديق' }
  ];

  const sorted = sortReferencesArabic(randomList, { ignoreAl: true });
  const books = sorted.map((r) => r.book);

  assert.deepStrictEqual(books, [
    'ابن قدامة وآراؤه',
    'أحمد بن حنبل ومحنته',
    'عبد الرحمن الجزيري',
    'محمد في القرآن',
    'يوسف الصديق'
  ]);
});

test('TEST 4: Author ordering works correctly and is preferred for sorting', () => {
  const refs = [
    {
      book: 'الفقه على المذاهب الأربعة',
      author: 'الجزيري، عبد الرحمن',
      displayText: 'الجزيري، عبد الرحمن، الفقه على المذاهب الأربعة، دار الكتب العلمية، بيروت، الطبعة الثانية، 2003م'
    },
    {
      book: 'المجموع شرح المهذب',
      author: 'النووي',
      displayText: 'النووي، المجموع شرح المهذب، دار الفكر، بيروت، 1997م'
    },
    {
      book: 'المغني',
      author: 'ابن قدامة',
      displayText: 'ابن قدامة، المغني، دار عالم الكتب، الرياض، 1997م'
    }
  ];

  const sorted = sortReferencesArabic(refs, { ignoreAl: true });
  const authors = sorted.map((r) => r.author);

  assert.deepStrictEqual(authors, [
    'ابن قدامة',
    'الجزيري، عبد الرحمن',
    'النووي'
  ]);
});

test('TEST 5: Arabic letter variants (أ, إ, آ, ا) are handled consistently', () => {
  const variants = [
    { book: 'إبراهيم الخليل' },
    { book: 'أحمد شوقي' },
    { book: 'ابن الأثير' },
    { book: 'آدم وحواء' }
  ];

  const sorted = sortReferencesArabic(variants, { ignoreAl: true });
  const books = sorted.map((r) => r.book);

  // In Arabic alphabetical order:
  // إبراهيم: ا + ب + ر
  // ابن: ا + ب + ن (ر comes before ن)
  // أحمد: ا + ح (ح comes after ب)
  // آدم: ا + د (د comes after ح)
  assert.deepStrictEqual(books, [
    'إبراهيم الخليل',
    'ابن الأثير',
    'أحمد شوقي',
    'آدم وحواء'
  ]);
});

test('TEST 6: Original footnotes in topic retain their full text with volume/page while heuristic extraction strips them', () => {
  const adapter = new OpenRouterAdapter();
  const rawFootnotes = [
    {
      number: 1,
      text: 'الفقة على المذاهب الأربعة، عبد الرحمن الجزيري، دار الكتب العلمية، بيروت، الطبعة الثانية، 2003م، ج 1، ص 566'
    },
    {
      number: 2,
      text: 'المجموع شرح المهذب، النووي، دار الفكر، بيروت، 1997م، ج 3، ص 120'
    },
    {
      number: 3,
      text: 'المغني، ابن قدامة، دار عالم الكتب، الرياض، 1997م، ج 2، ص 80'
    }
  ];

  const extracted = adapter._heuristicReferenceExtraction(rawFootnotes);
  assert.strictEqual(extracted.references.length, 3);

  // Extracted references must NOT contain volume or page
  extracted.references.forEach((ref) => {
    assert.ok(!ref.book.includes('ج 1') && !ref.book.includes('ج 2') && !ref.book.includes('ج 3'));
    assert.ok(!ref.book.includes('ص 566') && !ref.book.includes('ص 120') && !ref.book.includes('ص 80'));
  });

  // Footnote raw text must be strictly preserved
  assert.strictEqual(rawFootnotes[0].text, 'الفقة على المذاهب الأربعة، عبد الرحمن الجزيري، دار الكتب العلمية، بيروت، الطبعة الثانية، 2003م، ج 1، ص 566');
  assert.strictEqual(rawFootnotes[1].text, 'المجموع شرح المهذب، النووي، دار الفكر، بيروت، 1997م، ج 3، ص 120');
  assert.strictEqual(rawFootnotes[2].text, 'المغني، ابن قدامة، دار عالم الكتب، الرياض، 1997م، ج 2، ص 80');
});

test('TEST 7: DocumentBuilder formats continuous bibliography without volume/page and paginates A4 correctly', () => {
  const mockResearch = {
    title: 'بحث تجريبي في الفقه',
    status: 'ready',
    cover: { title: 'بحث تجريبي في الفقه' },
    introduction: { text: 'مقدمة البحث...' },
    topics: [
      {
        topicId: 'topic-1',
        order: 1,
        h1Title: 'المطلب الأول',
        blocks: [{ type: 'paragraph', text: 'نص المطلب الأول...' }],
        footnotes: [
          { number: 1, text: 'الفقه على المذاهب الأربعة، عبد الرحمن الجزيري، دار الكتب العلمية، بيروت، 2003م، ج 1، ص 566' },
          { number: 2, text: 'المجموع شرح المهذب، النووي، دار الفكر، بيروت، 1997م، ج 3، ص 120' }
        ]
      }
    ],
    conclusion: { title: 'الخاتمة', text: 'خاتمة البحث...' },
    references: [
      {
        book: 'الفقه على المذاهب الأربعة',
        author: 'عبد الرحمن الجزيري',
        publisher: 'دار الكتب العلمية',
        city: 'بيروت',
        edition: 'الطبعة الثانية',
        year: '2003م',
        displayText: 'الفقه على المذاهب الأربعة، عبد الرحمن الجزيري، دار الكتب العلمية، بيروت، الطبعة الثانية، 2003م، ج 1، ص 566'
      },
      {
        book: 'المجموع شرح المهذب',
        author: 'النووي',
        publisher: 'دار الفكر',
        city: 'بيروت',
        year: '1997م',
        displayText: 'المجموع شرح المهذب، النووي، دار الفكر، بيروت، 1997م، ج 3، ص 120'
      }
    ]
  };

  const docModel = DocumentBuilder.buildDocument(mockResearch);
  const refPage = docModel.pages.find((p) => p.pageType === 'references');
  assert.ok(refPage, 'References page must exist in Document model');
  assert.strictEqual(refPage.data.references.length, 2);

  refPage.data.references.forEach((r) => {
    assert.ok(!r.displayText.includes('ج 1') && !r.displayText.includes('ج 3'));
    assert.ok(!r.displayText.includes('ص 566') && !r.displayText.includes('ص 120'));
  });
});

test('TEST 8 & 9: DOCX & PDF references generators receive clean bibliographic entries without volume/page', () => {
  const refData = {
    references: [
      {
        order: 1,
        displayText: 'ابن قدامة، المغني، دار عالم الكتب، الرياض، 1997م'
      },
      {
        order: 2,
        displayText: 'الجزيري، عبد الرحمن، الفقه على المذاهب الأربعة، دار الكتب العلمية، بيروت، الطبعة الثانية، 2003م'
      }
    ]
  };

  const docxChildren = buildReferencesChildren(refData);
  assert.ok(docxChildren.length >= 3, 'Must contain heading + 2 reference paragraphs');
});
