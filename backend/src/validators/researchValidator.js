const { z } = require('zod');

const createResearchSchema = z.object({
  body: z.object({
    title: z.string().optional().default(''),
    borderId: z.string().optional(),
    templateId: z.string().optional(),
    cover: z.object({
      country: z.string().optional(),
      university: z.string().optional(),
      college: z.string().optional(),
      subject: z.string().optional(),
      title: z.string().optional(),
      studentName: z.string().optional(),
      level: z.string().optional(),
      supervisor: z.string().optional(),
      semester: z.string().optional(),
      academicYear: z.string().optional(),
      gregorianYear: z.string().optional(),
      logoUrl: z.string().optional(),
      badgeColor: z.string().optional(),
      coverLayout: z.any().optional()
    }).passthrough().optional()
  })
});

const analyzeIntroSchema = z.object({
  body: z.object({
    text: z.string().min(10, 'نص المقدمة يجب أن يحتوي على 10 أحرف على الأقل')
  })
});


/**
 * Shared validation function to verify all research topics and sub-branches are complete.
 * @param {Object} research - Research object with topics array
 * @returns {{ valid: boolean, errors: string[] }}
 */
function isResearchContentComplete(research) {
  const errors = [];
  if (!research) {
    errors.push('مشروع البحث غير موجود');
    return { valid: false, errors };
  }

  const topics = research.topics || [];
  if (topics.length === 0) {
    errors.push('يجب إضافة مطلب واحد على الأقل في البحث');
    return { valid: false, errors };
  }

  topics.forEach((topic, idx) => {
    const topicTitle = topic.h1Title || `المطلب ${idx + 1}`;
    
    // Check title
    if (!topic.h1Title || topic.h1Title.trim().length === 0) {
      errors.push(`عنوان المطلب ${idx + 1} غير محدد`);
    }

    // Check substantive body content (not empty, not just whitespace, not just placeholder)
    const rawContent = (topic.rawContent || '').trim();
    const blocks = topic.blocks || [];
    const hasSubstantiveBlocks = blocks.some(b => b.type === 'paragraph' && b.text && b.text.trim().length >= 15);
    const hasSubstantiveRaw = rawContent.length >= 15 && !rawContent.startsWith('محتوى المطلب...');

    if (!hasSubstantiveBlocks && !hasSubstantiveRaw) {
      errors.push(`المطلب (${topicTitle}) غير مكتمل: لا يحتوي على محتوى علمي كافٍ`);
    }

    // If branches exist, check that branches are not empty
    if (topic.branches && Array.isArray(topic.branches) && topic.branches.length > 0) {
      topic.branches.forEach((b, bIdx) => {
        if (!b.title || b.title.trim().length === 0) {
          errors.push(`الفرع ${bIdx + 1} في (${topicTitle}) غير محدد العنوان`);
        }
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  createResearchSchema,
  analyzeIntroSchema,
  isResearchContentComplete
};
