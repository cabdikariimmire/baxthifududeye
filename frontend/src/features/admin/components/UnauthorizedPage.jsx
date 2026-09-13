import React from 'react';
import { ShieldAlert, ArrowRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl mx-auto flex items-center justify-center ring-8 ring-red-50/50">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full font-cairo">
            رمز الخطأ: 403 غير مصرح
          </span>
          <h1 className="text-xl font-bold text-slate-900 font-cairo">
            ليس لديك صلاحية للوصول إلى لوحة الإدارة
          </h1>
          <p className="text-sm text-slate-600 font-amiri leading-relaxed">
            هذه المنطقة مخصصة فقط للمسؤولين المعتمدين للنظام الأكاديمي. إذا كنت تعتقد أن هناك خطأ، يرجى التواصل مع إدارة المنصة.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="btn btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm"
          >
            <Home className="w-4 h-4" />
            <span>العودة إلى لوحة التحكم</span>
          </Link>
          <Link
            to="/"
            className="btn btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm"
          >
            <span>الصفحة الرئيسية</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
