import React, { useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
  LayoutDashboard,
  Users,
  Settings,
  ShieldCheck,
  Globe,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  AlertTriangle
} from 'lucide-react';

const AdminLayout = ({ children, maintenanceActive = false }) => {
  const { user, isSuperAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Exactly 3 main menu items per requirements
  const navItems = [
    {
      to: '/admin',
      end: true,
      label: 'لوحة التحكم',
      subtitle: 'نظرة عامة وإحصائيات',
      icon: LayoutDashboard
    },
    {
      to: '/admin/users',
      label: 'إدارة المستخدمين',
      subtitle: 'المستخدمون والأدوار والصلاحيات',
      icon: Users
    },
    {
      to: '/admin/settings',
      label: 'الإعدادات',
      subtitle: 'الهوية والمحتوى والصيانة',
      icon: Settings
    }
  ];

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return { label: 'مدير عام', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'admin':
        return { label: 'مسؤول', bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20' };
      case 'editor':
        return { label: 'محرر', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      default:
        return { label: 'مستخدم', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-cairo text-slate-800" dir="rtl">
      {/* 1. Maintenance Mode Notice Banner (If active, visible to administrators) */}
      {maintenanceActive && (
        <div className="bg-amber-500 text-slate-900 px-4 py-2 text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0 animate-pulse" />
            <span>تنبيه: وضع الصيانة مفعّل حالياً للموقع العام — يتلقى الزوار صفحة الصيانة بينما يمكنك أنت الإدارة بحرية.</span>
          </div>
          <Link
            to="/admin/settings?tab=maintenance"
            className="bg-slate-900 hover:bg-slate-800 text-amber-300 px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 mr-2"
          >
            إدارة الصيانة
          </Link>
        </div>
      )}

      <div className="flex flex-1 relative overflow-hidden">
        {/* 2. Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 xl:w-72 bg-[#0B192C] text-white flex-col justify-between shrink-0 border-l border-slate-800/80 shadow-xl z-30">
          {/* Top Logo & App Title */}
          <div>
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <Link to="/admin" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F8F83] to-[#14b8a6] flex items-center justify-center font-black text-xl text-white shadow-lg shadow-[#0F8F83]/30 group-hover:scale-105 transition-transform">
                  ب
                </div>
                <div>
                  <h1 className="font-extrabold text-base text-white tracking-wide leading-none">لوحة الإدارة</h1>
                  <span className="text-[11px] text-teal-400 font-medium font-tajawal">مساعد البحث الأكاديمي</span>
                </div>
              </Link>
            </div>

            {/* Exactly 3 Top-Level Menus */}
            <nav className="p-4 space-y-2">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                القوائم الرئيسية
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.end
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all font-semibold text-sm group ${
                      isActive
                        ? 'bg-[#0F8F83] text-white shadow-lg shadow-[#0F8F83]/25 font-bold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'
                    }`} />
                    <div className="flex-1 text-right">
                      <div className="leading-tight">{item.label}</div>
                      <div className={`text-[11px] font-normal font-tajawal ${
                        isActive ? 'text-teal-100' : 'text-slate-400'
                      }`}>
                        {item.subtitle}
                      </div>
                    </div>
                    {isActive && <ChevronLeft className="w-4 h-4 text-teal-200" />}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Bottom User Area */}
          <div className="p-4 border-t border-white/5 bg-black/15">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center font-bold text-teal-400 text-sm shrink-0">
                {user?.name ? user.name.slice(0, 2) : 'مد'}
              </div>
              <div className="flex-1 min-w-0 text-right">
                <div className="font-bold text-xs text-white truncate">{user?.name || 'مدير النظام'}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleInfo.bg}`}>
                  {roleInfo.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all border border-white/5"
                title="الذهاب إلى لوحة أبحاث الباحث"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>موقع الباحث</span>
              </Link>
              <button
                onClick={() => logout()}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-all border border-rose-500/10 cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </aside>

        {/* 3. Mobile Header & Off-Canvas Drawer */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0B192C] text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
              aria-label="القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-extrabold text-sm text-white">لوحة الإدارة</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleInfo.bg}`}>
              {roleInfo.label}
            </span>
            <Link
              to="/dashboard"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Mobile Backdrop & Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-4/5 max-w-xs bg-[#0B192C] text-white flex flex-col justify-between p-6 shadow-2xl z-10">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#0F8F83] flex items-center justify-center font-black text-white text-base">
                      ب
                    </div>
                    <div>
                      <h2 className="font-bold text-sm text-white">لوحة الإدارة</h2>
                      <span className="text-[10px] text-teal-400">مساعد البحث</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.end
                      ? location.pathname === item.to
                      : location.pathname.startsWith(item.to);

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
                          isActive
                            ? 'bg-[#0F8F83] text-white font-bold'
                            : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-3">
                <div className="text-xs text-slate-400 truncate">{user?.name} ({roleInfo.label})</div>
                <div className="flex gap-2">
                  <Link
                    to="/dashboard"
                    className="flex-1 text-center py-2 px-3 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-white font-medium"
                  >
                    موقع الباحث
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="flex-1 text-center py-2 px-3 rounded-lg text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-medium"
                  >
                    خروج
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Main Body Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Header Spacer for mobile fixed bar */}
          <div className="lg:hidden h-14" />

          {/* Main workspace */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
