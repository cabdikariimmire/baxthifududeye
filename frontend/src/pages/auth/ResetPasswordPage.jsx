import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { BookOpen, Lock, ShieldCheck, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token) {
      setErrorMessage('رمز إعادة تعيين كلمة المرور غير موجود أو غير صالح');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(token, password);
      setResetSuccess(true);
    } catch (err) {
      const resp = err.response?.data;
      setErrorMessage(resp?.message || 'فشل إعادة تعيين كلمة المرور. قد يكون الرابط منتهي الصلاحية.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 font-cairo" dir="rtl">
      <div className="w-full max-w-md">
        {/* Header Card */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-700 to-teal-950 items-center justify-center text-white shadow-lg shadow-teal-800/20 mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            إعادة تعيين كلمة المرور
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-amiri">
            أدخل كلمة المرور الجديدة لحسابك الأكاديمي
          </p>
        </div>

        {/* Box */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-7 sm:p-8">
          {resetSuccess ? (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center ring-8 ring-emerald-50/50">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">تم تحديث كلمة المرور!</h3>
                <p className="text-sm text-slate-600 font-amiri leading-relaxed">
                  تم تغيير كلمة المرور الخاصة بحسابك بنجاح. يمكنك الآن المتابعة وتسجيل الدخول ببياناتك الجديدة.
                </p>
              </div>
              <div className="pt-3">
                <Link
                  to="/login"
                  className="btn btn-primary w-full py-3.5 text-base font-bold flex items-center justify-center gap-2"
                >
                  <span>تسجيل الدخول الآن</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {!token && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span>تنبيه: لم يتم العثور على رمز الاستعادة في الرابط.</span>
                    <div className="mt-2">
                      <Link to="/forgot-password" className="font-bold underline text-amber-900">
                        طلب رابط استعادة جديد
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    كلمة المرور الجديدة (٨ أحرف على الأقل)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      dir="ltr"
                      disabled={!token}
                      className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 placeholder:text-right disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      dir="ltr"
                      disabled={!token}
                      className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 placeholder:text-right disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full btn btn-primary py-3.5 text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-700/20 mt-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جاري حفظ كلمة المرور...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>تحديث كلمة المرور</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <Link
                  to="/login"
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                >
                  العودة إلى صفحة تسجيل الدخول
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
