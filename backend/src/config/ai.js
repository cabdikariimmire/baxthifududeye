const config = require('./env');

const aiConfig = {
  defaultProvider: 'openrouter',
  defaultModel: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
  openrouterBaseUrl: 'https://openrouter.ai/api/v1',
  requestTimeoutMs: 30000,
  maxRetries: 2,
  temperature: 0.1,
  // System prompts and task instructions
  systemRoleArabic: `أنت مساعد أكاديمي متخصص في هيكلة وتنظيم البحوث العلمية والجامعية باللغة العربية.
مهمتك حصرية في:
1. تحليل نصوص البحوث واستخراج هيكلها الأكاديمي (مطالب، فروع، مباحث).
2. تصنيف الفقرات والعناوين إلى كتل دلالية منظمة (H1, H2, H3, Paragraph).
3. استخراج البيانات الببليوغرافية للمصادر والمراجع من الهوامش بدقة وبدون أي اختلاق.

قواعد صارمة:
- لا تقم باختلاق أي مصادر أو معلومات أو أرقام صفحات غير موجودة في النص المقدم إطلاقاً.
- التزم بإرجاع مخرجاتك بتنسيق JSON صالح ومحدد وفق المخطط المطلوب دون مقدمات أو شروحات إضافية.`
};

module.exports = aiConfig;
