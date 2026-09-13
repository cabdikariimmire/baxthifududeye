const test = require('node:test');
const assert = require('node:assert');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Research = require('../src/models/Research');
const AIService = require('../src/services/ai/aiService');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const { extractReferencesFromResearch } = require('../src/services/references/extractor');
const TOCBuilder = require('../src/services/toc/tocBuilder');

test('Complete End-to-End Lifecycle: User & Admin Workflow', async (t) => {
  await connectDB();
  try {
    // 1. User Registration & Role Assignment
    const user = await User.create({
      name: 'الباحث عباس عبد الناصر',
      email: `researcher_${Date.now()}@example.com`,
      passwordHash: await User.hashPassword('Password123!'),
      role: 'user'
    });
    assert.ok(user._id);
    assert.strictEqual(user.role, 'user');

    // 2. Step 1: Create Research & Save Cover
    const research = await Research.create({
      userId: user._id,
      title: 'الإعتكاف',
      borderId: 'border-academic-red',
      currentStep: 1,
      cover: {
        country: 'جمهورية الصومال',
        university: 'جامعة هرمود',
        college: 'كلية الشريعة والقيادة',
        subject: 'الفقه',
        title: 'الإعتكاف',
        studentName: 'عباس عبد الناصر',
        level: 'المستوى الثاني',
        supervisor: 'الدكتور محمد عبد الله الشرعبي',
        academicYear: '1447_ 1448هـ',
        gregorianYear: '2025 _ 2026م',
        badgeColor: '#38761d'
      }
    });
    assert.strictEqual(research.cover.university, 'جامعة هرمود');

    // 3. Step 2 & 3: Introduction & Structure Detection
    const sampleIntro = `الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد وعلى آله وصحبه أجمعين، أما بعد:
فإن الاعتكاف من العبادات الجليلة التي شرعها الله تعالى لعباده...
ويتكون بحثي هذا ثلاثة مطالب وخاتمة كالتالي:
المطلب الأول: تعريف الاعتكاف ومشروعيته
المطلب الثاني: أحكام الاعتكاف وشروطه
المطلب الثالث: مقاصد الاعتكاف وآثاره التربوية والإيمانية`;

    const aiIntroAnalysis = await AIService.analyzeIntroduction({
      userId: user._id,
      researchId: research._id,
      text: sampleIntro
    });

    assert.ok(aiIntroAnalysis.mataleeb.length >= 3);
    research.introduction = { opening: 'الحمد لله رب العالمين...', text: sampleIntro };
    research.structure = { confirmed: true, detectedMataleeb: aiIntroAnalysis.mataleeb };
    research.currentStep = 4;
    await research.save();

    // 4. Step 4 & 5: Populate Topics and Footnotes
    research.topics = [
      {
        topicId: 'topic-1',
        order: 1,
        h1Title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته',
        blocks: [
          { type: 'h1', text: 'المطلب الأول: تعريف الاعتكاف ومشروعيته' },
          { type: 'h2', text: 'الفرع الأول: المعنى اللغوي' },
          { type: 'paragraph', text: 'افتعال من العكوف...' },
          { type: 'h2', text: 'الفرع الثاني: المعنى الإصطلاحي' },
          { type: 'paragraph', text: 'فهو لزوم المسلم المسجد...' }
        ],
        footnotes: [
          { number: 1, text: 'المصباح المنير في غريب الشرح الكبير، أحمد بن محمد بن علي الفيومي، المكتبة العلمية – بيروت، ج1، ص424' },
          { number: 2, text: 'الفقه على المذاهب الأربعة، عبد الرحمن الجزيري، دار الكتب العلمية، بيروت، الطبعة الثانية، 2003م، ج1، ص-566 569' }
        ]
      },
      {
        topicId: 'topic-2',
        order: 2,
        h1Title: 'المطلب الثاني: أحكام الاعتكاف وشروطه',
        blocks: [
          { type: 'h1', text: 'المطلب الثاني: أحكام الاعتكاف وشروطه' },
          { type: 'paragraph', text: 'الاعتكاف سنة مؤكدة عند جمهور الفقهاء...' }
        ],
        footnotes: [
          { number: 3, text: 'توضيح الأحكام من بلوغ المرام، عبد الله بن عبد الرحمن البسام، مكتبة الأسدي، مكة المكرمة، الطبعة الخامسة، 1423هـ، ج3، ص-551 560' }
        ]
      },
      {
        topicId: 'topic-3',
        order: 3,
        h1Title: 'المطلب الثالث: مقاصد الاعتكاف وآثاره التربوية والإيمانية',
        blocks: [
          { type: 'h1', text: 'المطلب الثالث: مقاصد الاعتكاف وآثاره التربوية والإيمانية' },
          { type: 'paragraph', text: 'يحقق الاعتكاف مقاصد عظيمة في حياة المسلم...' }
        ],
        footnotes: [
          { number: 4, text: 'إحياء علوم الدين، أبو حامد الغزالي، دار المعرفة، بيروت، ج1، ص-238 241' }
        ]
      }
    ];
    research.currentStep = 6;
    await research.save();

    // 5. Step 6: Save Conclusion
    research.conclusion = {
      title: 'الخاتمة',
      points: [
        'أن الاعتكاف هو: لزوم المسلم المسجد لطاعة الله تعالى مدةً مخصوصة مع نية التعبد والتقرب إليه سبحانه.',
        'الاعتكاف سنة مؤكدة عند جمهور الفقهاء، ويتأكد استحبابه في العشر الأواخر من رمضان.',
        'يحقق الاعتكاف مقاصد عظيمة في حياة المسلم لتجديد الإيمان وتربية النفس.'
      ]
    };
    research.currentStep = 7;
    await research.save();

    // 6. Step 7: Auto Extract References & Verify Volume/Page Stripping
    const extractedRefs = await extractReferencesFromResearch(research, user._id);
    assert.ok(extractedRefs.length >= 4);
    // Verify that volume/page numbers are stripped
    extractedRefs.forEach(ref => {
      assert.ok(!ref.book.includes('ج1'), `Book should not contain volume marker: ${ref.book}`);
      assert.ok(!ref.book.includes('ص 424'), `Book should not contain page marker: ${ref.book}`);
    });
    research.references = extractedRefs;
    research.currentStep = 8;
    await research.save();

    // 7. Step 8 & 9: Build Deterministic Document Model & Verify 8 Pages
    const docModel = DocumentBuilder.buildDocument(research);
    assert.strictEqual(docModel.totalPages, 8);
    assert.strictEqual(docModel.pages.length, 8);
    assert.strictEqual(docModel.pages[0].pageType, 'cover');
    assert.strictEqual(docModel.pages[7].pageType, 'toc');

    // Verify TOC entries have precise page numbers
    const toc = docModel.toc;
    const introEntry = toc.find(t => t.title.includes('المقدمة'));
    const topic1Entry = toc.find(t => t.title.includes('المطلب الأول'));
    const topic2Entry = toc.find(t => t.title.includes('المطلب الثاني'));
    const topic3Entry = toc.find(t => t.title.includes('المطلب الثالث'));
    const conclusionEntry = toc.find(t => t.title.includes('الخاتمة'));
    const referencesEntry = toc.find(t => t.title.includes('المصادر'));
    const tocEntry = toc.find(t => t.title.includes('فهرس الموضوعات'));

    assert.strictEqual(introEntry.pageNumber, 2);
    assert.strictEqual(topic1Entry.pageNumber, 3);
    assert.strictEqual(topic2Entry.pageNumber, 4);
    assert.strictEqual(topic3Entry.pageNumber, 5);
    assert.strictEqual(conclusionEntry.pageNumber, 6);
    assert.strictEqual(referencesEntry.pageNumber, 7);
    assert.strictEqual(tocEntry.pageNumber, 8);
  } catch (err) {
    console.error('[E2E Test Error]:', err);
    throw err;
  } finally {
    await disconnectDB();
  }
});
