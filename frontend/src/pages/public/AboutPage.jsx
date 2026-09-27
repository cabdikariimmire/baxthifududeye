import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCMSContent } from '../../hooks/useCMSContent';
import {
  GraduationCap,
  Target,
  Compass,
  Award,
  Users,
  BookOpen,
  FileCheck,
  CheckCircle2,
  Layers,
  FileText,
  Download,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

const AboutPage = () => {
  const { t, i18n } = useTranslation();
  const { content: cmsAbout, tField } = useCMSContent('about');

  const pageTitle = tField(cmsAbout?.title, 'عن منصة مساعد البحث الأكاديمي');
  const pageIntro = tField(cmsAbout?.introduction, 'منظومة متطورة تجمع بين منهجية البحث العلمي الصارمة والذكاء الاصطناعي لتيسير إعداد الأبحاث والرسائل الجامعية وفق الأصول المعيارية.');
  const pageVision = tField(cmsAbout?.vision, 'أن نكون البيئة الرقمية الرائدة في مساندة الباحثين وطلاب الدراسات العليا، وتمكينهم من إنتاج بحوث علمية منضبطة شكلاً ومضموناً، تلبي أعلى معايير النشر والتحكيم الجامعي بأيسر السبل وأعلى درجات الدقة.');
  const pageMission = tField(cmsAbout?.mission, 'توفير أدوات ذكية ومحكمة تأخذ بيد الباحث خطوة بخطوة؛ ابتداءً من تفكيك إشكالية البحث وصياغة خطته، مروراً بتحرير المطالب والتوثيق الدقيق في الهوامش، وانتهاءً بالإخراج والطباعة القياسية A4.');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 font-cairo">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-700 to-teal-950 items-center justify-center text-white shadow-lg shadow-teal-800/20 mb-2">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
          {pageTitle}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 font-amiri leading-relaxed">
          {pageIntro}
        </p>
      </div>

      {/* Vision & Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{t('about.visionTitle', 'رؤيتنا الأكاديمية')}</h2>
          <p className="text-sm text-slate-600 font-amiri leading-relaxed">
            {pageVision}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{t('about.missionTitle', 'رسالتنا')}</h2>
          <p className="text-sm text-slate-600 font-amiri leading-relaxed">
            {pageMission}
          </p>
        </div>
      </div>

      {/* Why Platform Was Built */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-8 sm:p-10 mb-16 space-y-6">
        <h2 className="text-2xl font-black text-slate-950 text-center sm:text-right">
          لماذا تم إنشاء هذه المنصة؟
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-amiri text-slate-700 leading-relaxed text-sm">
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <h3 className="font-bold font-cairo text-base text-slate-900 mb-2">تخفيف العبء الشكلي</h3>
            <p>
              يستهلك الباحثون والطلاب وقتاً طويلاً في ضبط المسافات والهوامش والفهارس، مما يصرفهم عن جوهر البحث والتحليل العلمي الرصين.
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <h3 className="font-bold font-cairo text-base text-slate-900 mb-2">توحيد المعايير الأكاديمية</h3>
            <p>
              ضمان الالتزام الصارم بقواعد كتابة الهوامش السفلية، والترتيب الهجائي للمصادر والمراجع بعد تجريد أرقام الأجزاء والصفحات.
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <h3 className="font-bold font-cairo text-base text-slate-900 mb-2">تطابق الشاشة مع المطبوع</h3>
            <p>
              حل مشكلة اختلاف تنسيق الصفحات بين برامج المعالجة النصية والطباعة الورقية من خلال محاكاة فيزيائية دقيقة لأبعاد A4.
            </p>
          </div>
        </div>
      </div>

      {/* Target Audiences */}
      <div className="mb-16 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950">الفئات المستهدفة</h2>
          <p className="text-sm text-slate-600 font-amiri mt-1">صُممت المنصة لتلبي احتياجات مختلف أطراف المجتمع الأكاديمي</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">الطلاب والدارسون</h3>
            <p className="text-xs text-slate-500 font-amiri leading-relaxed">
              إعداد بحوث التخرج والتكاليف الفصلية وفق مواصفات كلياتهم وأقسامهم العلمية.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">باحثو الدراسات العليا</h3>
            <p className="text-xs text-slate-500 font-amiri leading-relaxed">
              تنظيم رسائل الماجستير والدكتوراه وهيكلة الأبواب والفصول وضبط المراجع.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">أعضاء هيئة التدريس</h3>
            <p className="text-xs text-slate-500 font-amiri leading-relaxed">
              إعداد الأوراق البحثية المحكمة والمراجعات العلمية بسرعة وموثوقية عالية.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">المؤسسات التعليمية</h3>
            <p className="text-xs text-slate-500 font-amiri leading-relaxed">
              مواءمة أطر البحوث والأغلفة الرسمية مع هوية الكليات والجامعات المختلفة.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Bottom */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-950 rounded-3xl p-8 sm:p-10 text-white text-center space-y-5">
        <h2 className="text-2xl sm:text-3xl font-black">{t('about.ctaTitle', 'ابدأ بتجربة المنصة اليوم')}</h2>
        <p className="text-sm text-teal-100 font-amiri max-w-xl mx-auto leading-relaxed">
          {t('about.ctaSubtitle', 'انضم إلى مئات الباحثين الذين يعتمدون على المنصة في إخراج أبحاثهم الجامعية بجودة لا تضاهى.')}
        </p>
        <div>
          <Link
            to="/research/new"
            className="btn bg-white text-teal-900 hover:bg-slate-100 font-bold px-8 py-3.5 text-sm inline-flex items-center gap-2 shadow-lg"
          >
            <span>{t('hero.startFree', 'بدء بحث جديد الآن')}</span>
            <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180 transition-transform" />
          </Link>
        </div>
      </div>

    </div>
  );
};

export default AboutPage;
