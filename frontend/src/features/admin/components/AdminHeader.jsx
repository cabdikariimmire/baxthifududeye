import React from 'react';
import { Menu, Shield, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { Link } from 'react-router-dom';

const AdminHeader = ({ onToggleSidebar, title, subtitle }) => {
  const { user, logout } = useAuth();

  return (
    <header className="admin-header transition-shadow">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 font-cairo leading-tight tracking-tight">
              {title || 'لوحة التحكم الإدارية'}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 font-cairo hidden sm:block mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Admin Profile & Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/dashboard"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-cairo text-slate-600 hover:text-teal-800 border border-slate-200 rounded-xl hover:bg-teal-50/50 hover:border-teal-200 transition-all shadow-2xs"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180 text-teal-600" />
            <span>منصة الأبحاث</span>
          </Link>

          {/* Admin User Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50/90 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              {user?.name ? user.name.charAt(0) : <Shield className="w-3.5 h-3.5" />}
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 font-cairo truncate max-w-[120px] leading-tight">
                {user?.name || 'مدير النظام'}
              </div>
              <div className="text-[10px] text-amber-700 font-bold font-cairo leading-tight">
                مسؤول معتمد
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
