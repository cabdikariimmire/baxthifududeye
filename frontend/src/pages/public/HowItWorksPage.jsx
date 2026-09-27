import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/AuthContext';
import { useCMSContent } from '../../hooks/useCMSContent';
import Footer from '../../components/common/Footer';
import {
  UserPlus,
  FileText,
  PenTool,
  BookOpen,
  FileDown,
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  BookMarked
} from 'lucide-react';

const HowItWorksPage = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { content: cmsHow, tField } = useCMSContent('how-it-works');

  const pageTitle = tField(cmsHow?.title, 'طريقة الاستخدام');
  const pageSubtitle = tField(cmsHow?.subtitle, 'خطوات بسيطة وواضحة لتحويل فكرتك إلى بحث أكاديمي متكامل');

  const defaultWorkflowSteps = [
    {
      num: '01',
      title: i18n.language === 'en' ? 'Create Account & Start' : (i18n.language === 'so' ? 'Samee Akoon oo Bilow' : 'إنشاء الحساب والبدء'),
      desc: i18n.language === 'en' ? 'Create your platform account and choose the research type you want.' : (i18n.language === 'so' ? 'Ka sameyso akoon oo dooro nooca cilmi-baarista aad rabto.' : 'قم بإنشاء حسابك في المنصة ثم اختر نوع البحث الذي ترغب في إعداده.'),
      checklist: [
        i18n.language === 'en' ? 'Register new account' : (i18n.language === 'so' ? 'Diiwaangeli akoon cusub' : 'تسجيل حساب جديد'),
        i18n.language === 'en' ? 'Select research type' : (i18n.language === 'so' ? 'Dooro nooca cilmi-baarista' : 'اختيار نوع البحث'),
        i18n.language === 'en' ? 'Access dashboard' : (i18n.language === 'so' ? 'Gal dashboard-ka' : 'الدخول إلى لوحة التحكم')
      ],
      icon: UserPlus
    },
    {
      num: '02',
      title: i18n.language === 'en' ? 'Introduction & Research Plan' : (i18n.language === 'so' ? 'Hordhaca & Qorshaha Cilmi-baarista' : 'المقدمة وخطة البحث'),
      desc: i18n.language === 'en' ? 'Enter research title, define problem & objectives, and create a structured plan.' : (i18n.language === 'so' ? 'Geli cinwaanka, qeex dhibaatada & yoolalka, samee qorshe nidaamsan.' : 'أدخل عنوان البحث وحدد المشكلة والأهداف، ثم أنشئ خطة البحث المنظمة.'),
      checklist: [
        i18n.language === 'en' ? 'Add research title' : (i18n.language === 'so' ? 'Ku dar cinwaanka' : 'إضافة عنوان البحث'),
        i18n.language === 'en' ? 'Write introduction' : (i18n.language === 'so' ? 'Qor hordhaca' : 'كتابة المقدمة'),
        i18n.language === 'en' ? 'Generate structured plan' : (i18n.language === 'so' ? 'Diyaari qorshaha cilmi-baarista' : 'إعداد خطة البحث')
      ],
      icon: FileText
    },
    {
      num: '03',
      title: i18n.language === 'en' ? 'Content Writing & Structuring' : (i18n.language === 'so' ? 'Qorista & Habaynta Nuxurka' : 'كتابة المحتوى وتنظيمه'),
      desc: i18n.language === 'en' ? 'Use AI writing tools to produce structured, consistent academic content.' : (i18n.language === 'so' ? 'Adeegso qalabka AI si aad u soo saarto nuxur tacliimeed nidaamsan.' : 'استخدم أدوات الكتابة الذكية لإنتاج محتوى أكاديمي منظم ومتناسق.'),
      checklist: [
        i18n.language === 'en' ? 'Write chapters & sections' : (i18n.language === 'so' ? 'Qor cutubyada iyo qeybaha' : 'كتابة الفصول والمباحث'),
        i18n.language === 'en' ? 'Smart AI assistance' : (i18n.language === 'so' ? 'Caawinta garaadka macmalka ah' : 'المساعدة بالذكاء الاصطناعي'),
        i18n.language === 'en' ? 'Seamless content formatting' : (i18n.language === 'so' ? 'Habaynta nuxurka si fudud' : 'تنظيم المحتوى بسهولة')
      ],
      icon: PenTool
    },
    {
      num: '04',
      title: i18n.language === 'en' ? 'Citations & Reference Management' : (i18n.language === 'so' ? 'Xigashooyinka & Maareynta Tixraacyada' : 'التوثيق وإدارة المراجع'),
      desc: i18n.language === 'en' ? 'Add references and format citations automatically with APA/MLA styles.' : (i18n.language === 'so' ? 'Ku dar tixraacyada una qaabee si toos ah hababka APA/MLA.' : 'أضف المراجع ووثقها تلقائياً بنمط مناسب مع إدارة المصادر.'),
      checklist: [
        i18n.language === 'en' ? 'Add references' : (i18n.language === 'so' ? 'Ku dar tixraacyada' : 'إضافة المراجع'),
        i18n.language === 'en' ? 'Automatic citations (APA/MLA)' : (i18n.language === 'so' ? 'Xigasho toos ah APA/MLA' : 'التوثيق التلقائي APA/MLA'),
        i18n.language === 'en' ? 'Source management' : (i18n.language === 'so' ? 'Maareynta ilaha' : 'إدارة المصادر')
      ],
      icon: BookOpen
    }
  ];

  const workflowSteps = cmsHow?.steps?.length > 0
    ? cmsHow.steps.map((st, idx) => ({
        num: st.number || `0${idx + 1}`,
        title: tField(st.title),
        desc: tField(st.description),
        checklist: [t('common.verifiedStep', 'خطوة معتمدة'), t('common.smartPrep', 'إعداد أكاديمي ذكي'), t('common.autoSave', 'حفظ تلقائي')],
        icon: [UserPlus, FileText, PenTool, BookOpen, FileDown][idx % 5]
      }))
    : defaultWorkflowSteps;

  return (
    <div className="w-full font-cairo text-slate-900 bg-white selection:bg-teal-100 selection:text-teal-900 flex flex-col min-h-[calc(100vh-72px)]">
      
      {/* =========================================================================
          HERO SECTION — Centered with Decorative Academic Illustrations
         ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-20 bg-gradient-to-b from-white via-teal-50/20 to-white border-b border-slate-200/60">
        
        {/* Soft Ambient Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[300px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Decorative Dotted Grid Pattern Background */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0f766e_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Decorative Academic Floating Graphic Left: Stacked Books */}
        <div className="hidden xl:flex absolute left-12 top-1/2 -translate-y-1/2 opacity-70 pointer-events-none flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100/80 text-teal-700 flex items-center justify-center shadow-xs rotate-[-6deg]">
            <BookMarked className="w-7 h-7" />
          </div>
          <div className="w-16 h-1.5 bg-teal-100/70 rounded-full" />
        </div>

        {/* Decorative Academic Floating Graphic Right: Graduation Cap */}
        <div className="hidden xl:flex absolute right-12 top-1/2 -translate-y-1/2 opacity-70 pointer-events-none flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100/80 text-emerald-700 flex items-center justify-center shadow-xs rotate-[6deg]">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="w-16 h-1.5 bg-emerald-100/70 rounded-full" />
        </div>

        {/* Center Hero Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-4">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>مسار العمل المنظم</span>
          </div>

          {/* Main Heading with Highlighted "خطوة بخطوة" */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.3] tracking-tight">
            طريقة استخدام المنصة{' '}
            <span className="text-teal-700 inline-block">
              خطوة بخطوة
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 font-tajawal max-w-2xl mx-auto leading-relaxed">
            تعرف على المراحل البسيطة التي تقودك خلالها مساعد البحث الأكاديمي لبناء بحث جامعي متكامل وموثوق.
          </p>

        </div>
      </section>

      {/* =========================================================================
          WORKFLOW STEPS — EXACTLY 5 Spacious Horizontal Cards Stacked Vertically
         ========================================================================= */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="space-y-6 sm:space-y-7">
            {workflowSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-teal-200/90 hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-5 sm:gap-6">
                    
                    {/* Step Number & Icon Group (Right Side in RTL) */}
                    <div className="flex items-center gap-3.5 sm:gap-4 flex-shrink-0">
                      {/* Large Number */}
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-teal-700 font-cairo tracking-tight">
                        {step.num}
                      </span>

                      {/* Icon inside light teal rounded square */}
                      <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Step Details & Content (Middle/Left in RTL) */}
                    <div className="flex-1 space-y-2 text-right">
                      {/* Title */}
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-teal-900 transition-colors leading-snug">
                        {step.title}
                      </h3>

                      {/* Short Description */}
                      <p className="text-sm text-slate-600 font-tajawal leading-relaxed">
                        {step.desc}
                      </p>

                      {/* Checklist Pills */}
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {step.checklist.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50 border border-slate-200/80 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 font-tajawal shadow-2xs hover:bg-teal-50/60 hover:border-teal-200/80 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* =========================================================================
          WIDE ROUNDED CTA BANNER — Light Teal Background with Academic Shapes
         ========================================================================= */}
      <section className="pb-16 sm:pb-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-50 via-emerald-50/60 to-teal-50 border border-teal-200/80 p-8 sm:p-12 shadow-sm">
            
            {/* Soft Ambient Glows */}
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-teal-200/30 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-emerald-200/30 rounded-full blur-2xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              
              {/* Right/Main Content Column in RTL */}
              <div className="lg:col-span-8 text-right space-y-3">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  جاهز لبدء بحثك الأكاديمي؟
                </h2>
                <p className="text-sm sm:text-base text-slate-600 font-tajawal max-w-xl leading-relaxed">
                  أنشئ حسابك الآن وابدأ رحلتك في إعداد بحث متكامل بسهولة.
                </p>
                <div className="pt-3">
                  <Link
                    to={isAuthenticated ? "/research/new" : "/register"}
                    className="btn btn-primary px-7 py-3 rounded-xl text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
                  >
                    <span>إنشاء حساب مجاني</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Left Column: Academic Decorative Graphic in RTL */}
              <div className="lg:col-span-4 flex justify-center lg:justify-start">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/90 border border-teal-200/80 flex items-center justify-center text-teal-800 shadow-sm shadow-teal-700/10">
                  <GraduationCap className="w-12 h-12 text-teal-700" />
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          REUSABLE FOOTER COMPONENT
         ========================================================================= */}
      <Footer />

    </div>
  );
};

export default HowItWorksPage;
