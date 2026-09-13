import React from 'react';

export const RoleBadge = ({ role }) => {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-cairo bg-amber-50 text-amber-800 border border-amber-200/70 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        <span>مسؤول النظام</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-cairo bg-slate-100/80 text-slate-700 border border-slate-200/70">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
      <span>باحث / مستخدم</span>
    </span>
  );
};

export const UserStatusBadge = ({ status }) => {
  if (status === 'suspended') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-cairo bg-rose-50 text-rose-700 border border-rose-200/70 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        <span>معلّق</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-cairo bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
      <span>نشط</span>
    </span>
  );
};

export const ResearchStatusBadge = ({ status }) => {
  switch (status) {
    case 'exported':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-cairo bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>تم التصدير</span>
        </span>
      );
    case 'ready':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-cairo bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
          <span>جاهز</span>
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-cairo bg-blue-50 text-blue-800 border border-blue-200/70 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span>قيد التحرير</span>
        </span>
      );
    case 'structure_review':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-cairo bg-purple-50 text-purple-800 border border-purple-200/70 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          <span>مراجعة الهيكلية</span>
        </span>
      );
    case 'draft':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-cairo bg-slate-100 text-slate-600 border border-slate-200/70">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          <span>مسودة</span>
        </span>
      );
  }
};

export const ResearchStepBadge = ({ step = 1 }) => {
  const stepLabels = {
    1: '١. صفحة الغلاف',
    2: '٢. المقدمة والخطة',
    3: '٣. هيكلية البحث',
    4: '٤. محتوى المطالب',
    5: '٥. الهوامش والتوثيق',
    6: '٦. الخاتمة والنتائج',
    7: '٧. المصادر والمراجع',
    8: '٨. فهرس الموضوعات',
    9: '٩. المعاينة والطباعة'
  };

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-cairo font-semibold bg-slate-100/90 text-slate-700 border border-slate-200/80">
      {stepLabels[step] || `المرحلة ${step}`}
    </span>
  );
};

export const ActivityActionBadge = ({ action }) => {
  const map = {
    user_login: { label: 'تسجيل دخول', color: 'bg-blue-50 text-blue-800 border-blue-200/70' },
    user_register: { label: 'تسجيل حساب جديد', color: 'bg-emerald-50 text-emerald-800 border-emerald-200/70' },
    research_created: { label: 'إنشاء بحث', color: 'bg-teal-50 text-teal-800 border-teal-200/70' },
    research_updated: { label: 'تحديث بحث', color: 'bg-slate-50 text-slate-700 border-slate-200/70' },
    pdf_exported: { label: 'تصدير PDF', color: 'bg-rose-50 text-rose-800 border-rose-200/70' },
    docx_exported: { label: 'تصدير Word', color: 'bg-indigo-50 text-indigo-800 border-indigo-200/70' },
    role_changed: { label: 'تغيير الدور', color: 'bg-amber-50 text-amber-800 border-amber-200/70' },
    user_status_changed: { label: 'تغيير حالة الحساب', color: 'bg-purple-50 text-purple-800 border-purple-200/70' },
    ai_action: { label: 'معالجة ذكاء اصطناعي', color: 'bg-cyan-50 text-cyan-800 border-cyan-200/70' },
    settings_updated: { label: 'تحديث إعدادات', color: 'bg-amber-50 text-amber-800 border-amber-200/70' }
  };

  const item = map[action] || { label: action, color: 'bg-slate-100 text-slate-700 border-slate-200/70' };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-cairo font-bold border shadow-2xs ${item.color}`}>
      {item.label}
    </span>
  );
};
