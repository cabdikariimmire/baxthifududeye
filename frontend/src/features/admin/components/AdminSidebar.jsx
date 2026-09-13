import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  BookOpen,
  Activity,
  FileText,
  Settings,
  LogOut,
  X,
  Shield,
  ChevronLeft
} from 'lucide-react';

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const navItems = [
    { to: '/admin', end: true, icon: Home, label: 'لوحة التحكم' },
    { to: '/admin/users', end: false, icon: Users, label: 'المستخدمون' },
    { to: '/admin/researches', end: false, icon: BookOpen, label: 'الأبحاث' },
    { to: '/admin/activity', end: false, icon: Activity, label: 'الأنشطة' },
    { to: '/admin/reports', end: false, icon: FileText, label: 'التقارير' },
    { to: '/admin/settings', end: false, icon: Settings, label: 'إعدادات النظام' }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-64 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
        style={{
          background: 'linear-gradient(175deg, #042f2e 0%, #021d1c 50%, #011413 100%)',
          borderLeft: '1px solid rgba(20, 184, 166, 0.12)',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* ═══════════════════════════════════════════════
            ZONE 1 — BRAND HEADER
            ═══════════════════════════════════════════════ */}
        <div className="relative px-5 pt-5 pb-4">
          {/* Mobile Close */}
          <div className="sidebar-mobile-close absolute top-3 left-3 lg:hidden">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-teal-800/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                boxShadow: '0 2px 8px rgba(20, 184, 166, 0.3)'
              }}
            >
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white font-cairo leading-tight truncate">
                بوابة الإدارة
              </h2>
              <p className="text-[10px] text-teal-400/70 font-cairo mt-0.5">
                لوحة التحكم الأكاديمية
              </p>
            </div>
          </div>

          {/* Separator */}
          <div className="mt-4 h-px bg-gradient-to-l from-transparent via-teal-600/25 to-transparent"></div>
        </div>

        {/* ═══════════════════════════════════════════════
            ZONE 2 — NAVIGATION
            ═══════════════════════════════════════════════ */}
        <nav className="flex-1 px-3 pb-2 space-y-0.5 overflow-y-auto sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-cairo text-[13px] font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-teal-600/20 text-teal-200 sidebar-active-item'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active Indicator Bar */}
                    {isActive && (
                      <span
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full"
                        style={{
                          background: 'linear-gradient(180deg, #14b8a6 0%, #0f766e 100%)',
                          boxShadow: '0 0 6px rgba(20, 184, 166, 0.4)'
                        }}
                      ></span>
                    )}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 ${
                        isActive
                          ? 'bg-teal-500/15 text-teal-300'
                          : 'bg-white/[0.03] text-slate-500 group-hover:bg-white/[0.06] group-hover:text-slate-300'
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                    </div>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ═══════════════════════════════════════════════
            ZONE 3 — BOTTOM: DECORATION + EXIT
            ═══════════════════════════════════════════════ */}
        <div className="mt-auto">
          {/* Subtle Islamic Watermark + Verse */}
          <div className="relative px-5 py-4 flex flex-col items-center text-center select-none pointer-events-none overflow-hidden">
            {/* Arch Watermark — very subtle */}
            <svg
              className="w-28 h-20 opacity-[0.08] text-teal-300 mb-1.5"
              viewBox="0 0 200 160"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M20 160 V70 Q20 30 100 10 Q180 30 180 70 V160" />
              <path d="M40 160 V80 Q40 50 100 30 Q160 50 160 80 V160" />
              <path d="M60 160 V90 Q60 65 100 50 Q140 65 140 90 V160" />
              <circle cx="100" cy="15" r="4" fill="currentColor" />
              <path d="M100 5 V15" strokeWidth="2" />
            </svg>

            {/* Quranic Verse */}
            <div className="font-amiri text-[13px] font-bold text-teal-300/50 tracking-wide leading-relaxed">
              « وقل رب زدني علماً »
            </div>
            <div className="w-8 h-px bg-teal-500/20 rounded-full mt-2"></div>
          </div>

          {/* Exit / Return Link */}
          <div className="px-3 pb-3">
            <Link
              to="/dashboard"
              className="group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-cairo transition-all duration-150 text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent hover:border-teal-800/30"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.03] group-hover:bg-white/[0.06] transition-colors">
                  <LogOut className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold">العودة لمنصة الباحث</span>
              </div>
              <ChevronLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-70 transition-opacity -translate-x-1 group-hover:translate-x-0 duration-200" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
