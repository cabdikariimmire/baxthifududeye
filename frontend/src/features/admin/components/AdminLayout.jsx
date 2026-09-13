import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-cairo text-slate-800 antialiased" dir="rtl">
      {/* Mobile Floating Menu Button */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-3 right-3 z-40 p-2 rounded-xl bg-white shadow-md border border-slate-200 text-slate-700 hover:text-teal-700 transition-colors"
        title="القائمة"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className="admin-main-content">
        {/* Page Content */}
        <main className="admin-page-container space-y-6">
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="mt-auto py-5 px-6 text-xs text-slate-400 font-cairo flex items-center justify-between border-t border-slate-200/60 bg-transparent">
          <div>جميع الحقوق محفوظة © 2025 بوابة الإدارة الأكاديمية</div>
          <div>الإصدار 1.0.0</div>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
