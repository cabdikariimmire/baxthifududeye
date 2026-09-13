/**
 * Cover Layout Helper for Document Engine & DOCX Generation (A4: 210mm x 297mm)
 */

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

function getDefaultCoverElements(coverData = {}) {
  const d = coverData || {};

  return [
    {
      id: 'country',
      type: 'text',
      fieldKey: 'country',
      label: 'الدولة',
      content: d.country || '',
      x: 25,
      y: 26,
      width: 160,
      height: 9,
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#0f172a',
      zIndex: 1
    },
    {
      id: 'university',
      type: 'text',
      fieldKey: 'university',
      label: 'الجامعة',
      content: d.university || '',
      x: 25,
      y: 37,
      width: 160,
      height: 9,
      fontSize: 20.5,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#0f172a',
      zIndex: 1
    },
    {
      id: 'logo',
      type: 'image',
      fieldKey: 'logoUrl',
      label: 'شعار الجامعة',
      source: d.logoUrl || '',
      x: 87.5,
      y: 50,
      width: 35,
      height: 35,
      aspectRatio: 1,
      zIndex: 2
    },
    {
      id: 'college',
      type: 'text',
      fieldKey: 'college',
      label: 'الكلية',
      content: d.college || '',
      x: 25,
      y: 92,
      width: 160,
      height: 9,
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#0f172a',
      zIndex: 1
    },
    {
      id: 'subject',
      type: 'text',
      fieldKey: 'subject',
      label: 'المادة',
      prefix: 'المادة : ',
      content: d.subject || '',
      x: 25,
      y: 103,
      width: 160,
      height: 9,
      fontSize: 19.5,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#1e293b',
      zIndex: 1
    },
    {
      id: 'title',
      type: 'pill',
      fieldKey: 'title',
      label: 'عنوان البحث',
      content: d.title || '',
      badgeColor: d.badgeColor || '#38761d',
      x: 35,
      y: 121,
      width: 140,
      height: 16,
      fontSize: 20.5,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#0f172a',
      zIndex: 3
    },
    {
      id: 'studentName',
      type: 'text',
      fieldKey: 'studentName',
      label: 'اسم الطالب',
      prefix: 'إعداد الطالب : ',
      content: d.studentName || '',
      x: 25,
      y: 148,
      width: 160,
      height: 9,
      fontSize: 19.5,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#1e293b',
      zIndex: 1
    },
    {
      id: 'level',
      type: 'text',
      fieldKey: 'level',
      label: 'المستوى الدراسي',
      content: d.level || '',
      x: 25,
      y: 159,
      width: 160,
      height: 9,
      fontSize: 19,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#334155',
      zIndex: 1
    },
    {
      id: 'supervisor',
      type: 'text',
      fieldKey: 'supervisor',
      label: 'المشرف العلمي',
      prefix: 'إشراف الدكتور : ',
      content: d.supervisor || '',
      x: 25,
      y: 177,
      width: 160,
      height: 9,
      fontSize: 19.5,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#1e293b',
      zIndex: 1
    },
    {
      id: 'semester',
      type: 'text',
      fieldKey: 'semester',
      label: 'الفصل الدراسي',
      content: d.semester || '',
      x: 25,
      y: 195,
      width: 160,
      height: 9,
      fontSize: 18.5,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#334155',
      zIndex: 1
    },
    {
      id: 'academicYearLabel',
      type: 'static-text',
      label: 'تسمية العام الدراسي',
      content: 'العام الدراسي',
      x: 25,
      y: 213,
      width: 160,
      height: 8,
      fontSize: 18.5,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#1e293b',
      zIndex: 1
    },
    {
      id: 'academicYear',
      type: 'text',
      fieldKey: 'academicYear',
      label: 'العام الهجري',
      content: d.academicYear || '',
      x: 25,
      y: 223,
      width: 160,
      height: 8,
      fontSize: 18.5,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#334155',
      zIndex: 1
    },
    {
      id: 'gregorianLabel',
      type: 'static-text',
      label: 'تسمية الموافق',
      content: 'الموافق',
      x: 25,
      y: 233,
      width: 160,
      height: 8,
      fontSize: 17.5,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#1e293b',
      zIndex: 1
    },
    {
      id: 'gregorianYear',
      type: 'text',
      fieldKey: 'gregorianYear',
      label: 'العام الميلادي',
      content: d.gregorianYear || '',
      x: 25,
      y: 243,
      width: 160,
      height: 8,
      fontSize: 18.5,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#334155',
      zIndex: 1
    }
  ];
}

function buildDefaultCoverLayout(coverData = {}) {
  return {
    pageWidth: A4_WIDTH_MM,
    pageHeight: A4_HEIGHT_MM,
    elements: getDefaultCoverElements(coverData)
  };
}

function mergeCoverDataWithLayout(existingLayout, coverData = {}) {
  const defaultEls = getDefaultCoverElements(coverData);
  if (!existingLayout || !Array.isArray(existingLayout.elements) || existingLayout.elements.length === 0) {
    return {
      pageWidth: A4_WIDTH_MM,
      pageHeight: A4_HEIGHT_MM,
      elements: defaultEls
    };
  }

  const mergedElements = defaultEls.map((defaultEl) => {
    const customEl = existingLayout.elements.find((e) => e.id === defaultEl.id);
    if (!customEl) return defaultEl;

    return {
      ...defaultEl,
      ...customEl,
      content: defaultEl.content,
      source: defaultEl.source,
      badgeColor: defaultEl.badgeColor || customEl.badgeColor
    };
  });

  return {
    pageWidth: existingLayout.pageWidth || A4_WIDTH_MM,
    pageHeight: existingLayout.pageHeight || A4_HEIGHT_MM,
    elements: mergedElements
  };
}

module.exports = {
  A4_WIDTH_MM,
  A4_HEIGHT_MM,
  getDefaultCoverElements,
  buildDefaultCoverLayout,
  mergeCoverDataWithLayout
};
