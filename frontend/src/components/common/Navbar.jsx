import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Show, UserButton } from '@clerk/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/AuthContext';
import { useCMSContent } from '../../hooks/useCMSContent';
import LanguageSwitcher from './LanguageSwitcher';
import {
  GraduationCap,
  LayoutDashboard,
  PlusCircle,
  Menu,
  X,
  LogIn,
  UserPlus,
  ShieldCheck
} from 'lucide-react';

const Navbar = () => {
  const { t } = useTranslation();
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { content: navContent, tField } = useCMSContent('navigation');
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const websiteName = tField(navContent?.websiteName) || t('common.appName');
  const subtitle = tField(navContent?.subtitle) || t('common.appSubtitle');
  const loginText = tField(navContent?.loginButtonText) || t('common.login');
  const registerText = tField(navContent?.registerButtonText) || t('common.register');

  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-3 group transition-transform shrink-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-teal-700 via-teal-800 to-teal-950 flex items-center justify-center text-white shadow-sm shadow-teal-700/20 group-hover:scale-105 transition-all">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight tracking-tight">
              {websiteName}
            </span>
            <span className="text-[11px] text-teal-800 font-medium">
              {subtitle}
            </span>
          </div>
        </Link>

        {/* Account / Auth Controls & Language Switcher */}
        <div className="hidden sm:flex items-center gap-2.5 lg:gap-3 flex-shrink-0">
          {/* Language Switcher */}
          <LanguageSwitcher />

          <Show when="signed-in">
            {/* Elevated Admin Dashboard Link */}
            {(isAdmin || isSuperAdmin || user?.role === 'editor') && (
              <Link
                to="/admin"
                className={`text-xs lg:text-sm font-bold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-[#0B192C] text-white shadow-xs'
                    : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/80'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>لوحة الإدارة</span>
              </Link>
            )}

            {/* Dashboard Link */}
            <Link
              to="/dashboard"
              className={`text-xs lg:text-sm font-semibold py-2 px-3 rounded-xl transition-colors ${
                location.pathname === '/dashboard'
                  ? 'bg-slate-100 text-teal-900 font-bold'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              <span>{t('nav.dashboard')}</span>
            </Link>

            {/* New Research CTA */}
            <Link
              to="/research/new"
              className="btn btn-primary text-xs lg:text-sm py-2 px-3.5 flex items-center gap-1.5 shadow-2xs hover:shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('dashboard.kpi.research')}</span>
            </Link>

            {/* Clerk Official UserButton */}
            <div className="flex items-center pr-1">
              <UserButton afterSignOutUrl="/" />
            </div>
          </Show>

          <Show when="signed-out">
            <Link
              to="/login"
              className="text-xs lg:text-sm font-bold text-slate-700 hover:text-teal-900 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <span>{loginText || 'تسجيل الدخول'}</span>
            </Link>

            <Link
              to="/register"
              className="btn btn-primary text-xs lg:text-sm py-2 px-4 shadow-2xs hover:shadow-sm transition-all"
            >
              <span>{registerText || 'إنشاء حساب'}</span>
            </Link>
          </Show>
        </div>

        {/* Mobile Hamburger Toggle & Language Switcher */}
        <div className="sm:hidden flex items-center gap-2">
          <LanguageSwitcher />

          <Show when="signed-in">
            <UserButton afterSignOutUrl="/" />
          </Show>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            title="Menu"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 shadow-lg">
          <div className="flex flex-col gap-2">
            <Show when="signed-in">
              {(isAdmin || isSuperAdmin || user?.role === 'editor') && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn bg-[#0B192C] text-white hover:bg-slate-900 w-full py-2.5 text-sm flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>لوحة الإدارة</span>
                </Link>
              )}

              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-secondary w-full py-2.5 text-sm flex items-center justify-center gap-2 border-slate-300"
              >
                <LayoutDashboard className="w-4 h-4 text-teal-700" />
                <span>{t('nav.dashboard')}</span>
              </Link>

              <Link
                to="/research/new"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('dashboard.kpi.research')}</span>
              </Link>
            </Show>

            <Show when="signed-out">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-secondary w-full py-2.5 text-sm flex items-center justify-center gap-2 border-slate-300"
              >
                <LogIn className="w-4 h-4 text-slate-500" />
                <span>{loginText || 'تسجيل الدخول'}</span>
              </Link>

              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{registerText || 'إنشاء حساب'}</span>
              </Link>
            </Show>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
