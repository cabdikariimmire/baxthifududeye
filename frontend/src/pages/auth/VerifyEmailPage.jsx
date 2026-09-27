import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { MailCheck, Mail, CheckCircle2, AlertCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token') || '';
  const initialEmail = searchParams.get('email') || '';

  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();

  const [token, setToken] = useState(urlToken);
  const [email, setEmail] = useState(initialEmail);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (urlToken && !verified && !errorMessage) {
      handleAutoVerify(urlToken);
    }
  }, [urlToken]);

  const handleAutoVerify = async (tok) => {
    setVerifying(true);
    setErrorMessage('');
    try {
      await verifyEmail(tok);
      setVerified(true);
    } catch (err) {
      const resp = err.response?.data;
      setErrorMessage(resp?.message || 'رمز التفعيل غير صالح أو منتهي الصلاحية');
    } finally {
      setVerifying(false);
    }
  };

  const handleManualVerify = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setErrorMessage('يرجى إدخال رمز التفعيل');
      return;
    }
    handleAutoVerify(token.trim());
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setResendSuccess('');

    if (!email.trim()) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني لإعادة إرسال رابط التفعيل');
      return;
    }

    try {
      setResending(true);
      const res = await resendVerification(email.trim());
      setResendSuccess(res?.message || 'تم إرسال رابط التفعيل الجديد بنجاح إلى بريدك الإلكتروني');
    } catch (err) {
      setErrorMessage('تعذر إرسال رابط التفعيل، يرجى المحاولة لاحقاً');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 font-cairo" dir="rtl">
      <div className="w-full max-w-md">
        {/* Header Card */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-700 to-teal-950 items-center justify-center text-white shadow-lg shadow-teal-800/20 mb-4">
            <MailCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            تفعيل البريد الإلكتروني
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-amiri">
            تأكيد ملكية الحساب الأكاديمي للوصول الكامل إلى خدمات المنصة
          </p>
        </div>

        {/* Box */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-7 sm:p-8">
          {verifying ? (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-teal-700 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">جاري التحقق من رمز التفعيل...</h3>
              <p className="text-xs text-slate-500 font-amiri">يرجى الانتظار بضع ثوانٍ لتأكيد حسابك الأكاديمي</p>
            </div>
          ) : verified ? (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center ring-8 ring-emerald-50/50">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">تم تفعيل حسابك بنجاح!</h3>
                <p className="text-sm text-slate-600 font-amiri leading-relaxed">
                  أهلاً بك باحثنا الفاضل. تم تفعيل بريدك الإلكتروني وتسجيل دخولك تلقائياً. يمكنك الآن البدء في إعداد أبحاثك.
                </p>
              </div>
              <div className="pt-3 space-y-3">
                <Link
                  to="/dashboard"
                  className="btn btn-primary w-full py-3.5 text-base font-bold flex items-center justify-center gap-2"
                >
                  <span>الانتقال للوحة بحوثي</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <Link
                  to="/research/new"
                  className="btn btn-secondary w-full py-3 text-sm font-semibold border-slate-300"
                >
                  <span>بدء بحث جديد الآن</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {resendSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{resendSuccess}</span>
                </div>
              )}

              {/* Manual Token Verification Form */}
              <form onSubmit={handleManualVerify} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    أدخل رمز التفعيل (إن وجد)
                  </label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="مثال: e494f0de0ece..."
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 text-slate-900 text-sm font-mono outline-none transition-all placeholder:text-slate-400 placeholder:font-cairo"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifying || !token.trim()}
                  className="w-full btn btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد الرمز</span>
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-semibold">أو إعادة إرسال الرابط</span>
                </div>
              </div>

              {/* Resend Verification Link */}
              <form onSubmit={handleResend} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    البريد الإلكتروني لإعادة الإرسال
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
                      dir="ltr"
                      className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 placeholder:text-right"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resending}
                  className="w-full btn btn-secondary py-3 text-sm font-semibold border-slate-300 flex items-center justify-center gap-2"
                >
                  {resending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال الرابط...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 text-teal-700" />
                      <span>إعادة إرسال رابط التفعيل</span>
                    </>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 text-center">
                <Link to="/login" className="text-xs text-slate-600 hover:text-slate-900 font-semibold">
                  العودة إلى تسجيل الدخول
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
