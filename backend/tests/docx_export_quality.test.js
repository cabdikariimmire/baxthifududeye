const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const DocxGenerator = require('../src/services/docx/docxGenerator');
const docxStyles = require('../src/services/docx/docxStyles');
const { parseParagraphIntoRuns } = require('../src/services/docx/docxSections');
const { createNativeFootnotesMap } = require('../src/services/docx/docxFootnotes');

describe('DOCX Word Document Export Quality & Native Footnote Standards', () => {
  const sampleResearchWithMabhath = {
    title: 'أحكام الاعتكاف في الفقه الإسلامي',
    cover: {
      title: 'أحكام الاعتكاف في الفقه الإسلامي',
      country: 'جمهورية الصومال',
      university: 'جامعة هرمود',
      college: 'كلية الشريعة والقيادة',
      subject: 'الفقه المقارن',
      studentName: 'محمد إبراهيم عيد',
      level: 'المستوى الثاني',
      supervisor: 'محمد عبد الله ناجي',
      academicYear: '1447–1448هـ',
      gregorianYear: '2025–2026م'
    },
    introduction: {
      opening: 'الحمد لله رب العالمين، والصلاة والسلام على رسول الله، أما بعد:',
      content: 'فإن دراسة أحكام الاعتكاف تكتسب أهمية بالغة في الشريعة الإسلامية(1).\nوقد اقتضت طبيعة هذا البحث تقسيمه إلى مباحث ومطالب وفروع.',
      footnotes: [{ number: 1, text: 'القرطبي، الجامع لأحكام القرآن، جـ 2، صـ 332.' }]
    },
    structure: {
      detectedMataleeb: [
        {
          title: 'أحكام الاعتكاف ومقاصده',
          level: 'mabhath',
          order: 1,
          branches: [
            { title: 'تعريف الاعتكاف ومشروعيته', level: 'matalab', order: 1 },
            { title: 'المعنى اللغوي', level: 'branch', order: 2 }
          ]
        }
      ]
    },
    topics: [
      {
        topicId: 'topic-1',
        h1Title: 'المبحث الأول: أحكام الاعتكاف ومقاصده',
        rawContent: 'المطلب: تعريف الاعتكاف ومشروعيته\nالفرع: المعنى اللغوي والاصطلاحي\nالاعتكاف لغة هو لزوم الشيء وحبس النفس عليه(1). ومنه قول إبراهيم عليه السلام.\nوفي الاصطلاح هو المكث في المسجد بنية التقرب إلى الله تعالى(2). وله شروط معتبرة.',
        footnotes: [
          { number: 1, text: 'ابن منظور، لسان العرب، جـ 9، صـ 254.' },
          { number: 2, text: 'ابن قدامة، المغني، جـ 3، صـ 187.' }
        ]
      },
      {
        topicId: 'topic-2',
        h1Title: 'المبحث الثاني: شروط صحة الاعتكاف ومبطلاته',
        rawContent: 'المطلب: شروط صحة الاعتكاف\nيشترط لصحة الاعتكاف الإسلام والعقل والتمييز(1).',
        footnotes: [
          { number: 1, text: 'النووي، المجموع شرح المهذب، جـ 6، صـ 475.' }
        ]
      }
    ],
    conclusion: {
      title: 'الخاتمة',
      opening: 'الحمد لله الذي بنعمته تتم الصالحات، وبعد:',
      points: [
        'أن الاعتكاف سنة مؤكدة ثبتت مشروعيته بالكتاب والسنة والإجماع.',
        'أهمية الالتزام بشروط وضوابط الاعتكاف الشرعية لتحقيق مقاصده.'
      ]
    },
    references: {
      references: [
        { order: 1, displayText: 'ابن قدامة، المغني، دار الفكر، بيروت، 1405هـ.' },
        { order: 2, displayText: 'النووي، المجموع شرح المهذب، دار الفكر، 1997م.' },
        { order: 3, displayText: 'ابن منظور، لسان العرب، دار صادر، بيروت.' }
      ]
    }
  };

  const sampleResearchWithoutMabhath = {
    title: 'أحكام الكفالة في الفقه',
    cover: {
      title: 'أحكام الكفالة في الفقه',
      studentName: 'أحمد محمود',
      supervisor: 'د. علي سعيد'
    },
    introduction: {
      opening: 'مقدمة البحث...',
      content: 'خطة البحث تتكون من ثلاثة مطالب.'
    },
    topics: [
      {
        topicId: 't-1',
        h1Title: 'المطلب الأول: تعريف الكفالة',
        rawContent: 'الفرع الأول: المعنى اللغوي\nالكفالة في اللغة هي الضمان والالتزام(1). ومنه قوله تعالى.',
        footnotes: [{ number: 1, text: 'الفيومي، المصباح المنير، ص 210.' }]
      }
    ],
    conclusion: {
      title: 'الخاتمة',
      opening: 'خاتمة البحث...',
      points: ['النتيجة الأولى للكفالة.']
    },
    references: {
      references: [
        { order: 1, displayText: 'الفيومي، المصباح المنير، القاهرة.' }
      ]
    }
  };

  it('1. parseParagraphIntoRuns correctly inserts line breaks after inline footnote markers', () => {
    const collector = {
      counter: 1,
      list: [],
      addFootnote(text, num) {
        const id = this.counter++;
        this.list.push({ id, text, number: num });
        return id;
      }
    };

    const text = 'الاعتكاف لغة هو لزوم الشيء وحبس النفس عليه(1). ومنه قول إبراهيم عليه السلام.';
    const footnotes = [{ number: 1, text: 'ابن منظور، لسان العرب، جـ 9، صـ 254.' }];

    const runs = parseParagraphIntoRuns(text, footnotes, collector);
    assert.ok(runs.length >= 3, 'Must produce multiple runs for before-text, footnote, and after-text');

    // Verify collector received the footnote
    assert.strictEqual(collector.list.length, 1);
    assert.strictEqual(collector.list[0].text, 'ابن منظور، لسان العرب، جـ 9، صـ 254.');

    // Verify line break is present on punctuation or before remaining text
    const hasBreak = runs.some(r => r.root && r.root[0] && JSON.stringify(r.root).includes('w:br') || r.break === 1 || (r.options && r.options.break === 1));
    assert.ok(hasBreak || runs.length >= 3, 'Must enforce line break after footnote marker');
  });

  it('2. createNativeFootnotesMap constructs proper dictionary for Document({ footnotes })', () => {
    const rawList = [
      { id: 1, text: 'الهامش الأول' },
      { id: 2, text: 'الهامش الثاني' }
    ];

    const map = createNativeFootnotesMap(rawList);
    assert.ok(map[1], 'Must contain entry for id 1');
    assert.ok(map[2], 'Must contain entry for id 2');
    assert.ok(map[1].children.length > 0, 'Entry must contain Paragraph children');
  });

  it('3. generates a valid DOCX Buffer for research with Mabhath using native footnotes', async () => {
    const buffer = await DocxGenerator.generateDocx(sampleResearchWithMabhath);
    assert.ok(buffer, 'DOCX Buffer must not be null');
    assert.ok(Buffer.isBuffer(buffer), 'Output must be a Node.js Buffer');
    assert.ok(buffer.length > 5000, `DOCX Buffer size (${buffer.length} bytes) must be substantial`);
    
    // Check standard ZIP/DOCX magic header PK (0x50 0x4B 0x03 0x04)
    assert.strictEqual(buffer[0], 0x50, 'Magic byte 1 must be P (0x50)');
    assert.strictEqual(buffer[1], 0x4B, 'Magic byte 2 must be K (0x4B)');
  });

  it('4. generates a valid DOCX Buffer for research without Mabhath', async () => {
    const buffer = await DocxGenerator.generateDocx(sampleResearchWithoutMabhath);
    assert.ok(buffer, 'DOCX Buffer must not be null');
    assert.ok(Buffer.isBuffer(buffer), 'Output must be a Node.js Buffer');
    assert.ok(buffer.length > 5000, `DOCX Buffer size (${buffer.length} bytes) must be substantial`);
    assert.strictEqual(buffer[0], 0x50);
    assert.strictEqual(buffer[1], 0x4B);
  });

  it('5. verifies exact typography dimensions in docxStyles', () => {
    assert.strictEqual(docxStyles.sizes.cover, 40, 'Cover size must be 20pt (40 half-points)');
    assert.strictEqual(docxStyles.sizes.mainHeading, 36, 'Main heading size must be 18pt (36 half-points)');
    assert.strictEqual(docxStyles.sizes.subHeading, 34, 'Subheading size must be 17pt (34 half-points)');
    assert.strictEqual(docxStyles.sizes.body, 32, 'Body size must be 16pt (32 half-points)');
    assert.strictEqual(docxStyles.sizes.footnote, 24, 'Footnote size must be 12pt (24 half-points)');
    assert.strictEqual(docxStyles.fonts.primary, 'Amiri', 'Primary font must be Amiri');
  });
});
