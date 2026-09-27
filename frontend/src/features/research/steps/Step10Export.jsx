import React, { useState } from 'react';
import {
  Download,
  Printer,
  CheckCircle,
  FileText,
  LayoutDashboard,
  PlusCircle,
  ShieldCheck,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';

const Step10Export = ({ research, onPrev }) => {
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [error, setError] = useState(null);

  // Download PDF Handler
  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    setError(null);
    try {
      const response = await api.post(
        `/researches/${research._id}/pdf`,
        {},
        {
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const cleanTitle = (research.title || research.cover?.title || 'بحث_اكاديمي').replace(/\s+/g, '_');
      link.setAttribute('download', `${cleanTitle}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[PDF Download Error]:', err);
      setError('تعذر إنشاء ملف PDF. تأكد من اكتمال عناصر البحث وحاول مرة أخرى.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleOpenPrintView = () => {
    window.open(`/api/researches/${research._id}/pdf/html`, '_blank');
  };

  const totalPages = Number(research?.documentMetadata?.totalPages) || null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade font-cairo" dir="rtl">
      {/* Top Banner */}
      <div className="rounded-3xl p-8 shadow-xl text-white bg-gradient-to-br from-teal-800 via-teal-900 to-emerald-950 transition-all">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-inner backdrop-blur-md bg-white/10 text-emerald-300">
            <CheckCircle className="w-8 h-8 text-emerald-300" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            تصدير بحثك الأكاديمي القياسي (A4 PDF)
          </h1>

          <p className="text-teal-100 text-sm font-amiri leading-relaxed">
            تمت صياغة وتنسيق البحث وفق المعايير الجامعية الصارمة بصفحات A4 معتمدة وهوامش سفلية مدمجة بكل صفحة وفهرس موضوعات آلي. المنصة هي المصدر الحصري والمعتمد للبحث.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="btn bg-white text-teal-950 hover:bg-teal-50 px-8 py-4 text-base font-black shadow-xl flex items-center gap-3 transition-transform active:scale-95 cursor-pointer"
            >
              <Download className={`w-5 h-5 text-teal-800 ${downloadingPDF ? 'animate-bounce' : ''}`} />
              <span>{downloadingPDF ? 'جاري إنشاء وتجهيز PDF...' : 'تحميل PDF (مستند قياسي A4)'}</span>
            </button>

            <button
              onClick={handleOpenPrintView}
              className="btn bg-teal-800/60 hover:bg-teal-700/80 text-white border border-teal-500/40 px-6 py-4 text-sm font-bold backdrop-blur-md flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>معاينة الطباعة المباشرة</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-2xl border border-red-200 text-sm font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Canonical Source Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 leading-relaxed font-amiri space-y-1">
        <div className="font-bold text-slate-900 flex items-center gap-2 text-sm font-cairo">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span>الموقع هو المصدر الوحيد والحصري للبحث الأكاديمي</span>
        </div>
        <p>
          ملف PDF المصدر هو المنتج النهائي المعتمد وفق المعايير الأكاديمية القياسية (A4). في حال رغبتك بإجراء أي تعديلات علمية أو لغوية على متن البحث أو إضافة مصادر وهوامش جديدة، يرجى دائماً العودة إلى محرر المنصة، تعديل البحث هنا، ثم إعادة توليد ملف PDF الجديد.
        </p>
      </div>

      {/* Research Summary Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="w-5 h-5 text-teal-700" />
          <span>بطاقة وبيانات البحث المنجز</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-0.5">عنوان البحث</span>
            <span className="font-bold text-slate-900 text-sm font-cairo line-clamp-1">
              {research?.title || research?.cover?.title || 'بحث أكاديمي'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-0.5">الباحث / الطالب</span>
            <span className="font-bold text-slate-900">
              {research?.cover?.studentName || 'غير محدد'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-0.5">المشرف العلمي</span>
            <span className="font-bold text-slate-900">
              {research?.cover?.supervisor || 'غير محدد'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-0.5">الجامعة والكلية</span>
            <span className="font-bold text-slate-900">
              {research?.cover?.university || 'الجامعة'} {research?.cover?.college ? `- ${research.cover.college}` : ''}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-0.5">عدد الصفحات المعتمدة</span>
            <span className="font-bold text-slate-900">
              {totalPages ? `${totalPages} صفحات A4` : 'معاينة جاهزة'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-0.5">المصادر والمراجع</span>
            <span className="font-bold text-slate-900">
              {research?.references?.length || 0} مصادر ومراجع
            </span>
          </div>
        </div>

        {/* Navigation & Action Links */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onPrev}
            className="btn btn-secondary text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة للمعاينة والتعديل</span>
          </button>

          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="btn btn-secondary text-xs flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>لوحة بحوثي</span>
            </Link>

            <Link to="/research/new" className="btn btn-primary text-xs flex items-center gap-1.5">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>بدء بحث جديد</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step10Export;
