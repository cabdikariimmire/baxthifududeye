import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

const AdminRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isAdmin, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Allowed elevated roles: super_admin, admin, editor
  const isElevated = isSuperAdmin || isAdmin || user?.role === 'editor';

  if (!isElevated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-cairo" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-2">صلاحيات غير كافية</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed font-tajawal">
            عذراً، يتطلب الوصول إلى لوحة الإدارة حساباً بصلاحيات إدارية (مدير عام، مسؤول، أو محرر).
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F8F83] hover:bg-[#0d7b70] text-white font-bold text-sm transition-all"
            >
              <Home className="w-4 h-4" />
              <span>العودة إلى لوحة أبحاثي</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (requiredRole === 'super_admin' && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-cairo" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-2">مطلوب صلاحية مدير عام</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed font-tajawal">
            يتطلب هذا الإجراء صلاحيات مدير النظام الكاملة (Super Admin).
          </p>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F8F83] hover:bg-[#0d7b70] text-white font-bold text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة للوحة الإدارة</span>
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
