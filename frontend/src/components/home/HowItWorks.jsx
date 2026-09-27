import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { PlayCircle, ArrowLeft } from 'lucide-react';

const HowItWorks = ({ onOpenModal }) => {
  const { isAuthenticated } = useAuth();

  const steps = [
    {
      num: '01',
      title: 'ابدأ بحثك',
      desc: 'أدخل البيانات الأساسية ونوع البحث'
    },
    {
      num: '02',
      title: 'اكتب ونظّم',
      desc: 'صياغة المحتوى وتوثيق الهوامش'
    },
    {
      num: '03',
      title: 'صدّر بحثك',
      desc: 'تصدير فوري بصيغة PDF القياسية A4'
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-slate-50/50 border-b border-slate-200/60 font-cairo" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16 space-y-2">
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
            طريقة الاستخدام
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            كيف تبدأ إعداد بحثك؟
          </h2>
        </div>

        {/* 3 Steps Minimal Line */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto relative">
          
          {steps.map((step, idx) => (
            <div
              key={step.num}
              className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col items-center text-center relative group hover:border-teal-200 hover:shadow-md transition-all"
            >
              {/* Step Number Badge */}
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-800 flex items-center justify-center text-base font-black mb-4 font-cairo group-hover:scale-105 group-hover:bg-teal-700 group-hover:text-white transition-all shadow-2xs">
                {step.num}
              </div>

              {/* Title */}
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                {step.title}
              </h3>

              {/* Short Note */}
              <p className="text-xs sm:text-sm text-slate-500 font-tajawal">
                {step.desc}
              </p>
            </div>
          ))}

        </div>

        {/* Quick CTA Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mt-12">
          <Link
            to={isAuthenticated ? "/research/new" : "/login?redirect=/research/new"}
            className="btn btn-primary px-6 py-2.5 rounded-xl text-sm font-bold shadow-xs hover:shadow-md flex items-center gap-2"
          >
            <span>ابدأ الآن مجاناً</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={onOpenModal}
            className="btn btn-secondary px-5 py-2.5 rounded-xl text-sm font-semibold border-slate-300 text-slate-700 hover:text-teal-800 hover:border-teal-300 flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4 text-teal-700" />
            <span>تفاصيل الخطوات</span>
          </button>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
