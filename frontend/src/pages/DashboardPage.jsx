import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, BookOpen, Clock, Trash2, ArrowLeft, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../features/auth/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [researches, setResearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchResearches = async () => {
    try {
      const res = await api.get('/researches');
      if (res.data.success) {
        setResearches(res.data.data.researches);
      }
    } catch (err) {
      console.error('Fetch researches error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearches();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المشروع البحثي؟')) return;
    setDeletingId(id);
    try {
      await api.delete(`/researches/${id}`);
      setResearches(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      alert('حدث خطأ أثناء الحذف');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status, step) => {
    if (status === 'exported') {
      return <span className="badge badge-success">مكتمل ومصدر PDF</span>;
    }
    if (step >= 8) {
      return <span className="badge badge-info">جاهز للمعاينة (خطوة {step})</span>;
    }
    return <span className="badge badge-warning">قيد الإعداد (خطوة {step})</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-6">
      {/* Top Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
            أهلاً بك، {user?.name}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-cairo mt-2">
            لوحة مشاريع البحوث الأكاديمية
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-amiri mt-1">
            تابع مسوداتك البحثية واستأنف العمل عليها أو ابدأ مشروع بحث جامعي جديد
          </p>
        </div>

        <Link
          to="/research/new"
          className="btn btn-primary px-6 py-3.5 text-sm font-bold shadow-md shadow-teal-700/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>بدء بحث جديد</span>
        </Link>
      </div>

      {/* Researches Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-slate-800 font-cairo">
            مشاريعك البحثية ({researches.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="animate-spin w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full mx-auto mb-3"></div>
            <span className="font-cairo text-sm">جاري تحميل بحوثك...</span>
          </div>
        ) : researches.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-4">
            <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <BookOpen className="w-8 h-8 text-teal-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 font-cairo">لا توجد مشاريع بحثية بعد</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto font-amiri leading-relaxed">
              ابدأ الآن بإنشاء أول مستند بحثي أكاديمي بخطوات واضحة وتنسيق A4 فوري
            </p>
            <Link to="/research/new" className="btn btn-primary inline-flex">
              <PlusCircle className="w-4 h-4" />
              <span>إنشاء بحثك الأول</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {researches.map((res) => (
              <div
                key={res._id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-teal-400/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(res.status, res.currentStep)}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(res.updatedAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 font-cairo line-clamp-2">
                    {res.title || res.cover?.title || 'بحث أكاديمي'}
                  </h3>

                  {res.cover?.university && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 font-amiri">
                      <div><b>الجامعة:</b> {res.cover?.university}</div>
                      <div><b>الباحث:</b> {res.cover?.studentName}</div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <button
                    onClick={() => handleDelete(res._id)}
                    disabled={deletingId === res._id}
                    title="حذف البحث"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <Link
                    to={`/research/${res._id}/step/${res.currentStep || 1}`}
                    className="btn btn-primary text-xs px-4 py-2 font-cairo"
                  >
                    <span>متابعة البحث</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
