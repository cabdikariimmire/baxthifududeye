import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import api from '../../services/api';
import {
  User,
  Mail,
  Calendar,
  Shield,
  KeyRound,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  LayoutDashboard,
  Loader2,
  Lock
} from 'lucide-react';

const AccountPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword) {
      setPasswordError('يرجى ملء جميع حقول كلمة المرور');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين');
      return;
    }

    try {
      setSubmittingPassword(true);
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setPasswordSuccess(res.data?.message || 'تم تحديث كلمة المرور بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'فشل تحديث كلمة المرور');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'غير متوفر';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-cairo" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-200/80">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 flex items-center justify-center text-white shadow-lg shadow-teal-800/20">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              الملف الأكاديمي
            </h1>
            <p className="text-sm text-slate-500 font-amiri mt-0.5">
              إدارة بيانات الحساب وإعدادات الأمان الشخصية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/dashboard"
            className="btn btn-secondary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2 border-slate-300"
          >
            <LayoutDashboard className="w-4 h-4 text-teal-700" />
            <span>لوحة بحوثي</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="btn py-2.5 px-4 text-xs sm:text-sm bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5 font-bold"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-8">
        {/* Left Column: Account Details (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-teal-700" />
              <span>البيانات الأساسية</span>
            </h2>

            {/* Name */}
            <div className="flex items-start justify-between py-2 border-b border-slate-50">
              <span className="text-xs font-semibold text-slate-500">اسم الباحث</span>
              <span className="text-sm font-bold text-slate-900">{user?.name || 'غير محدد'}</span>
            </div>

            {/* Email */}
            <div className="flex items-start justify-between py-2 border-b border-slate-50">
              <span className="text-xs font-semibold text-slate-500">البريد الإلكتروني</span>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-medium text-slate-900 font-mono dir-ltr">{user?.email}</span>
                {user?.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>بريد إلكتروني مفعّل</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Clock className="w-3 h-3" />
                    <span>بانتظار التفعيل</span>
                  </span>
                )}
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start justify-between py-2 border-b border-slate-50">
              <span className="text-xs font-semibold text-slate-500">نوع الحساب</span>
              <div>
                {user?.role === 'admin' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    <span>مدير النظام الأكاديمي</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                    <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                    <span>باحث أكاديمي</span>
                  </span>
                )}
              </div>
            </div>

            {/* Registered At */}
            <div className="flex items-start justify-between py-2">
              <span className="text-xs font-semibold text-slate-500">تاريخ الانضمام</span>
              <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formattedDate}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Change Password (5 cols) */}
        <div className="md:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <KeyRound className="w-5 h-5 text-teal-700" />
              <span>تغيير كلمة المرور</span>
            </h2>

            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  كلمة المرور الحالية
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-300 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 text-slate-900 text-xs outline-none transition-all placeholder:text-slate-400 placeholder:text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-300 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 text-slate-900 text-xs outline-none transition-all placeholder:text-slate-400 placeholder:text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تأكيد كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-300 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 text-slate-900 text-xs outline-none transition-all placeholder:text-slate-400 placeholder:text-right"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingPassword}
                className="w-full btn btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2"
              >
                {submittingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التحديث...</span>
                  </>
                ) : (
                  <span>تحديث كلمة المرور</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
