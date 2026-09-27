import React, { useState } from 'react';
import api from '../../services/api';
import {
  Mail,
  User,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Shield
} from 'lucide-react';

const ContactPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMessage('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    if (message.trim().length < 10) {
      setErrorMessage('يرجى كتابة رسالة توضيحية لا تقل عن ١٠ أحرف');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/public/contact', {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim()
      });

      setSuccessMessage(res.data?.message || 'تم إرسال رسالتك بنجاح. شكراً لتواصلك معنا.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      const resp = err.response?.data;
      setErrorMessage(resp?.message || 'تعذر إرسال الرسالة، يرجى المحاولة في وقت لاحق');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 font-cairo" dir="rtl">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-100/70 text-teal-900">
          تواصل معنا
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
          يسعدنا الاستماع إليك
        </h1>
        <p className="text-base text-slate-600 font-amiri leading-relaxed">
          لديك استفسار حول استخدام المنصة، اقتراح لتطوير الأدوات، أو ترغب في تنسيق شراكة أكاديمية؟ لا تتردد في مراسلتنا.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Contact Info / Side Notes (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              معلومات الدعم الأكاديمي
            </h3>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 font-amiri">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-slate-900 font-cairo font-bold">أوقات المراجعة والرد</strong>
                  <span>يتم الرد على كافة الاستفسارات الأكاديمية والتقنية خلال ٢٤ إلى ٤٨ ساعة عمل.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-slate-900 font-cairo font-bold">خصوصية الباحثين</strong>
                  <span>بياناتك ومحتوى استفسارك محمية بالكامل ولا يتم مشاركتها مع أي جهة خارجية.</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 font-amiri leading-relaxed">
              إذا كان لديك استفسار عاجل متعلق بتفعيل الحساب أو استعادة كلمة المرور، يرجى مراجعة صفحة الأسئلة الشائعة أولاً.
            </div>
          </div>
        </div>

        {/* Form Box (7 cols) */}
        <div className="md:col-span-7 bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-sm">
          {successMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الاسم الكريم
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="محمد عبد الله"
                  required
                  className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                البريد الإلكتروني للرد
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

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                موضوع الرسالة
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="مثال: استفسار عن تنسيق الحواشي / اقتراح ميزة"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تفاصيل الرسالة
              </label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب تفاصيل استفسارك أو ملاحظاتك هنا..."
                required
                className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 font-amiri leading-relaxed"
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-700/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري إرسال الرسالة...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>إرسال الرسالة</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default ContactPage;
