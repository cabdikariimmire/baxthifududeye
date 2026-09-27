import React from 'react';
import { FileEdit, Sparkles, FileDown } from 'lucide-react';

const Features = () => {
  const featuresList = [
    {
      id: 'feature-1',
      title: 'إعداد البحث',
      desc: 'أنشئ بحثك خطوة بخطوة',
      icon: FileEdit,
      accentColor: 'text-teal-700 bg-teal-50 border-teal-200'
    },
    {
      id: 'feature-2',
      title: 'مساعدة ذكية',
      desc: 'احصل على مساعدة أثناء الكتابة',
      icon: Sparkles,
      accentColor: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    {
      id: 'feature-3',
      title: 'تصدير جاهز',
      desc: 'صدّر بحثك بصيغة PDF القياسية A4',
      icon: FileDown,
      accentColor: 'text-teal-700 bg-teal-50 border-teal-200'
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-white border-b border-slate-200/60 font-cairo" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2">
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
            مميزات المنصة
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            كل ما تحتاجه لإنجاز بحثك الأكاديمي
          </h2>
        </div>

        {/* 3 Simple Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {featuresList.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-slate-50/70 hover:bg-white rounded-2xl sm:rounded-3xl p-7 sm:p-8 border border-slate-200/80 hover:border-teal-200/80 hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-200 flex flex-col items-center text-center group"
              >
                {/* Feature Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xs mb-5 group-hover:scale-105 transition-transform ${item.accentColor}`}
                >
                  <Icon className="w-7 h-7" />
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 group-hover:text-teal-900 transition-colors">
                  {item.title}
                </h3>

                {/* Short Description */}
                <p className="text-sm text-slate-600 font-tajawal leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default Features;
