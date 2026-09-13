const test = require('node:test');
const assert = require('node:assert');
const OpenRouterAdapter = require('../src/services/ai/OpenRouterAdapter');
const {
  introductionAnalysisSchema,
  topicStructureSchema,
  bibliographySchema
} = require('../src/services/ai/schemas');

test('AI Adapter Schema correctly validates structured introduction output', () => {
  const validOutput = {
    title: 'أحكام الاعتكاف ومقاصده في الفقه الإسلامي',
    summary: 'بحث يعالج تعريف الاعتكاف وأحكامه ومقاصده التربوية',
    mataleeb: [
      {
        title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته',
        order: 1,
        branches: [
          { title: 'الفرع الأول: المعنى اللغوي', order: 1 },
          { title: 'الفرع الثاني: المعنى الاصطلاحي', order: 2 }
        ]
      },
      {
        title: 'المطلب الثاني: أحكام الاعتكاف وشروطه',
        order: 2,
        branches: []
      }
    ]
  };

  const parsed = introductionAnalysisSchema.parse(validOutput);
  assert.strictEqual(parsed.mataleeb.length, 2);
  assert.strictEqual(parsed.mataleeb[0].branches.length, 2);
});

test('AI Adapter Heuristic Introduction Analysis detects mataleeb from arabic text', async () => {
  const adapter = new OpenRouterAdapter();
  const sampleIntro = `الحمد لله رب العالمين...
ويتكون بحثي هذا ثلاثة مطالب وخاتمة كالتالي:
المطلب الأول: تعريف الاعتكاف ومشروعيته
الفرع الأول: المعنى اللغوي
الفرع الثاني: المعنى الاصطلاحي
المطلب الثاني: أحكام الاعتكاف وشروطه
المطلب الثالث: مقاصد الاعتكاف وآثاره التربوية والإيمانية`;

  const result = await adapter.analyzeIntroduction(sampleIntro);
  assert.ok(result.mataleeb.length >= 3);
  assert.ok(result.mataleeb[0].title.includes('المطلب الأول'));
  assert.ok(result.mataleeb[1].title.includes('المطلب الثاني'));
  assert.ok(result.mataleeb[2].title.includes('المطلب الثالث'));
});
