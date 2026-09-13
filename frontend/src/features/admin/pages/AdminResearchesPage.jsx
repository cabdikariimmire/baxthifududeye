import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  RefreshCw,
  AlertCircle,
  Eye,
  Calendar,
  Layers,
  FileText,
  User,
  ExternalLink
} from 'lucide-react';
import api from '../../../services/api';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import { ResearchStatusBadge, ResearchStepBadge } from '../components/StatusBadge';
import Modal from '../components/Modal';

const AdminResearchesPage = () => {
  const [researches, setResearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stepFilter, setStepFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;

  // Selected research for full detail inspection
  const [selectedResearch, setSelectedResearch] = useState(null);

  const fetchResearches = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });
      if (search) params.append('q', search);
      if (statusFilter) params.append('status', statusFilter);
      if (stepFilter) params.append('step', stepFilter);

      const res = await api.get(`/admin/researches?${params.toString()}`);
      if (res.data?.success) {
        setResearches(res.data.data.researches || []);
        setTotalPages(res.data.data.totalPages || 1);
        setTotalRecords(res.data.data.total || 0);
      } else {
        throw new Error(res.data?.message || 'فشل استرجاع قائمة الأبحاث');
      }
    } catch (err) {
      console.error('Error fetching researches:', err);
      setError(err.response?.data?.message || err.message || 'تعذر تحميل بيانات الأبحاث');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearches();
  }, [page, search, statusFilter, stepFilter]);

  return (
    <div className="space-y-6">
      {/* Controls: Search, Filters, Refresh */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-auto flex-1 flex flex-col sm:flex-row items-center gap-3">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="بحث بعنوان البحث أو اسم الباحث أو الجامعة..."
          />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 font-cairo text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/15 focus:border-teal-700 transition-all shadow-2xs"
            >
              <option value="">جميع الحالات</option>
              <option value="draft">مسودة</option>
              <option value="structure_review">مراجعة الهيكلية</option>
              <option value="in_progress">قيد التحرير</option>
              <option value="ready">جاهز للمراجعة</option>
              <option value="exported">تم التصدير</option>
            </select>

            <select
              value={stepFilter}
              onChange={(e) => {
                setStepFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 font-cairo text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/15 focus:border-teal-700 transition-all shadow-2xs"
            >
              <option value="">جميع المراحل (١-٩)</option>
              <option value="1">١. الغلاف</option>
              <option value="2">٢. المقدمة والخطة</option>
              <option value="3">٣. الهيكلية</option>
              <option value="4">٤. محتوى المطالب</option>
              <option value="5">٥. الهوامش</option>
              <option value="6">٦. الخاتمة</option>
              <option value="7">٧. المصادر والمراجع</option>
              <option value="8">٨. الفهرس</option>
              <option value="9">٩. المعاينة A4</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchResearches}
          className="btn btn-secondary inline-flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-xl self-end md:self-auto shadow-2xs hover:bg-slate-100 transition-all"
          title="تحديث البيانات"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          <span>تحديث</span>
        </button>
      </div>

      {/* Researches Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading && researches.length === 0 ? (
          <div className="p-16 text-center text-slate-500 font-cairo space-y-3">
            <div className="w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs">جاري تحميل بيانات الأبحاث...</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center text-rose-600 font-cairo space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-bold">{error}</p>
            <button
              type="button"
              onClick={fetchResearches}
              className="btn btn-secondary text-xs inline-flex items-center gap-1.5 mt-2 rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        ) : researches.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-cairo space-y-2">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600">لا توجد أبحاث مطابقة لشروط البحث</p>
            <p className="text-xs text-slate-400">حاول تعديل الفلاتر أو إدخال عنوان مختلف</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50/70 text-slate-500 border-b border-slate-200/80 font-cairo">
                  <th className="py-3.5 px-5 font-bold">عنوان البحث</th>
                  <th className="py-3.5 px-5 font-bold">الباحث / الحساب</th>
                  <th className="py-3.5 px-5 font-bold">الجامعة</th>
                  <th className="py-3.5 px-5 font-bold">المرحلة</th>
                  <th className="py-3.5 px-5 font-bold">الحالة</th>
                  <th className="py-3.5 px-5 font-bold">تاريخ التعديل</th>
                  <th className="py-3.5 px-5 font-bold text-center">فحص التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-cairo">
                {researches.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900 max-w-[220px] truncate">
                      {r.title || r.cover?.title || 'مشروع بحث بدون عنوان'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      <div className="font-semibold text-slate-800">{r.cover?.studentName || r.userId?.name || 'باحث'}</div>
                      <div className="text-[11px] text-slate-400 font-amiri">{r.userId?.email || '—'}</div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-700 font-amiri text-sm">
                      {r.cover?.university || '—'}
                    </td>
                    <td className="py-3.5 px-5">
                      <ResearchStepBadge step={r.currentStep} />
                    </td>
                    <td className="py-3.5 px-5">
                      <ResearchStatusBadge status={r.status} />
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-amiri">
                      {new Date(r.updatedAt || r.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedResearch(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-teal-50 hover:border-teal-200 font-bold text-xs transition-all shadow-2xs"
                        title="فحص بطاقة البحث"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>معاينة</span>
                      </button>
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

      {/* Modal: View Full Research Card */}
      <Modal
        isOpen={Boolean(selectedResearch)}
        onClose={() => setSelectedResearch(null)}
        title={`فحص بطاقة البحث الأكاديمي: ${selectedResearch?.title || 'تفاصيل المشروع'}`}
        maxWidth="max-w-2xl"
      >
        {selectedResearch && (
          <div className="space-y-5 text-xs font-cairo">
            {/* Status & Step Highlight */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px]">مرحلة البحث الحالية</span>
                <ResearchStepBadge step={selectedResearch.currentStep} />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px]">حالة المشروع</span>
                <ResearchStatusBadge status={selectedResearch.status} />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px]">تاريخ الإنشاء</span>
                <span className="font-bold text-slate-800 font-amiri text-sm">
                  {new Date(selectedResearch.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>
            </div>

            {/* Researcher Info */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 space-y-2.5 shadow-2xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-700" />
                <span>بيانات الباحث وصاحب الحساب</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 font-amiri text-sm pt-1">
                <div>
                  <span className="text-slate-400 block text-xs font-cairo mb-0.5">اسم الحساب:</span>
                  <span className="font-bold text-slate-900">{selectedResearch.userId?.name || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-cairo mb-0.5">البريد الإلكتروني:</span>
                  <span className="text-slate-800">{selectedResearch.userId?.email || '—'}</span>
                </div>
              </div>
            </div>

            {/* Cover Fields Info */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <span>بيانات الغلاف المدخلة من قبل الباحث</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-slate-700 font-amiri text-sm pt-1">
                <div>
                  <span className="text-slate-400 block text-xs font-cairo mb-0.5">اسم الطالب في الغلاف:</span>
                  <span className="font-semibold text-slate-900">{selectedResearch.cover?.studentName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-cairo mb-0.5">الجامعة:</span>
                  <span className="font-semibold text-slate-900">{selectedResearch.cover?.university || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-cairo mb-0.5">الكلية:</span>
                  <span>{selectedResearch.cover?.college || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-cairo mb-0.5">المشرف الأكاديمي:</span>
                  <span>{selectedResearch.cover?.supervisor || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-cairo mb-0.5">الدولة:</span>
                  <span>{selectedResearch.cover?.country || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-cairo mb-0.5">المادة / المقرر:</span>
                  <span>{selectedResearch.cover?.subject || '—'}</span>
                </div>
              </div>
            </div>

            {/* Document Metadata */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs shadow-2xs">
              <span className="text-slate-600 font-medium">إطار الصفحة المعتمد:</span>
              <span className="font-bold text-slate-900 font-amiri text-sm">
                {selectedResearch.borderId === 'none' ? 'بدون إطار' : selectedResearch.borderId}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminResearchesPage;
