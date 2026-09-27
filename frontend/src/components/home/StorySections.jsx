import React from 'react';
import {
  Lightbulb,
  Sparkles,
  BookOpen,
  FileDown,
  Quote,
  CheckCircle2,
  Layers,
  PenTool,
  CheckCheck,
  GraduationCap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCMSContent } from '../../hooks/useCMSContent';

const StorySections = () => {
  const { t, i18n } = useTranslation();
  const { content, tField } = useCMSContent('home');
  const sections = content?.sections || [];

  const journeySec = sections[0] || {};
  const aiSec = sections[1] || {};
  const exportSec = sections[2] || {};

  return (
    <div className="w-full bg-white space-y-24 sm:space-y-32 py-16 sm:py-24">
      
      {/* =========================================================================
          SECTION 1: Horizontal Research Journey Process Visual
         ========================================================================= */}
      {journeySec.enabled !== false && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10 sm:space-y-12">
          
          {/* Text Header */}
          <div className="max-w-2xl mx-auto space-y-3">
            <div data-label="eyebrow" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-xs font-semibold">
              <Lightbulb className="w-3.5 h-3.5 text-teal-600" />
              <span>{tField(journeySec.label) || 'من الفكرة إلى البحث'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
              {tField(journeySec.title) || 'ابدأ بحثك من فكرة واضحة'}
            </h2>

            <p data-label="desc" className="text-base sm:text-lg text-slate-600 leading-relaxed">
              {tField(journeySec.description) || 'حوّل فكرتك إلى بحث أكاديمي منظم من خلال خطوات بسيطة وواضحة.'}
            </p>
          </div>

          {/* 5-Step Process Timeline */}
          <div className="relative pt-4 pb-2">
            <div className="hidden md:block absolute top-[44px] inset-inline-start-[8%] inset-inline-end-[8%] h-[2px] bg-gradient-to-r from-teal-200 via-teal-400 to-emerald-300 z-0" />

            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 sm:gap-4 md:gap-2">
              
              {/* Step 1 */}
              <div className="flex flex-col items-center group">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-teal-500 shadow-md shadow-teal-500/10 flex items-center justify-center text-teal-700 transition-transform group-hover:scale-105">
                  <Lightbulb className="w-7 h-7 sm:w-8 sm:h-8" />
                  <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                    01
                  </span>
                </div>
                <span className="mt-3 text-sm sm:text-base font-bold text-slate-800">
                  Concept
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center group">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-teal-200/80 shadow-xs flex items-center justify-center text-teal-700 transition-transform group-hover:scale-105">
                  <Layers className="w-7 h-7 sm:w-8 sm:h-8" />
                  <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                    02
                  </span>
                </div>
                <span className="mt-3 text-sm sm:text-base font-bold text-slate-800">
                  Structure
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center group">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-teal-200/80 shadow-xs flex items-center justify-center text-teal-700 transition-transform group-hover:scale-105">
                  <PenTool className="w-7 h-7 sm:w-8 sm:h-8" />
                  <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                    03
                  </span>
                </div>
                <span className="mt-3 text-sm sm:text-base font-bold text-slate-800">
                  Drafting
                </span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center group">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-teal-200/80 shadow-xs flex items-center justify-center text-teal-700 transition-transform group-hover:scale-105">
                  <CheckCheck className="w-7 h-7 sm:w-8 sm:h-8" />
                  <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                    04
                  </span>
                </div>
                <span className="mt-3 text-sm sm:text-base font-bold text-slate-800">
                  Review
                </span>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col items-center group col-span-2 sm:col-span-1">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-800 text-white border-2 border-teal-600 shadow-md shadow-teal-700/20 flex items-center justify-center transition-transform group-hover:scale-105">
                  <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-teal-100" />
                  <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                    05
                  </span>
                </div>
                <span className="mt-3 text-sm sm:text-base font-bold text-teal-900">
                  Thesis Ready
                </span>
              </div>

            </div>
          </div>

        </section>
      )}

      {/* =========================================================================
          SECTION 2: AI Academic Writing Interface Mockup / Text
         ========================================================================= */}
      {aiSec.enabled !== false && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            
            {/* AI Writing Interface Mockup */}
            <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
              <div className="relative w-full max-w-[460px] rounded-2xl bg-white border border-slate-200/90 shadow-lg shadow-slate-200/50 p-5 sm:p-6 space-y-4">
                
                {/* Document Header Bar */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 px-2 border-inline-start border-slate-200">
                      Chapter I — Methodology
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md">
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    <span>Academic AI</span>
                  </span>
                </div>

                {/* Document Text Body */}
                <div className="space-y-3 text-start text-slate-700 text-xs sm:text-sm leading-relaxed">
                  <p className="text-slate-500">
                    This scholarly study investigates research methodology and its foundational role in advancing academic rigor...
                  </p>

                  <div className="relative my-2 p-3 rounded-xl bg-teal-50/90 border-inline-start-4 border-teal-600 text-teal-950 font-medium">
                    <p>
                      "Assisted drafting refines hypothesis statements and aligns literature citations systematically."
                    </p>

                    <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-teal-200 shadow-2xs text-xs font-bold text-teal-800">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                      <span>Smart Tip:</span>
                      <span className="font-medium text-slate-600">Standardized footnote referencing verified</span>
                    </div>
                  </div>
                </div>

                {/* Document Footer Status */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Page 1 of 12</span>
                  <span className="text-teal-700 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Review Complete
                  </span>
                </div>

              </div>
            </div>

            {/* Text Content */}
            <div className="lg:col-span-6 text-start space-y-4 order-1 lg:order-2">
              <div data-label="eyebrow" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{tField(aiSec.label) || 'مساعدة أكاديمية ذكية'}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
                {tField(aiSec.title) || 'صياغة علمية وتوثيق دقيق'}
              </h2>

              <p data-label="desc" className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
                {tField(aiSec.description) || 'احصل على مساعدة في تنظيم الأفكار وتحسين المحتوى أثناء إعداد بحثك.'}
              </p>
            </div>

          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 3: Print Ready Export Section
         ========================================================================= */}
      {exportSec.enabled !== false && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            
            {/* Academic Illustration */}
            <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
              <div className="relative w-full max-w-[420px] rounded-3xl bg-gradient-to-tr from-indigo-50/60 via-slate-50/80 to-teal-50/50 border border-slate-200/80 p-8 shadow-xs flex items-center justify-center min-h-[260px]">
                
                <div className="absolute inset-0 bg-teal-500/5 rounded-3xl blur-xl pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                  <div className="flex items-center gap-3">
                    <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-teal-700 to-slate-900 text-white shadow-lg shadow-teal-800/20 flex items-center justify-center transform rotate-[-3deg]">
                      <FileDown className="w-9 h-9 text-teal-200" />
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-white border border-teal-100 shadow-md flex items-center justify-center text-emerald-600 transform rotate-[6deg]">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xs px-4 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="font-bold text-teal-800 text-xs bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      PDF A4
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Print-ready Standard Layout
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Text Content */}
            <div className="lg:col-span-6 text-start space-y-4 order-1 lg:order-2">
              <div data-label="eyebrow" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-xs font-semibold">
                <FileDown className="w-3.5 h-3.5 text-teal-600" />
                <span>{tField(exportSec.label) || 'تصدير PDF A4'}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
                {tField(exportSec.title) || 'تصدير جاهز للطباعة والتقديم'}
              </h2>

              <p data-label="desc" className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
                {tField(exportSec.description) || 'قم بتحميل بحثك فوراً بصيغة PDF الأكاديمية القياسية المنسقة بصفحة غلاف وهوامش رسمية وفهرس معتمد.'}
              </p>
            </div>

          </div>
        </section>
      )}

    </div>
  );
};

export default StorySections;
