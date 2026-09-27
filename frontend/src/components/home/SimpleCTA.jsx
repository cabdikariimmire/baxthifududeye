import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { ArrowLeft, UserPlus } from 'lucide-react';

const SimpleCTA = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section data-section="final-cta" className="pb-16 sm:pb-20 bg-white font-cairo" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-teal-50 via-emerald-50/60 to-teal-50 border border-teal-200/70 p-8 sm:p-10 text-center space-y-4 shadow-2xs">
          
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ابدأ بحثك الأكاديمي اليوم
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-tajawal max-w-md mx-auto leading-relaxed">
            حوّل فكرتك إلى بحث منظم بسهولة.
          </p>

          <div className="pt-2">
            <Link
              to={isAuthenticated ? "/research/new" : "/register"}
              className="btn btn-primary px-7 py-3 rounded-xl text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <span>إنشاء حساب</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};

export default SimpleCTA;
