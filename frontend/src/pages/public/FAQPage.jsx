import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  ChevronDown,
  BookOpen,
  Mail,
  ArrowLeft
} from 'lucide-react';

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'هل يمكنني إنشاء بحث باللغة العربية؟',
      a: 'نعم بالتأكيد. المنصة مصممة ومبنية خصيصاً لخدمة اللغة العربية والإنتاج الأكاديمي الرصين، وتعتمد خط Amiri الأكاديمي المعتمد في الجامعات العريقة، مع دعم كامل للاتجاه من اليمين إلى اليسار (RTL) والحركات وتجريد الحواشي.'
    },
    {
      q: 'هل يمكنني تعديل البحث بعد إنشائه؟',
      a: 'نعم، المنصة تحفظ بيانات البحث بشكل تدريجي في قاعدة البيانات، ويمكنك العودة في أي وقت عبر "لوحة بحوثي" لتعديل أي مرحلة: الغلاف، المقدمة، هيكل المطالب، المحتوى، الهوامش، أو الخاتمة.'
    },
    {
      q: 'هل يتم حفظ البحث ومحتوياته بشكل آمن وتلقائي؟',
      a: 'نعم، كل مرحلة تكتمل في معالج البحث تُحفظ فوراً في حسابك، ولا يستطيع أي مستخدم آخر الاطلاع على أبحاثك أو تعديلها، حيث يطبق النظام مبدأ الفصل الكامل والتحقق الأمني من هوية المالك في الخادم.'
    },
    {
      q: 'هل يمكنني تحميل البحث بصيغة PDF؟',
      a: 'نعم، توفر المنصة محرك تصدير PDF يعتمد على محاكاة المتصفح الفعلي لإنتاج ملفات PDF فائقة الجودة والمطابقة التامة لأبعاد ومقاسات الورق A4 القياسية، مع دقة 100% في خطوط الهوامش ورؤوس الفصول.'
    },
    {
      q: 'لماذا تعتمد المنصة التصدير بصيغة PDF حصرياً؟',
      a: 'تعتمد المنصة حصرياً على تصدير ملفات PDF الأكاديمية القياسية (A4) الجاهزة للطباعة والتسليم الجامعي المباشر، وذلك لضمان استقرار الهوامش السفلية المدمجة في ذات الصفحة، وثبات الأبعاد والتنسيقات دون أي انكسار أو ترحيل للأسطر. ويُعد الموقع هو المصدر الوحيد والحصري لكتابة البحث وتعديله؛ فإذا أردت إجراء أي تعديل، يكفيك العودة إلى محرر الموقع وتعديله ثم إعادة استخراج ملف PDF جديد.'
    },
    {
      q: 'هل تدعم المنصة تنسيق ومعايير A4 الفيزيائية؟',
      a: 'نعم، تطبق المنصة بدقة أبعاد A4 الطبيعية (210×297 مم) مع هوامش علوية وسفلية (24 مم) وهوامش جانبية (25 مم)، وتعتمد محرك قياس رياضي يضمن توزيع الفقرات وتفادي فراغات أو تداخلات الصفحات.'
    },
    {
      q: 'كيف أستعيد كلمة المرور في حال نسيانها؟',
      a: 'يمكنك التوجه إلى رابط "نسيت كلمة المرور؟" في صفحة الدخول، وإدخال بريدك الإلكتروني المسجل، لتصلك رسالة آمنة تحتوي على رابط صالح لمدة ساعة لتعيين كلمة مرور جديدة بكل سهولة.'
    },
    {
      q: 'كيف يمكنني إنشاء حساب باحث جديد؟',
      a: 'بالضغط على زر "إنشاء حساب" في أعلى الصفحة، وتعبئة الاسم الكامل والبريد الإلكتروني وكلمة المرور. بعد إتمام التسجيل ستصلك رسالة لتفعيل الحساب، وتصبح بعدها جاهزاً للبدء.'
    },
    {
      q: 'كيف يمكنني التواصل مع الدعم الفني للاستفسار أو الاقتراحات؟',
      a: 'يمكنك التواصل معنا عبر نموذج "اتصل بنا" المتاح على المنصة، وسيقوم فريق الدعم بمراجعة رسالتك والرد عليك عبر بريدك الإلكتروني في أقرب وقت.'
    }
  ];

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 font-cairo" dir="rtl">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-100/70 text-teal-900">
          مركز المساعدة الأكاديمي
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
          الأسئلة الشائعة
        </h1>
        <p className="text-base text-slate-600 font-amiri leading-relaxed">
          إجابات واضحة ودقيقة عن أبرز استفسارات الباحثين حول استخدام المنظومة وإمكانياتها وتنسيق ملفاتها.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3 mb-16">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isOpen
                  ? 'bg-white border-teal-300 shadow-sm'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full p-5 text-right flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base cursor-pointer"
              >
                <span>{faq.q}</span>
                <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180 bg-teal-50 text-teal-800' : ''}`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-100">
                  <p className="text-xs sm:text-sm text-slate-600 font-amiri leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Need more help banner */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-7 text-center space-y-4">
        <h3 className="text-lg font-bold text-slate-900">لم تجد إجابة لسؤالك؟</h3>
        <p className="text-xs sm:text-sm text-slate-600 font-amiri max-w-md mx-auto">
          فريق الدعم الفني جاهز لمساعدتك في أي استفسار يتعلق بإعداد بحثك أو المشكلات التقنية.
        </p>
        <Link
          to="/contact"
          className="btn btn-secondary inline-flex items-center gap-2 text-xs font-bold py-2.5 px-5 border-slate-300"
        >
          <Mail className="w-4 h-4 text-teal-700" />
          <span>تواصل مع الدعم الفني</span>
        </Link>
      </div>

    </div>
  );
};

export default FAQPage;
