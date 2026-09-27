import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import {
  Users,
  UserCheck,
  BookOpen,
  FileCheck2,
  FileDown,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const CountUpNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10) || 0;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 800; // ms
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = Math.ceil(end / steps);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue.toLocaleString('ar-SA')}</span>;
};

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, borderClass, bgIconClass }) => {
  return (
    <div className={`bg-white rounded-2xl p-6 border ${borderClass} shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{title}</span>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            <CountUpNumber value={value} />
          </div>
          {subtitle && (
            <span className="text-[12px] text-slate-500 mt-1 block font-tajawal">{subtitle}</span>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl ${bgIconClass} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-xs`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1 text-emerald-600 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          بيانات موثوقة
        </span>
        <span className="font-tajawal text-[11px]">محدّث لحظياً</span>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/admin/dashboard');
      if (res.data?.success) {
        setData(res.data.data);
        setError(null);
      } else {
        setError('تعذر تحميل بيانات لوحة الإدارة');
      }
    } catch (err) {
      console.error('Admin dashboard fetch error:', err);
      setError(err.friendlyMessage || 'فشل الاتصال بالخادم لجلب الإحصائيات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = data?.stats || {
    userCount: 0,
    activeUserCount: 0,
    researchCount: 0,
    completedResearchCount: 0,
    pdfExportsCount: 0
  };

  const completedRatio = stats.researchCount > 0
    ? Math.round((stats.completedResearchCount / stats.researchCount) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">لوحة التحكم</h1>
          <p className="text-slate-500 text-sm font-tajawal mt-1">
            نظرة شاملة ودقيقة على مؤشرات أداء المنصة وسجلات الأبحاث والمستخدمين
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#0F8F83] text-xs font-bold transition-all shadow-xs disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#0F8F83]' : ''}`} />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 rounded-lg text-xs font-bold text-rose-900 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <>
          {/* 5 Real Overview Statistic Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="إجمالي المستخدمين"
              value={stats.userCount}
              subtitle="كافة الحسابات المسجلة"
              icon={Users}
              colorClass="text-blue-600"
              bgIconClass="bg-blue-50"
              borderClass="border-blue-100"
            />
            <StatCard
              title="المستخدمون النشطون"
              value={stats.activeUserCount}
              subtitle="حسابات بحالة نشطة"
              icon={UserCheck}
              colorClass="text-emerald-600"
              bgIconClass="bg-emerald-50"
              borderClass="border-emerald-100"
            />
            <StatCard
              title="إجمالي الأبحاث"
              value={stats.researchCount}
              subtitle="أبحاث أُنشئت بالمنصة"
              icon={BookOpen}
              colorClass="text-[#0F8F83]"
              bgIconClass="bg-teal-50"
              borderClass="border-teal-100"
            />
            <StatCard
              title="الأبحاث المكتملة"
              value={stats.completedResearchCount}
              subtitle="وصلت للخطوة النهائية"
              icon={FileCheck2}
              colorClass="text-violet-600"
              bgIconClass="bg-violet-50"
              borderClass="border-violet-100"
            />
            <StatCard
              title="تصديرات PDF"
              value={stats.pdfExportsCount || 0}
              subtitle="مستندات تم تنزيلها"
              icon={FileDown}
              colorClass="text-amber-600"
              bgIconClass="bg-amber-50"
              borderClass="border-amber-100"
            />
          </div>

          {/* Research Completion Rate & Breakdown Bar */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">معدل اكتمال الأبحاث الأكاديمية</h3>
                <p className="text-xs text-slate-500 font-tajawal">نسبة الأبحاث التي اكتملت خطتها ومطالبها ووصلت لمرحلة التصدير</p>
              </div>
              <div className="text-left">
                <span className="text-2xl font-black text-[#0F8F83]">{completedRatio}%</span>
                <span className="text-xs text-slate-400 block font-tajawal">مكتملة</span>
              </div>
            </div>

            {/* Visual Ratio Bar */}
            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-[#0F8F83] to-[#14b8a6] h-full transition-all duration-1000 ease-out"
                style={{ width: `${completedRatio}%` }}
                title={`أبحاث مكتملة: ${stats.completedResearchCount}`}
              />
              <div
                className="bg-amber-400/70 h-full transition-all duration-1000 ease-out"
                style={{ width: `${100 - completedRatio}%` }}
                title={`أبحاث قيد التحرير: ${stats.researchCount - stats.completedResearchCount}`}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 font-tajawal">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F8F83]" />
                <span>أبحاث مكتملة ({stats.completedResearchCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>أبحاث قيد الإعداد والتحرير ({Math.max(0, stats.researchCount - stats.completedResearchCount)})</span>
              </div>
            </div>
          </div>

          {/* Two-Column Layout: Recent Activity & Recent Users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity Timeline */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#0F8F83]" />
                    <h3 className="font-extrabold text-base text-slate-900">سجل النشاط الإداري والعمليات</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-tajawal">سجلات مباشرة من قاعدة البيانات</span>
                </div>

                {(!data?.recentActivity || data.recentActivity.length === 0) ? (
                  <div className="text-center py-10 text-slate-400 text-xs font-tajawal">
                    لا توجد سجلات نشاط مسجلة بعد.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {data.recentActivity.slice(0, 5).map((log, index) => (
                      <div key={log._id || index} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-[#0F8F83] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-800 truncate">{log.userName || log.userEmail || 'مستخدم'}</span>
                            <span className="text-[10px] text-slate-400 font-tajawal shrink-0">
                              {log.createdAt ? new Date(log.createdAt).toLocaleDateString('ar-SA') : ''}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1 font-tajawal text-[11px] leading-relaxed">
                            {log.details || log.action}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Registered Users */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="font-extrabold text-base text-slate-900">أحدث الباحثين المسجلين</h3>
                  </div>
                  <Link
                    to="/admin/users"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0F8F83] hover:underline"
                  >
                    <span>عرض الكل</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {(!data?.recentUsers || data.recentUsers.length === 0) ? (
                  <div className="text-center py-10 text-slate-400 text-xs font-tajawal">
                    لا يوجد باحثون مسجلون بعد.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {data.recentUsers.slice(0, 5).map((u) => (
                      <div key={u._id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {u.name ? u.name.slice(0, 2) : 'ب'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 truncate">{u.name}</div>
                            <div className="text-[11px] text-slate-400 truncate font-tajawal">{u.email}</div>
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {u.status === 'active' ? 'نشط' : 'موقوف'}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1 font-tajawal">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-SA') : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 text-left">
                <Link
                  to="/admin/users"
                  className="text-xs font-bold text-slate-600 hover:text-[#0F8F83] transition-colors"
                >
                  إدارة صلاحيات وحسابات المستخدمين ←
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
