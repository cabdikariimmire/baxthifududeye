/**
 * Shared Frontend validation function to verify all research topics are complete.
 * @param {Object} research - Research object with topics array
 * @returns {{ valid: boolean, errors: string[], completedCount: number, totalCount: number }}
 */
export function isResearchContentComplete(research) {
  const errors = [];
  if (!research) {
    errors.push('مشروع البحث غير موجود');
    return { valid: false, errors, completedCount: 0, totalCount: 0 };
  }

  const topics = research.topics || [];
  if (topics.length === 0) {
    errors.push('يجب إضافة مطلب واحد على الأقل في البحث');
    return { valid: false, errors, completedCount: 0, totalCount: 0 };
  }

  let completedCount = 0;

  topics.forEach((topic, idx) => {
    const topicTitle = topic.h1Title || `المطلب ${idx + 1}`;
    let isTopicValid = true;

    // Check title
    if (!topic.h1Title || topic.h1Title.trim().length === 0) {
      errors.push(`عنوان المطلب ${idx + 1} غير محدد`);
      isTopicValid = false;
    }

    // Check substantive content
    const rawContent = (topic.rawContent || '').trim();
    const blocks = topic.blocks || [];
    const hasSubstantiveBlocks = blocks.some(b => b.type === 'paragraph' && b.text && b.text.trim().length >= 15);
    const hasSubstantiveRaw = rawContent.length >= 15 && !rawContent.startsWith('محتوى المطلب...');

    if (!hasSubstantiveBlocks && !hasSubstantiveRaw) {
      errors.push(`المطلب (${topicTitle}) غير مكتمل: لا يحتوي على محتوى علمي كافٍ`);
      isTopicValid = false;
    }

    // Check branches if present
    if (topic.branches && Array.isArray(topic.branches) && topic.branches.length > 0) {
      topic.branches.forEach((b, bIdx) => {
        if (!b.title || b.title.trim().length === 0) {
          errors.push(`الفرع ${bIdx + 1} في (${topicTitle}) غير محدد العنوان`);
          isTopicValid = false;
        }
      });
    }

    if (isTopicValid) {
      completedCount++;
    }
  });

  return {
    valid: errors.length === 0 && completedCount === topics.length,
    errors,
    completedCount,
    totalCount: topics.length
  };
}
