import { ACADEMIC_TERMS } from './academicTerms';

/**
 * A simple deterministic local Arabic dictionary.
 * Includes academic terms and common Arabic words.
 */
const COMMON_ARABIC_WORDS = [
  'في', 'من', 'على', 'إلى', 'عن', 'بين', 'أو', 'مع', 'هذا', 'هذه', 'ذلك', 'التي', 'الذي',
  'أن', 'إن', 'لا', 'ما', 'هو', 'هي', 'هم', 'نحن', 'أنا', 'أنت', 'كان', 'يكون', 'تم', 'يتم',
  'وقد', 'ولكن', 'كما', 'بما', 'فإن', 'إذا', 'إذ', 'حيث', 'كل', 'بعض', 'غير', 'لأن', 'حتى',
  'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر',
  'الله', 'محمد', 'رسول', 'صلى', 'عليه', 'وسلم', 'رحمه', 'تعالى', 'عز', 'وجل',
  'جامعة', 'كلية', 'قسم', 'طالب', 'باحث', 'بحث', 'رسالة', 'ماجستير', 'دكتوراه',
  'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة',
  'تعريف', 'مفهوم', 'معنى', 'لغة', 'اصطلاحا', 'دليل', 'أدلة', 'حكم', 'أحكام', 'شروط', 'أركان',
  'سبب', 'أسباب', 'نتيجة', 'نتائج', 'أثر', 'آثار', 'مطلب', 'مباحث', 'فروع', 'فصل', 'أبواب',
  'مقدمة', 'خاتمة', 'فهرس', 'مصادر', 'مراجع', 'مشروعية', 'الاعتكاف', 'الصلاة', 'الزكاة'
];

// Combine and deduplicate
export const ARABIC_DICTIONARY = Array.from(new Set([...COMMON_ARABIC_WORDS, ...ACADEMIC_TERMS]));

// A Set for O(1) lookups
export const ARABIC_DICTIONARY_SET = new Set(ARABIC_DICTIONARY);

export const isInDictionary = (word) => {
  return ARABIC_DICTIONARY_SET.has(word);
};

export const getAllDictionaryWords = () => {
  return ARABIC_DICTIONARY;
};
