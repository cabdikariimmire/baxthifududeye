const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const OpenRouterAdapter = require('../src/services/ai/OpenRouterAdapter');
const { buildGenerateIntroductionPrompt } = require('../src/services/ai/prompts');

describe('AI Generation Logic for المقدمة وخطة البحث', () => {

  const adapter = new OpenRouterAdapter();

  test('TEST 1: Dynamic Generation with المبحث → المطلب → الفرع', async () => {
    const researchContext = {
      title: 'أحكام المعاملات المالية المعاصرة في الفقه الإسلامي',
      mataleeb: [
        {
          title: 'المبحث الأول: العملات الرقمية والمشفرة',
          level: 'mabhath',
          order: 1,
          branches: [
            { title: 'المطلب الأول: التكييف الفقهي للنقود الرقمية', level: 'matalab', order: 1 },
            { title: 'المطلب الثاني: حكم تداول العملات المشفرة', level: 'matalab', order: 2 }
          ]
        },
        {
          title: 'المبحث الثاني: العقود الذكية والتمويل اللامركزي',
          level: 'mabhath',
          order: 2,
          branches: [
            { title: 'المطلب الأول: مفهوم العقود الذكية', level: 'matalab', order: 1 },
            { title: 'الفرع الأول: طبيعة الإيجاب والقبول الإلكتروني', level: 'branch', order: 1 }
          ]
        }
      ]
    };

    const result = await adapter.generateIntroduction(researchContext);

    assert.ok(result.fullText, 'Must generate full text');
    // 1. Topic match
    assert.ok(result.fullText.includes('أحكام المعاملات المالية المعاصرة'), 'Introduction must be tailored to research title');
    // 2. Plan contains all stored مباحث, مطالب, and فروع
    assert.ok(result.fullText.includes('المبحث الأول: العملات الرقمية والمشفرة'), 'Plan must contain المبحث الأول');
    assert.ok(result.fullText.includes('المبحث الثاني: العقود الذكية والتمويل اللامركزي'), 'Plan must contain المبحث الثاني');
    assert.ok(result.fullText.includes('المطلب الأول: التكييف الفقهي للنقود الرقمية'), 'Plan must contain المطلب الأول');
    assert.ok(result.fullText.includes('الفرع الأول: طبيعة الإيجاب والقبول الإلكتروني'), 'Plan must contain الفرع الأول');
    // 3. No duplicated plan
    const occurrences = (result.fullText.match(/المبحث الأول: العملات الرقمية/g) || []).length;
    assert.equal(occurrences, 1, 'Plan elements must not be duplicated');
    // 4. Single plan transition sentence
    const planTransitionMatches = (result.fullText.match(/وقد انتظمت خطة هذا البحث/g) || []).length;
    assert.equal(planTransitionMatches, 1, 'Transition sentence must appear exactly once');
  });

  test('TEST 2: Dynamic Generation with المبحث → المطلب (No فروع)', async () => {
    const researchContext = {
      title: 'مقاصد الشريعة الإسلامية في المعاملات المالية',
      mataleeb: [
        {
          title: 'المبحث الأول: تأصيل المقاصد المالية',
          level: 'mabhath',
          order: 1,
          branches: [
            { title: 'المطلب الأول: حفظ المال ورواجه', level: 'matalab', order: 1 },
            { title: 'المطلب الثاني: العدالة والوضوح في العقود', level: 'matalab', order: 2 }
          ]
        },
        {
          title: 'المبحث الثاني: تطبيقات مقاصدية معاصرة',
          level: 'mabhath',
          order: 2,
          branches: [
            { title: 'المطلب الأول: منع الاحتكار والغرر', level: 'matalab', order: 1 }
          ]
        }
      ]
    };

    const result = await adapter.generateIntroduction(researchContext);

    assert.ok(result.fullText, 'Must generate full text');
    assert.ok(result.fullText.includes('مقاصد الشريعة الإسلامية في المعاملات المالية'), 'Introduction must discuss specific title');
    assert.ok(result.fullText.includes('المبحث الأول: تأصيل المقاصد المالية'), 'Must preserve المبحث الأول');
    assert.ok(result.fullText.includes('المطلب الأول: حفظ المال ورواجه'), 'Must preserve المطلب الأول');
    assert.ok(result.fullText.includes('المبحث الثاني: تطبيقات مقاصدية معاصرة'), 'Must preserve المبحث الثاني');
    // No invented فروع
    assert.equal(result.fullText.includes('الفرع الأول'), false, 'Must NOT invent فروع when none exist in structure');
  });

  test('TEST 3: Dynamic Generation with المطلب → الفرع (No مباحث)', async () => {
    const researchContext = {
      title: 'أحكام صلاة المسافر في الفقه الإسلامي',
      mataleeb: [
        {
          title: 'المطلب الأول: مفهوم السفر وشروط القصر',
          level: 'matalab',
          order: 1,
          branches: [
            { title: 'الفرع الأول: ضابط مسافة السفر المعتبرة', level: 'branch', order: 1 },
            { title: 'الفرع الثاني: شروط نية الإقامة والترخص', level: 'branch', order: 2 }
          ]
        },
        {
          title: 'المطلب الثاني: أحكام الجمع والقضاء للمسافر',
          level: 'matalab',
          order: 2,
          branches: [
            { title: 'الفرع الأول: الجمع تقديماً وتأخيراً', level: 'branch', order: 1 },
            { title: 'الفرع الثاني: قضاء الصلاة الفائتة في السفر', level: 'branch', order: 2 }
          ]
        }
      ]
    };

    const result = await adapter.generateIntroduction(researchContext);

    assert.ok(result.fullText, 'Must generate full text');
    assert.ok(result.fullText.includes('أحكام صلاة المسافر في الفقه الإسلامي'), 'Must discuss topic title');
    // Contains مطالب and فروع exactly
    assert.ok(result.fullText.includes('المطلب الأول: مفهوم السفر وشروط القصر'));
    assert.ok(result.fullText.includes('الفرع الأول: ضابط مسافة السفر المعتبرة'));
    assert.ok(result.fullText.includes('المطلب الثاني: أحكام الجمع والقضاء للمسافر'));
    // No invented مبحث
    assert.equal(result.fullText.includes('المبحث الأول'), false, 'Must NOT invent مبحث when research only has مطالب');
  });

  test('TEST 4: Prompt Construction includes all structural levels and title', () => {
    const prompt = buildGenerateIntroductionPrompt({
      title: 'أحكام الوقف الذري',
      mataleeb: [
        {
          title: 'المطلب الأول: مفهوم الوقف الذري',
          branches: [{ title: 'الفرع الأول: التعريف اللغوي' }]
        }
      ],
      highestLevel: 'matalab'
    });

    assert.ok(prompt.includes('أحكام الوقف الذري'), 'Prompt must include research title');
    assert.ok(prompt.includes('المطلب الأول: مفهوم الوقف الذري'), 'Prompt must include matlab title');
    assert.ok(prompt.includes('الفرع الأول: التعريف اللغوي'), 'Prompt must include branch title');
  });

});
