import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, AlertCircle, Clock, Filter, User } from 'lucide-react';
import api from '../../../services/api';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import { ActivityActionBadge } from '../components/StatusBadge';

const AdminActivityPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Pagination
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 15;

  const fetchActivity = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });
      if (search) params.append('q', search);
      if (actionFilter) params.append('action', actionFilter);

      const res = await api.get(`/admin/activity?${params.toString()}`);
      if (res.data?.success) {
        setLogs(res.data.data.logs || []);
        setTotalPages(res.data.data.totalPages || 1);
        setTotalRecords(res.data.data.total || 0);
      } else {
        throw new Error(res.data?.message || 'فشل استرجاع سجل النشاطات');
      }
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError(err.response?.data?.message || err.message || 'تعذر تحميل سجل النشاطات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [page, search, actionFilter]);

  return (
    <div className="space-y-6">
      {/* Controls: Search, Filter, Refresh */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-auto flex-1 flex flex-col sm:flex-row items-center gap-3">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="بحث بالبيان أو البريد أو اسم المستخدم..."
          />

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 font-cairo text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/15 focus:border-teal-700 transition-all shadow-2xs w-full sm:w-auto"
          >
            <option value="">جميع العمليات</option>
            <option value="user_login">تسجيل دخول</option>
            <option value="user_register">تسجيل حساب جديد</option>
            <option value="research_created">إنشاء بحث</option>
            <option value="pdf_exported">تصدير PDF</option>
            <option value="docx_exported">تصدير Word</option>
            <option value="role_changed">تغيير الدور</option>
            <option value="user_status_changed">تغيير حالة الحساب</option>
            <option value="settings_updated">تحديث الإعدادات</option>
          </select>
        </div>

        <button
          type="button"
          onClick={fetchActivity}
          className="btn btn-secondary inline-flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-xl self-end md:self-auto shadow-2xs hover:bg-slate-100 transition-all"
          title="تحديث السجل"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          <span>تحديث</span>
        </button>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-16 text-center text-slate-500 font-cairo space-y-3">
            <div className="w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs">جاري تحميل سجل النشاطات...</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center text-rose-600 font-cairo space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-bold">{error}</p>
            <button
              type="button"
              onClick={fetchActivity}
              className="btn btn-secondary text-xs inline-flex items-center gap-1.5 mt-2 rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-cairo space-y-2">
            <Activity className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600">لا توجد نشاطات مسجلة حتى الآن</p>
            <p className="text-xs text-slate-400">سوف تظهر هنا السجلات والعمليات الحقيقية فور حدوثها</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50/70 text-slate-500 border-b border-slate-200/80 font-cairo">
                  <th className="py-3.5 px-5 font-bold">العملية</th>
                  <th className="py-3.5 px-5 font-bold">المستخدم / الفاعل</th>
                  <th className="py-3.5 px-5 font-bold">تفاصيل العملية</th>
                  <th className="py-3.5 px-5 font-bold">الحالة</th>
                  <th className="py-3.5 px-5 font-bold">الوقت والتاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-cairo">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <ActivityActionBadge action={log.action} />
                    </td>
                    <td className="py-3.5 px-5 text-slate-700">
                      <div className="font-bold text-slate-900">{log.userName || log.userId?.name || 'مستخدم'}</div>
                      <div className="text-[11px] text-slate-400 font-amiri">{log.userEmail || log.userId?.email || '—'}</div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-800 font-medium max-w-md">
                      {log.details || '—'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold font-cairo bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
                        ناجحة
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-amiri whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(log.createdAt).toLocaleString('ar-EG', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          onPageChange={(newPage) => setPage(newPage)}
          limit={limit}
        />
      </div>
    </div>
  );
};

export default AdminActivityPage;
