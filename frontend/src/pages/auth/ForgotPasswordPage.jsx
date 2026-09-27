import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { BookOpen, KeyRound, Mail, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني المسجل');
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      setErrorMessage('تعذر إرسال رابط الاستعادة، يرجى المحاولة لاحقاً');
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
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            استعادة كلمة المرور
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-amiri">
            أدخل بريدك الإلكتروني لتلقي رابط آمن لإعادة تعيين كلمة المرور
          </p>
        </div>

        {/* Box */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-7 sm:p-8">
          {submitted ? (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center ring-8 ring-emerald-50/50">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">تم إرسال الرابط</h3>
                <p className="text-sm text-slate-600 font-amiri leading-relaxed">
                  إذا كان البريد الإلكتروني{' '}
                  <strong className="font-semibold text-slate-900 dir-ltr inline-block">{email}</strong>{' '}
                  مسجلاً لدينا، فستصلك رسالة تحتوي على رابط صالح لمدة ساعة واحدة لتعيين كلمة مرور جديدة.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="btn btn-secondary w-full py-3 text-sm font-semibold border-slate-300 flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>العودة إلى تسجيل الدخول</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    البريد الإلكتروني المسجل
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="scholar@university.edu"
                      required
                      autoComplete="email"
                      dir="ltr"
                      className="w-full pr-10 pl-3.5 py-3 rounded-xl border border-slate-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 placeholder:text-right"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-primary py-3.5 text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-700/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جاري إرسال الرابط...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-5 h-5" />
                      <span>إرسال رابط استعادة كلمة المرور</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <Link
                  to="/login"
                  className="text-xs font-bold text-teal-800 hover:text-teal-950 inline-flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>تذكرت كلمة المرور؟ تسجيل الدخول</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
