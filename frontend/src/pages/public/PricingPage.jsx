import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Building2,
  BookOpen,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';

const PricingPage = () => {
  const plans = [
    {
      name: 'الوصول الأكاديمي الشامل',
      subtitle: 'متاح لكافة الطلاب والباحثين',
      badgeText: 'متاح حالياً',
      isCurrent: true,
      features: [
        'تصدير نهائي كامل لبحثك بصيغة PDF القياسية A4',
        'توثيق دقيق وتلقائي للهوامش السفلية المدمجة بكل صفحة',
        'توليد صفحة الغلاف الجامعية المعتمدة والإطار الزخرفي',
        'فهرس الموضوعات الفعلي بأرقام الصفحات الحقيقية',
        'ترتيب وضبط المصادر والمراجع هجائياً',
        'إمكانية التعديل على الموقع وإعادة تصدير الـ PDF في أي وقت',
        'دعم كامل للهياكل الأكاديمية (المباحث، المطالب، الفروع)'
      ],
      buttonText: 'ابدأ إعداد بحثك الآن مجاناً',
      buttonLink: '/research/new'
    },
    {
      name: 'شراكات الجامعات والمؤسسات',
      subtitle: 'تكامل مؤسسي مع الكليات والمراكز العلمية',
      badgeText: 'شراكات أكاديمية',
      isCurrent: false,
      features: [
        'إدارة موحدة لحسابات طلاب وباحثي الكلية',
        'تخصيص كامل لأغلفة وأطر الجامعة وشعاراتها المعتمدة',
        'لوحة إشراف وتدقيق أكاديمي لأعضاء هيئة التدريس',
        'فواتير موحدة ودعم فني مؤسسي مخصص'
      ],
      buttonText: 'تواصل معنا للشراكات',
      buttonLink: '/contact'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 font-cairo" dir="rtl">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-100/70 text-teal-900">
          الخدمات الأكاديمية
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
          منظومة متكاملة لخدمة البحث العلمي والجامعي
        </h1>
        <p className="text-base sm:text-lg text-slate-600 font-amiri leading-relaxed">
          صممت المنظومة لتسهيل إعداد وصياغة وتنسيق الأبحاث والرسائل الجامعية وفق أعلى المعايير الأكاديمية المعتمدة لطباعة صفحات A4 قياسية.
        </p>
      </div>

      {/* Info Notice Banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 mb-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-right">
          <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-teal-950">تصدير PDF الأكاديمي القياسي A4</h4>
            <p className="text-xs text-teal-800 font-amiri mt-0.5">
              الملف المصدر هو مستند PDF النهائي المهيأ للطباعة والتسليم الجامعي المباشر. المنصة هي المصدر الحصري للتحرير والتعديل.
            </p>
          </div>
        </div>
        <Link
          to="/research/new"
          className="btn btn-primary whitespace-nowrap text-xs font-bold py-2.5 px-5"
        >
          ابدأ بحثك الآن
        </Link>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`rounded-3xl p-8 border flex flex-col justify-between transition-all ${
              plan.isCurrent
                ? 'bg-white border-teal-600 shadow-xl ring-2 ring-teal-600/20 relative'
                : 'bg-slate-50/70 border-slate-200/90 shadow-xs'
            }`}
          >
            {plan.isCurrent && (
              <span className="absolute -top-3.5 right-6 bg-teal-700 text-white text-[11px] font-bold py-1 px-3 rounded-full shadow-xs">
                {plan.badgeText}
              </span>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-950">{plan.name}</h3>
                <p className="text-xs text-slate-500 font-amiri mt-1">{plan.subtitle}</p>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 block">المزايا المضمنة:</span>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.isCurrent ? 'text-teal-700' : 'text-slate-500'}`} />
                      <span className="font-amiri leading-relaxed">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <Link
                to={plan.buttonLink}
                className={`btn w-full py-3 text-sm font-bold flex items-center justify-center gap-2 ${
                  plan.isCurrent ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                <span>{plan.buttonText}</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
