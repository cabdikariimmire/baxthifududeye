const { test, describe } = require('node:test');
const assert = require('node:assert');
const { stripVolumeAndPage, normalizeReference, formatReferenceForDisplay } = require('../src/services/references/normalizer');
const { deduplicateReferences } = require('../src/services/references/deduplicator');
const { extractReferencesFromResearch } = require('../src/services/references/extractor');
const DocumentBuilder = require('../src/services/document/documentBuilder');

describe('Strict Sources & References (المصادر والمراجع) Generation Logic', () => {

  describe('1. Juz/volume and Page Removal', () => {
    test('removes volume indicators in various forms (ج، جزء، مجلد، مج، جـ، ordinals)', () => {
      const inputs = [
        'أحمد بن حنبل، المسند، مؤسسة الرسالة، بيروت، ج 4، ص 215',
        'ابن قدامة، المغني، دار الكتاب العربي، بيروت، ج١، ص٤٢٤',
        'ابن تيمية، مجموع الفتاوى، مجمع الملك فهد، مجلد 3، صفحة 25-30',
        'الغزالي، إحياء علوم الدين، دار المعرفة، الجزء الأول، ص 100 وما بعدها',
        'الزركشي، البرهان في علوم القرآن، دار المعرفة، جـ 2، صـ 15',
        'الشافعي، الأم، دار المعرفة، بيروت، مج 1، ص. 200',
        'مالك بن أنس، الموطأ، دار إحياء التراث العربي، ج 2'
      ];

      const expected = [
        'أحمد بن حنبل، المسند، مؤسسة الرسالة، بيروت',
        'ابن قدامة، المغني، دار الكتاب العربي، بيروت',
        'ابن تيمية، مجموع الفتاوى، مجمع الملك فهد',
        'الغزالي، إحياء علوم الدين، دار المعرفة',
        'الزركشي، البرهان في علوم القرآن، دار المعرفة',
        'الشافعي، الأم، دار المعرفة، بيروت',
        'مالك بن أنس، الموطأ، دار إحياء التراث العربي'
      ];

      inputs.forEach((inp, i) => {
        const actual = stripVolumeAndPage(inp);
        assert.strictEqual(actual, expected[i], `Failed on input #${i}: ${inp}`);
      });
    });

    test('removes page indicators and page ranges (ص، صـ، صفحة، ص ص، ص.ص، وما بعدها)', () => {
      const inputs = [
        'ابن حجر، فتح الباري، دار المعرفة، ص 100',
        'النووي، روضة الطالبين، المكتب الإسلامي، صـ 45',
        'السيوطي، الإتقان في علوم القرآن، صفحة 50-55',
        'البيهقي، السنن الكبرى، ص ص 12-15',
        'الرازي، التفسير الكبير، ص. 234',
        'القرطبي، الجامع لأحكام القرآن، ص 80 وما بعدها'
      ];

      const expected = [
        'ابن حجر، فتح الباري، دار المعرفة',
        'النووي، روضة الطالبين، المكتب الإسلامي',
        'السيوطي، الإتقان في علوم القرآن',
        'البيهقي، السنن الكبرى',
        'الرازي، التفسير الكبير',
        'القرطبي، الجامع لأحكام القرآن'
      ];

      inputs.forEach((inp, i) => {
        const actual = stripVolumeAndPage(inp);
        assert.strictEqual(actual, expected[i], `Failed on input #${i}: ${inp}`);
      });
    });

    test('removes combined slash notations: (1/424), (ج 2 / ص 150)', () => {
      assert.strictEqual(
        stripVolumeAndPage('البخاري، صحيح البخاري، دار ابن كثير، (1/424)'),
        'البخاري، صحيح البخاري، دار ابن كثير'
      );
      assert.strictEqual(
        stripVolumeAndPage('محمد بن علي الشوكاني، فتح القدير، (ج 2 / ص 150)'),
        'محمد بن علي الشوكاني، فتح القدير'
      );
      assert.strictEqual(
        stripVolumeAndPage('مسلم بن الحجاج، صحيح مسلم، (ج1، ص424)'),
        'مسلم بن الحجاج، صحيح مسلم'
      );
    });
  });

  describe('2. Preservation of User Repetition & Verbatim Text (Requirement 4 & 5)', () => {
    test('strictly preserves repeated words written by the user (e.g. الكبير الكبير)', () => {
      const footnote = 'أحمد بن محمد ... المصباح المنير في غريب الشرح الكبير الكبير ... ج1، ص424';
      const expected = 'أحمد بن محمد ... المصباح المنير في غريب الشرح الكبير الكبير';

      const actual = stripVolumeAndPage(footnote);
      assert.strictEqual(actual, expected);
      assert.ok(actual.includes('الكبير الكبير'), 'Repeated phrase "الكبير الكبير" must be preserved verbatim');
    });

    test('does not strip or alter legitimate words starting with ج or ص (e.g. صادر, جمال, مجمع)', () => {
      const footnote = 'ابن منظور، لسان العرب، دار صادر، بيروت، مادة عكف';
      const actual = stripVolumeAndPage(footnote);
      assert.strictEqual(actual, footnote);
      assert.ok(actual.includes('دار صادر'), 'Word starting with ص must not be stripped');
    });
  });

  describe('3. No Hallucinated Metadata & No Inferred Enrichment (Requirement 3 & 8)', () => {
    test('normalizeReference produces clean reference without adding external publisher or authors', () => {
      const rawText = 'أحمد بن محمد، المصباح المنير في غريب الشرح الكبير الكبير، ج1، ص424';
      const ref = normalizeReference(rawText);

      assert.strictEqual(ref.displayText, 'أحمد بن محمد، المصباح المنير في غريب الشرح الكبير الكبير');
      assert.strictEqual(ref.book, 'أحمد بن محمد، المصباح المنير في غريب الشرح الكبير الكبير');
      assert.strictEqual(ref.publisher, '', 'No publisher should be hallucinated or guessed');
      assert.strictEqual(ref.city, '', 'No city should be hallucinated or guessed');
      assert.strictEqual(ref.edition, '', 'No edition should be hallucinated or guessed');
    });
  });

  describe('4. Multiple Footnotes Using the Same Source (Requirement 6 & 7)', () => {
    test('deduplicates multiple citations of the same source into a single entry without merging fields', () => {
      const ref1 = normalizeReference('النووي، المجموع شرح المهذب، دار الفكر، ج1، ص 10');
      const ref2 = normalizeReference('النووي، المجموع شرح المهذب، دار الفكر، ج6، ص 475');

      const deduplicated = deduplicateReferences([ref1, ref2]);

      assert.strictEqual(deduplicated.length, 1, 'Two citations of same source should result in exactly one entry');
      assert.strictEqual(deduplicated[0].displayText, 'النووي، المجموع شرح المهذب، دار الفكر');
      assert.strictEqual(deduplicated[0].order, 1);
    });

    test('retains distinct entries for different sources', () => {
      const ref1 = normalizeReference('النووي، المجموع شرح المهذب، دار الفكر، ج1، ص 10');
      const ref2 = normalizeReference('أحمد بن محمد ... المصباح المنير في غريب الشرح الكبير الكبير ... ج1، ص424');
      const ref3 = normalizeReference('ابن قدامة، المغني، دار الكتاب العربي، بيروت، ج١، ص٤٢٤');

      const deduplicated = deduplicateReferences([ref1, ref2, ref3]);

      assert.strictEqual(deduplicated.length, 3, 'Three distinct sources should yield 3 entries');
      assert.strictEqual(deduplicated[1].displayText, 'أحمد بن محمد ... المصباح المنير في غريب الشرح الكبير الكبير');
    });
  });

  describe('5. End-to-End Extraction from Research Model (Requirement 1, 9, 10)', () => {
    test('extractReferencesFromResearch builds references purely from topic footnotes, leaving footnotes untouched', async () => {
      const mockResearch = {
        _id: 'test-research-id',
        topics: [
          {
            topicId: 'topic-1',
            h1Title: 'المطلب الأول',
            footnotes: [
              {
                footnoteId: 'fn-1',
                number: 1,
                marker: '(1)',
                text: 'أحمد بن محمد ... المصباح المنير في غريب الشرح الكبير الكبير ... ج1، ص424'
              },
              {
                footnoteId: 'fn-2',
                number: 2,
                marker: '(2)',
                text: 'النووي، المجموع شرح المهذب، دار الفكر، ج1، ص 10'
              }
            ]
          },
          {
            topicId: 'topic-2',
            h1Title: 'المطلب الثاني',
            footnotes: [
              {
                footnoteId: 'fn-3',
                number: 1,
                marker: '(1)',
                text: 'النووي، المجموع شرح المهذب، دار الفكر، ج6، ص 475'
              },
              {
                footnoteId: 'fn-4',
                number: 2,
                marker: '(2)',
                text: 'ابن منظور، لسان العرب، دار صادر، بيروت، مادة عكف'
              }
            ]
          }
        ]
      };

      const references = await extractReferencesFromResearch(mockResearch, 'test-user-id');

      // Requirement 6 & 7: 4 footnotes total, but 2 cite Al-Nawawi -> should yield 3 unique entries
      assert.strictEqual(references.length, 3, 'Expected 3 deduplicated references');

      // Requirement 5: Repeated "الكبير الكبير" must be preserved
      const mesbahRef = references.find(r => r.displayText.includes('المصباح المنير'));
      assert.ok(mesbahRef, 'Mesbah reference must exist');
      assert.strictEqual(
        mesbahRef.displayText,
        'أحمد بن محمد ... المصباح المنير في غريب الشرح الكبير الكبير'
      );

      // Requirement 9: Verify original footnotes remain intact and unchanged
      assert.strictEqual(
        mockResearch.topics[0].footnotes[0].text,
        'أحمد بن محمد ... المصباح المنير في غريب الشرح الكبير الكبير ... ج1، ص424'
      );
      assert.strictEqual(
        mockResearch.topics[0].footnotes[1].text,
        'النووي، المجموع شرح المهذب، دار الفكر، ج1، ص 10'
      );
      assert.strictEqual(
        mockResearch.topics[1].footnotes[0].text,
        'النووي، المجموع شرح المهذب، دار الفكر، ج6، ص 475'
      );
    });

    test('DocumentBuilder generates identical clean reference list for preview & PDF/DOCX', () => {
      const mockResearch = {
        _id: 'res-123',
        title: 'بحث تجريبي',
        currentStep: 7,
        cover: {},
        introduction: { paragraphs: ['مقدمة البحث'] },
        topics: [
          {
            topicId: 't-1',
            order: 1,
            h1Title: 'المطلب الأول',
            rawContent: 'محتوى تجريبي (1)',
            blocks: [{ type: 'paragraph', text: 'محتوى تجريبي (1)' }],
            footnotes: [
              {
                footnoteId: 'fn-1',
                number: 1,
                marker: '(1)',
                text: 'أحمد بن محمد ... المصباح المنير في غريب الشرح الكبير الكبير ... ج1، ص424'
              }
            ]
          }
        ],
        conclusion: { points: ['نقطة خاتمة'] },
        references: []
      };

      const docModel = DocumentBuilder.buildDocument(mockResearch);
      const refPage = docModel.pages.find(p => p.pageType === 'references');

      assert.ok(refPage, 'Document must contain a references page');
      assert.strictEqual(refPage.data.references.length, 1);
      assert.strictEqual(
        refPage.data.references[0].displayText,
        'أحمد بن محمد ... المصباح المنير في غريب الشرح الكبير الكبير'
      );
      assert.strictEqual(
        refPage.data.references[0].book,
        'أحمد بن محمد ... المصباح المنير في غريب الشرح الكبير الكبير'
      );
    });
  });

});
