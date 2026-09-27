/**
 * Academic terms specific to Islamic and Fiqh research.
 * These words are treated as highly valid and won't be easily auto-corrected,
 * but can be used to suggest corrections for misspelled variants.
 */
export const ACADEMIC_TERMS = [
  'المبحث', 'المطلب', 'الفرع', 'المقدمة', 'الخاتمة', 'المصادر', 'المراجع',
  'تعريف', 'مشروعية', 'شروط', 'أحكام', 'مقاصد', 'آثار', 'أدلة', 'الفقه',
  'الاعتكاف', 'الصلاة', 'الزكاة', 'الصيام', 'الحج', 'النكاح', 'الطلاق',
  'البيوع', 'الربا', 'الجنايات', 'الحدود', 'السيرة', 'العقيدة', 'التفسير',
  'الحديث', 'الأصول', 'القرآن', 'السنة', 'الإجماع', 'القياس', 'منهج',
  'دراسة', 'تمهيد', 'فصل', 'باب', 'كتاب', 'تحليل', 'مقارنة', 'موضوع',
  'أهمية', 'أهداف', 'مشكلة', 'تساؤلات', 'فرضيات', 'حدود', 'السابق', 'ملاحق'
];

export const ACADEMIC_TERMS_SET = new Set(ACADEMIC_TERMS);

export const isAcademicTerm = (word) => {
  return ACADEMIC_TERMS_SET.has(word);
};
