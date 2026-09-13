import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { BookOpen, Sparkles, CheckCircle2, FileText, Layers, Download, ShieldCheck, ArrowLeft, Award, FileCheck2, ListOrdered, Quote } from 'lucide-react';

const LandingPage = () => {
  const { user } = useAuth();

  const workflowSteps = [
    { num: '01', title: 'الغلاف والإطار', desc: 'اختيار الإطار الأكاديمي وإدخال بيانات الجامعة مع معاينة فورية.', icon: Award, color: 'text-rose-700 bg-rose-50 border-rose-200' },
    { num: '02', title: 'المقدمة وخطة البحث', desc: 'إدخال ديباجة البحث وأهدافه وخطة المطالب المقترحة.', icon: FileText, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { num: '03', title: 'هيكلية المطالب', desc: 'تحليل واكتشاف المطالب والفروع مع تأكيد الباحث.', icon: Sparkles, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { num: '04', title: 'محتوى المطالب', desc: 'تصنيف الكتل دلالياً إلى H1, H2, H3 والفقرات تلقائياً.', icon: Layers, color: 'text-teal-700 bg-teal-50 border-teal-200' },
    { num: '05', title: 'الهوامش والحواشي', desc: 'إحالات دقيقة أسفل كل صفحة فوق خط الفصل الأكاديمي.', icon: Quote, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    { num: '06', title: 'الخاتمة والنتائج', desc: 'صياغة نتائج البحث وتوصياته بنقاط مرقمة واضحة.', icon: FileCheck2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { num: '07', title: 'المصادر والمراجع', desc: 'تجريد أرقام الأجزاء والصفحات وتوحيد المراجع المكررة.', icon: BookOpen, color: 'text-purple-700 bg-purple-50 border-purple-200' },
    { num: '08', title: 'فهرس الموضوعات', desc: 'حساب الصفحات الفعلي بنقاط التوصيل دون أي تخمين.', icon: ListOrdered, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { num: '09', title: 'المعاينة الشاملة', desc: 'تصفح المستند صفحة بصفحة مع روابط تنقل تفاعلية.', icon: CheckCircle2, color: 'text-teal-700 bg-teal-50 border-teal-200' },
    { num: '10', title: 'تصدير وتحميل PDF', desc: 'تحميل وطباعة المستند بجودة عالية مطابقة للمرجع الجامعي.', icon: Download, color: 'text-slate-800 bg-slate-100 border-slate-300' }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-16 py-6">
      {/* =========================================================================
          HERO SECTION — Two-Column Balanced Layout with A4 Document Mockup
         ========================================================================= */}
      <section className="pt-4 pb-12 relative border-b border-slate-200/80">
        <div className="hero-glow"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Right Column (in RTL): Copy & Actions (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-6 text-right">
            <div>
              <span className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-800 px-3.5 py-1.5 rounded-full text-xs font-bold font-cairo shadow-xs mb-3">
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                <span>المنظومة الأكاديمية الذكية للبحوث الجامعية</span>
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-cairo leading-[1.35] tracking-tight">
                أنشئ بحثك الأكاديمي المتكامل{' '}
                <span className="text-teal-700 block mt-1">
                  وفق الأصول الجامعية
                </span>
              </h1>
            </div>

            <p className="text-base text-slate-600 font-amiri leading-relaxed">
              منصة متخصصة تقودك خطوة بخطوة من تصميم الغلاف واختيار الإطار الأكاديمي، إلى تحليل المقدمة بالذكاء الاصطناعي، وتصنيف المطالب، وتوليد الهوامش، وقائمة المصادر المنسقة، وفهرس الموضوعات الحقيقي بدقة A4.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/research/new"
                className="btn btn-primary px-7 py-3.5 text-sm sm:text-base font-bold shadow-lg shadow-teal-700/20 flex items-center gap-2"
              >
                <span>ابدأ بحثك الأكاديمي الآن</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <Link
                to="/dashboard"
                className="btn btn-secondary px-6 py-3.5 text-sm sm:text-base font-semibold border-slate-300"
              >
                <span>الانتقال للوحة بحوثي</span>
              </Link>
            </div>

            {/* Trust Metrics Pill */}
            <div className="pt-5 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold font-cairo">
                <CheckCircle2 className="w-4 h-4 text-teal-700 flex-shrink-0" />
                <span>١٠ خطوات محكومة</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold font-cairo">
                <CheckCircle2 className="w-4 h-4 text-teal-700 flex-shrink-0" />
                <span>حذف أرقام ج وص</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold font-cairo">
                <CheckCircle2 className="w-4 h-4 text-teal-700 flex-shrink-0" />
                <span>ترقيم حقيقي دقيق</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold font-cairo">
                <CheckCircle2 className="w-4 h-4 text-teal-700 flex-shrink-0" />
                <span>تصدير PDF قياسي</span>
              </div>
            </div>
          </div>

          {/* Left Column (in RTL): Live Document / PDF Mockup (6 cols) */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-[360px]">
              {/* Background Glow */}
              <div className="absolute -inset-3 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-3xl blur-xl opacity-15"></div>

              {/* Main A4 Document Sheet Card */}
              <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200/90 p-5 font-amiri flex flex-col gap-4">
                {/* Decorative Border Preview Frame */}
                <div className="border-2 border-red-900/80 border-dashed rounded-xl p-4 flex flex-col gap-3">
                  {/* Header Mockup */}
                  <div className="text-center">
                    <div className="text-xs font-bold text-slate-800 font-cairo">جمهورية الصومال</div>
                    <div className="text-sm font-extrabold text-slate-900 font-cairo">جامعة هرمود</div>
                    <div className="w-8 h-8 rounded-full border border-teal-700/30 bg-teal-50 mx-auto my-1 flex items-center justify-center text-[9px] font-bold text-teal-800 font-cairo">
                      شعار
                    </div>
                    <div className="text-xs font-bold text-slate-800 font-cairo">كلية الشريعة والقيادة</div>
                    <div className="text-[11px] text-slate-600 font-cairo">المادة: الفقه</div>
                  </div>

                  {/* Green Title Banner */}
                  <div className="bg-[#38761d] text-white text-center py-1.5 px-3 rounded-md shadow-sm">
                    <div className="font-bold text-base font-cairo">الإعتكاف</div>
                  </div>

                  {/* Metadata Block */}
                  <div className="text-center text-xs text-slate-700 font-amiri">
                    <div>إعداد الطالب: <b>عباس عبد الناصر</b></div>
                    <div>المستوى الثاني</div>
                    <div>المشرف: <b>د. محمد عبد الله الشرعبي</b></div>
                    <div className="text-[10px] text-slate-500 pt-1 font-cairo">العام الدراسي: 1447_ 1448هـ / 2025 _ 2026م</div>
                  </div>
                </div>

                {/* Floating Dotted TOC Widget */}
                <div className="bg-amber-50/90 rounded-xl p-3 border border-amber-200 text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between items-center bg-amber-200/70 px-2 py-1 rounded font-bold text-[11px] text-amber-950 font-cairo">
                    <span>فهرس الموضوعات</span>
                    <span>الصفحة</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-700">
                    <span>المقدمة وخطة البحث</span>
                    <span className="border-b border-dotted border-slate-400 flex-1 mx-2"></span>
                    <span className="font-bold font-cairo">٢</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-700">
                    <span>المطلب الأول: تعريف الاعتكاف</span>
                    <span className="border-b border-dotted border-slate-400 flex-1 mx-2"></span>
                    <span className="font-bold font-cairo">٣</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-700">
                    <span>المصادر والمراجع</span>
                    <span className="border-b border-dotted border-slate-400 flex-1 mx-2"></span>
                    <span className="font-bold font-cairo">٧</span>
                  </div>
                </div>

                {/* Badge floating */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="badge badge-success font-bold font-cairo text-[11px]">
                    مطابق للمرجع الأكاديمي
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    A4 Standard
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          WORKFLOW SECTION — 10 Step Connected Academic Cards
         ========================================================================= */}
      <section className="pt-2 pb-12 border-b border-slate-200/80">
        <div className="section-header">
          <span className="badge badge-primary px-3 py-1 font-bold font-cairo">
            مسار العمل المنضبط
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-cairo">
            رحلة بناء البحث في ١٠ خطوات محكومة
          </h2>
          <p className="text-sm text-slate-500 font-amiri leading-relaxed">
            الذكاء الاصطناعي يفهم المحتوى ويقترح الهيكلية، بينما يتحكم محرك المستندات في التنسيق والأرقام
          </p>
        </div>

        <div className="workflow-grid">
          {workflowSteps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="workflow-card">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100">
                    {item.num}
                  </span>
                  <div className={`w-8 h-8 rounded-lg ${item.color} border flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-1.5 text-right mt-3">
                  <h3 className="font-bold text-sm text-slate-900 font-cairo">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-amiri line-clamp-3">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          CORE VALUE PROPOSITION — Architectural Principles
         ========================================================================= */}
      <section className="pt-2 pb-12">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="dark-card-title">
              لماذا يختلف مساعد البحث الأكاديمي عن روبوتات الدردشة العامة؟
            </h2>
            <p className="dark-card-subtitle">
              روبوتات الدردشة العامة تخمن أرقام الصفحات وتختلق المصادر؛ منصتنا مبنية على محرك حتمي وقواعد أكاديمية صارمة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700/80 flex flex-col gap-3 text-right">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base font-cairo text-white">لا اختلاق للمصادر أو الصفحات</h3>
              <p className="text-xs text-slate-300 font-amiri leading-relaxed">
                الذكاء الاصطناعي محكوم بصرامة؛ لا يقوم بتأليف أي كتاب أو دار نشر غير موجودة في هوامشك الأصلية.
              </p>
            </div>

            <div className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700/80 flex flex-col gap-3 text-right">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                <ListOrdered className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base font-cairo text-white">ترقيم صفحات وفهرس حتمي 100%</h3>
              <p className="text-xs text-slate-300 font-amiri leading-relaxed">
                يتم توليد فهرس الموضوعات بعد تثبيت أبعاد المستند وتحديد مواقع العناوين الحقيقية داخل صفحات A4.
              </p>
            </div>

            <div className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700/80 flex flex-col gap-3 text-right">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base font-cairo text-white">حفظ تدريجي مستمر للمسودات</h3>
              <p className="text-xs text-slate-300 font-amiri leading-relaxed">
                كل خطوة وكل هامش يُحفظ في قاعدة البيانات فورياً؛ يمكنك العودة واستكمال بحثك في أي وقت.
              </p>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link
              to="/research/new"
              className="btn btn-primary px-8 py-3.5 text-base font-bold shadow-lg"
            >
              <span>ابدأ مشروعك البحثي الآن</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
