import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/AuthContext';
import { useCMSContent } from '../../hooks/useCMSContent';
import Footer from '../../components/common/Footer';
import {
  FileEdit,
  Sparkles,
  LayoutTemplate,
  BookOpen,
  FileDown,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  BookMarked,
  Clock
} from 'lucide-react';

const iconMap = {
  FileEdit,
  Sparkles,
  LayoutTemplate,
  BookOpen,
  FileDown,
  ShieldCheck,
  Clock,
  BookMarked
};

const FeaturesPage = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const { isAuthenticated } = useAuth();
  const { content: cmsFeatures, tField } = useCMSContent('features');

  const pageBadge = tField(cmsFeatures?.badge) || t('nav.featuresPage');
  const pageTitle = tField(cmsFeatures?.title) || 'Academic & Technical Features';
  const pageDesc = tField(cmsFeatures?.description) || '';

  const featuresList = (cmsFeatures?.features || []).map((f, idx) => {
    const IconComp = (f.icon && iconMap[f.icon]) ? iconMap[f.icon] : [FileEdit, Sparkles, LayoutTemplate, BookOpen, FileDown, ShieldCheck][idx % 6];
    const pastelBgs = [
      'bg-teal-50 text-teal-700 border border-teal-100/80',
      'bg-emerald-50 text-emerald-700 border border-emerald-100/80',
      'bg-blue-50 text-blue-700 border border-blue-100/80',
      'bg-amber-50 text-amber-700 border border-amber-100/80',
      'bg-indigo-50 text-indigo-700 border border-indigo-100/80',
      'bg-teal-50 text-teal-800 border border-teal-100/80'
    ];
    return {
      id: f.id || `f-${idx}`,
      title: tField(f.title),
      desc: tField(f.description),
      icon: IconComp,
      pastelBg: pastelBgs[idx % pastelBgs.length],
      linkTarget: isAuthenticated ? '/research/new' : '/how-it-works'
    };
  });

  return (
    <div className="w-full text-slate-900 bg-white selection:bg-teal-100 selection:text-teal-900 flex flex-col min-h-[calc(100vh-72px)]">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-20 bg-gradient-to-b from-white via-teal-50/20 to-white border-b border-slate-200/60">
        
        {/* Soft Ambient Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[300px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Center Hero Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-4">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>{pageBadge}</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.3] tracking-tight">
            {pageTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {pageDesc}
          </p>

        </div>
      </section>

      {/* FEATURE GRID SECTION */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {featuresList.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-teal-200 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Pastel Rounded Square Icon */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform ${feature.pastelBg}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-teal-900 transition-colors leading-snug">
                      {feature.title}
                    </h3>

                    {/* Short Description */}
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>

                  {/* Bottom Link */}
                  <div className="pt-6 mt-2 border-t border-slate-100">
                    <Link
                      to={feature.linkTarget}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-900 transition-all"
                    >
                      <span>{t('common.viewDetails')}</span>
                      <ArrowIcon className="w-3.5 h-3.5 text-teal-600" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* CTA BANNER */}
      <section className="pb-16 sm:pb-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-50 via-emerald-50/60 to-teal-50 border border-teal-200/80 p-8 sm:p-12 shadow-sm">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              
              <div className="lg:col-span-8 text-start space-y-3">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {t('dashboard.kpi.research')}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
                  {t('common.appSubtitle')}
                </p>
                <div className="pt-3">
                  <Link
                    to={isAuthenticated ? "/research/new" : "/register"}
                    className="btn btn-primary px-7 py-3 rounded-xl text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
                  >
                    <span>{t('common.register')}</span>
                    <ArrowIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-4 flex justify-center lg:justify-start">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/90 border border-teal-200/80 flex items-center justify-center text-teal-800 shadow-sm shadow-teal-700/10">
                  <GraduationCap className="w-12 h-12 text-teal-700" />
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <Footer />

    </div>
  );
};

export default FeaturesPage;
