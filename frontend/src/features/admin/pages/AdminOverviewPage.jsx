import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  CheckCircle2,
  Download,
  Clock,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import StatCard from '../components/StatCard';
import { ResearchStatusBadge, ResearchStepBadge, ActivityActionBadge } from '../components/StatusBadge';

const AdminOverviewPage = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/stats');
      if (res.data?.success) {
        setStatsData(res.data.data);
      } else {
        throw new Error(res.data?.message || 'تعذر استرجاع إحصائيات النظام');
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError(err.response?.data?.message || err.message || 'تعذر تحميل بيانات لوحة الإدارة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getFormattedDates = () => {
    const today = new Date();
    const gregorian = today.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    try {
      const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(today);
      return { gregorian, hijri: `${hijri} هـ` };
    } catch (_) {
      return { gregorian, hijri: '15 ربيع الأول 1447 هـ' };
    }
  };

  const { gregorian: gregorianDate, hijri: hijriDate } = getFormattedDates();

  if (loading && !statsData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-white rounded-2xl border border-slate-200/80 animate-pulse shadow-xs"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-72 bg-white rounded-2xl border border-slate-200/80 animate-pulse shadow-xs"></div>
          <div className="lg:col-span-5 h-72 bg-white rounded-2xl border border-slate-200/80 animate-pulse shadow-xs"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl mx-auto flex items-center justify-center border border-rose-100">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 font-cairo">تعذر تحميل بيانات لوحة الإدارة</h3>
          <p className="text-xs text-slate-500 font-amiri mt-1">{error}</p>
        </div>
        <button
          type="button"
          onClick={fetchStats}
          className="btn btn-primary inline-flex items-center gap-2 text-xs py-2 px-4 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>إعادة المحاولة</span>
        </button>
      </div>
    );
  }

  const { stats = {}, recentResearches = [], recentActivity = [] } = statsData || {};

  return (
    <div className="space-y-6">
      {/* Compact Welcome & Date Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-cairo tracking-tight">
            لوحة التحكم والمؤشرات الإحصائية
          </h1>
          <p className="text-xs text-slate-500 font-cairo mt-0.5">
            متابعة حية وشاملة لإحصائيات المستخدمين والأبحاث وسير العمل
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 font-cairo bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
          <Calendar className="w-4 h-4 text-teal-700" />
          <span>{gregorianDate}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-normal">{hijriDate}</span>
        </div>
      </div>

      {/* 4 Compact Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المستخدمين"
          value={stats.userCount || 0}
          icon={Users}
          subtext={`منهم ${stats.activeUserCount || 0} حساب نشط مؤخراً`}
          color="teal"
          loading={loading}
        />
        <StatCard
          title="إجمالي مشاريع الأبحاث"
          value={stats.researchCount || 0}
          icon={BookOpen}
          subtext="مسجلة في قاعدة بيانات المنصة"
          color="blue"
          loading={loading}
        />
        <StatCard
          title="الأبحاث المكتملة والجاهزة"
          value={stats.completedResearchCount || 0}
          icon={CheckCircle2}
          subtext="وصلت مرحلة التصدير والطباعة A4"
          color="emerald"
          loading={loading}
        />
        <StatCard
          title="عمليات التصدير والتحميل"
          value={stats.exportsCount || 0}
          icon={Download}
          subtext={`PDF: ${stats.pdfExportsCount || 0} | Word: ${stats.docxExportsCount || 0}`}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Two Main Panels: Researches (Right, 7 cols) & Activity (Left, 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Right: Recent Researches (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-cairo">أحدث الأبحاث المسجلة</h2>
              <p className="text-[11px] text-slate-500 font-cairo mt-0.5">آخر المشاريع المضافة على المنصة</p>
            </div>
            <Link
              to="/admin/researches"
              className="text-xs text-teal-700 hover:text-teal-900 font-bold font-cairo inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors"
            >
              <span>عرض كافة الأبحاث</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {recentResearches && recentResearches.length > 0 ? (
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-500 border-b border-slate-100 font-cairo">
                    <th className="py-3 px-5 font-bold">عنوان البحث</th>
                    <th className="py-3 px-5 font-bold">الباحث / الحساب</th>
                    <th className="py-3 px-5 font-bold">المرحلة</th>
                    <th className="py-3 px-5 font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-cairo">
                  {recentResearches.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900 max-w-[200px] truncate">
                        {r.title || r.cover?.title || 'بدون عنوان'}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        <div className="font-semibold text-slate-800">{r.cover?.studentName || r.userId?.name || 'باحث'}</div>
                        <div className="text-[11px] text-slate-400 font-amiri">{r.userId?.email || '—'}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <ResearchStepBadge step={r.currentStep} />
                      </td>
                      <td className="py-3.5 px-5">
                        <ResearchStatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs font-cairo">
                لا توجد أبحاث مسجلة حتى الآن
              </div>
            )}
          </div>
        </div>

        {/* Left: Recent Activity Logs (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-cairo">سجل النشاطات الحقيقية</h2>
              <p className="text-[11px] text-slate-500 font-cairo mt-0.5">أحدث العمليات الموثقة بالنظام</p>
            </div>
            <Link
              to="/admin/activity"
              className="text-xs text-teal-700 hover:text-teal-900 font-bold font-cairo inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors"
            >
              <span>السجل الكامل</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 sm:px-6 divide-y divide-slate-100">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((log) => (
                <div key={log._id} className="py-3.5 first:pt-1 last:pb-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <ActivityActionBadge action={log.action} />
                    <span className="text-[10px] text-slate-400 font-amiri flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(log.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-cairo font-medium truncate">
                    {log.details || 'عملية نظام'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-amiri">
                    بواسطة: {log.userName || log.userEmail || 'مستخدم النظام'}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs font-cairo">
                لا توجد نشاطات مسجلة حتى الآن
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
