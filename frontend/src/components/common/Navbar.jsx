import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import {
  BookOpen,
  Shield,
  PlusCircle,
  LayoutDashboard,
  User
} from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <header className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-3 group transition-transform">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-700 to-teal-900 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition-all">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base sm:text-lg text-slate-900 leading-tight font-cairo">
              مساعد البحث الأكاديمي
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              منظومة توليد وتنسيق المستندات الجامعية A4
            </span>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 font-cairo">
          <Link
            to="/dashboard"
            className={`btn btn-secondary text-xs sm:text-sm py-2 px-3 sm:px-4 ${
              location.pathname === '/dashboard'
                ? 'bg-slate-100 text-teal-900 font-bold border-slate-300'
                : ''
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-teal-700" />
            <span className="hidden sm:inline">لوحة بحوثي</span>
          </Link>

          <Link
            to="/research/new"
            className="btn btn-primary text-xs sm:text-sm py-2 px-3 sm:px-4"
          >
            <PlusCircle className="w-4 h-4" />
            <span>بحث جديد</span>
          </Link>

          <Link
            to="/admin"
            className={`btn text-xs sm:text-sm py-2 px-3 sm:px-4 ${
              location.pathname.startsWith('/admin')
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-600" />
            <span className="hidden md:inline">لوحة الإدارة</span>
          </Link>

          {/* User Badge */}
          <div className="flex items-center gap-2 pr-2 border-r border-slate-200 mr-1 sm:mr-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200">
              <User className="w-3.5 h-3.5 text-teal-700" />
              <span className="max-w-[120px] truncate">{user?.name || 'باحث أكاديمي'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
