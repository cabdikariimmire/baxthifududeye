import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, ShieldAlert, Clock, ArrowLeft, LogIn } from 'lucide-react';

const MaintenancePage = ({ title, message, websiteName, logo, onAdminLogin }) => {
  const displayTitle = title || 'الموقع قيد الصيانة حالياً';
  const displayMessage = message || 'نعمل حالياً على إجراء بعض التحسينات الدورية والإصلاحات لتقديم تجربة بحثية أكاديمية متكاملة وسلسة. يرجى الانتظار والعودة قريباً.';
  const displayBrand = websiteName || 'مساعد البحث الأكاديمي';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B192C] via-[#0F2747] to-[#0A1628] text-white flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden font-cairo" dir="rtl">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#0F8F83]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-[#14b8a6]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / Branding */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {logo ? (
            <img src={logo} alt={displayBrand} className="w-10 h-10 object-contain rounded-lg bg-white/10 p-1" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F8F83] to-[#14b8a6] flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-[#0F8F83]/30">
              أ
            </div>
          )}
          <span className="font-bold text-lg tracking-wide text-white/90">{displayBrand}</span>
        </div>

        {/* Status pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>أعمال التحديث جارية</span>
        </div>
      </header>

      {/* Center Hero Card */}
      <main className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 text-center my-8 z-10 shadow-2xl relative">
        {/* Large Illustration / Icon Badge */}
        <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-amber-400/20 to-teal-500/20 border border-amber-400/30 flex items-center justify-center relative group">
          <Wrench className="w-12 h-12 text-amber-300 animate-bounce transition-transform" />
          <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-[#0F8F83] border-2 border-[#0B192C] flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 leading-tight">
          {displayTitle}
        </h1>

        {/* Explanation Message */}
        <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8 max-w-lg mx-auto font-tajawal">
          {displayMessage}
        </p>

        {/* Reassurance Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right mb-8">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-teal-400 font-bold">✓</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">أبحاثك ومستنداتك آمنة</h4>
              <p className="text-xs text-slate-400 font-tajawal">كافة بياناتك محفوظة ومشفرة بدقة ولن تتأثر بالتحديثات.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-amber-400 font-bold">⚡</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">عودة سريعة للخدمة</h4>
              <p className="text-xs text-slate-400 font-tajawal">فريق التطوير يعمل على استكمال الصيانة في أقرب وقت.</p>
            </div>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0F8F83] to-[#14b8a6] hover:from-[#0d7d73] hover:to-[#0f9f8f] text-white font-bold text-sm shadow-lg shadow-[#0F8F83]/25 transition-all cursor-pointer"
        >
          <Clock className="w-4 h-4" />
          <span>إعادة التحقق من حالة الموقع</span>
        </button>
      </main>

      {/* Footer & Discreet Admin Login Link */}
      <footer className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 z-10 border-t border-white/5 pt-6">
        <div>
          © {new Date().getFullYear()} {displayBrand}. جميع الحقوق محفوظة.
        </div>

        {/* Administrator portal link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>بوابة دخول المسؤولين (Admin Access)</span>
        </Link>
      </footer>
    </div>
  );
};

export default MaintenancePage;
