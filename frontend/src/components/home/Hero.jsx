import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/AuthContext';
import { useCMSContent } from '../../hooks/useCMSContent';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  PlayCircle,
  GraduationCap,
  BookOpen,
  FileText
} from 'lucide-react';

const Hero = ({ onOpenHowItWorks }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const { isAuthenticated } = useAuth();
  const { content, tField } = useCMSContent('home');
  const hero = content?.hero || {};

  if (hero.enabled === false) return null;

  const label = tField(hero.label) || 'المنصة الأكاديمية الذكية للبحوث الجامعية';
  const title = tField(hero.title) || 'أنشئ بحثك الأكاديمي بسهولة';
  const highlightedTitle = tField(hero.highlightedTitle) || '';
  const description = tField(hero.description) || '';
  const primaryButtonText = tField(hero.primaryButtonText) || 'ابدأ بحثك الآن';
  const primaryButtonUrl = hero.primaryButtonUrl || (isAuthenticated ? '/research/new' : '/login?redirect=/research/new');
  const secondaryButtonText = tField(hero.secondaryButtonText) || 'شاهد كيف يعمل';

  // Clean title split around highlighted word
  const baseTitleWithoutHighlight = highlightedTitle && title.includes(highlightedTitle)
    ? title.replace(highlightedTitle, '').trim()
    : title;

  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-white via-teal-50/15 to-white flex-1 flex items-center justify-center">
      
      {/* Soft Background Radial Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Dotted Pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0f766e_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Main Copy Column */}
          <div className="lg:col-span-7 flex flex-col items-start text-start space-y-6">
            
            {/* Small Label Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>{label}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.3] tracking-tight">
              {baseTitleWithoutHighlight}{' '}
              {highlightedTitle && (
                <span className="text-teal-700 inline-block">
                  {highlightedTitle}
                </span>
              )}
            </h1>

            {/* Short Description */}
            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              {description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              {/* Primary CTA */}
              <Link
                to={primaryButtonUrl}
                className="btn btn-primary px-7 py-3 rounded-xl text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>{primaryButtonText}</span>
                <ArrowIcon className="w-4 h-4" />
              </Link>

              {/* Secondary CTA: شاهد كيف يعمل (Opens Modal) */}
              <button
                type="button"
                onClick={onOpenHowItWorks}
                className="btn btn-secondary px-6 py-3 rounded-xl text-sm sm:text-base font-semibold border-slate-300 text-slate-700 hover:text-teal-800 hover:border-teal-300 hover:bg-teal-50/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4 text-teal-700" />
                <span>{secondaryButtonText}</span>
              </button>
            </div>

          </div>

          {/* Minimal Lightweight Academic Decorative Graphic */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
              
              {/* Soft Ambient Decorative Rings */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-500/10 via-emerald-400/5 to-teal-700/10 blur-xl pointer-events-none" />
              <div className="absolute inset-4 rounded-full border border-teal-200/40 border-dashed animate-[spin_60s_linear_infinite] pointer-events-none" />
              <div className="absolute inset-12 rounded-full border border-emerald-200/30 pointer-events-none" />

              {/* Central Academic Icon Composition */}
              <div className="relative z-10 w-32 h-32 rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-teal-950 text-white flex items-center justify-center shadow-xl shadow-teal-900/20 transform rotate-[-3deg] hover:rotate-0 transition-transform duration-300">
                <GraduationCap className="w-16 h-16 text-teal-100" />
              </div>

              {/* Small Floating Satellite 1: Document */}
              <div className="absolute top-4 inset-inline-end-6 z-20 w-12 h-12 rounded-2xl bg-white border border-teal-100 shadow-md flex items-center justify-center text-teal-700 transform rotate-[8deg]">
                <FileText className="w-6 h-6" />
              </div>

              {/* Small Floating Satellite 2: Book */}
              <div className="absolute bottom-4 inset-inline-start-6 z-20 w-12 h-12 rounded-2xl bg-white border border-emerald-100 shadow-md flex items-center justify-center text-emerald-700 transform rotate-[-8deg]">
                <BookOpen className="w-6 h-6" />
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
