import React, { useState } from 'react';
import { Download, Printer, CheckCircle, FileText, FileCode, LayoutDashboard, PlusCircle, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';

const Step10Export = ({ research, onPrev }) => {
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingDOCX, setDownloadingDOCX] = useState(false);
  const [error, setError] = useState(null);

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
      const cleanTitle = (research.title || 'بحث_اكاديمي').replace(/\s+/g, '_');
      link.setAttribute('download', `${cleanTitle}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('[PDF Download Error]:', err);
      setError('تعذر إنشاء ملف PDF. حاول مرة أخرى.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownloadDOCX = async () => {
    setDownloadingDOCX(true);
    setError(null);
    try {
      const response = await api.post(
        `/researches/${research._id}/docx`,
        {},
        {
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        })
      );
      const link = document.createElement('a');
      link.href = url;
      const cleanTitle = (research.title || 'بحث_اكاديمي').replace(/\s+/g, '_');
      link.setAttribute('download', `${cleanTitle}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('[Word DOCX Download Error]:', err);
      setError('تعذر إنشاء ملف Word. حاول مرة أخرى.');
    } finally {
      setDownloadingDOCX(false);
    }
  };

  const handleOpenPrintView = () => {
    window.open(`/api/researches/${research._id}/pdf/html`, '_blank');
  };

  const totalPages = Number(research?.documentMetadata?.totalPages) || null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade">
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white rounded-2xl p-8 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto text-emerald-300">
          <CheckCircle className="w-10 h-10" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold font-cairo">
          تهانينا! تم إعداد وتنسيق بحثك الأكاديمي بنجاح تام
        </h1>

        <p className="text-teal-100 text-sm max-w-xl mx-auto leading-relaxed">
          تمت هيكلة وتنسيق كافة صفحات البحث وفقاً لأرقى المعايير الجامعية (الغلاف، المقدمة والخطة، المطالب، الحواشي السفلية، الخاتمة، المصادر والمراجع، وفهرس الموضوعات)
        </p>

        {/* Primary Download Buttons (PDF + Word DOCX) */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="btn bg-white text-teal-900 hover:bg-teal-50 px-7 py-3.5 text-base font-bold shadow-lg flex items-center gap-3 transition-transform active:scale-95"
          >
            <Download className={`w-5 h-5 ${downloadingPDF ? 'animate-bounce' : ''}`} />
            <span>{downloadingPDF ? 'جاري تجهيز PDF...' : 'تحميل PDF (مستند قياسي A4)'}</span>
          </button>

          <button
            onClick={handleDownloadDOCX}
            disabled={downloadingDOCX}
            className="btn bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 px-7 py-3.5 text-base font-bold shadow-lg flex items-center gap-3 transition-transform active:scale-95"
          >
            <FileCode className={`w-5 h-5 ${downloadingDOCX ? 'animate-bounce' : ''}`} />
            <span>{downloadingDOCX ? 'جاري تجهيز DOCX...' : 'تحميل Word (DOCX قابل للتعديل)'}</span>
          </button>

          <button
            onClick={handleOpenPrintView}
            className="btn bg-teal-700/80 hover:bg-teal-700 text-white border border-teal-500 px-5 py-3.5 text-sm font-semibold backdrop-blur-md flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>معاينة الطباعة المباشرة</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-bold text-center">
          {error}
        </div>
      )}

      {/* Research Summary Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 font-cairo flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="w-5 h-5 text-teal-700" />
          <span>بيانات وبطاقة البحث المنجز</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-xs text-slate-500 block">عنوان البحث</span>
            <span className="font-bold text-slate-900 font-cairo">{research?.title || research?.cover?.title}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-xs text-slate-500 block">الباحث / الطالب</span>
            <span className="font-bold text-slate-900">{research?.cover?.studentName}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-xs text-slate-500 block">المشرف العلمي</span>
            <span className="font-bold text-slate-900">{research?.cover?.supervisor}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-xs text-slate-500 block">الجامعة والكلية</span>
            <span className="font-bold text-slate-900">{research?.cover?.university} - {research?.cover?.college}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-xs text-slate-500 block">إجمالي عدد الصفحات</span>
            <span className="font-bold text-slate-900">
              {totalPages ? `${totalPages} صفحات A4 كاملة` : 'سيتم تحديث العدد بعد إنشاء المعاينة النهائية'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-xs text-slate-500 block">عدد المراجع المستخرجة</span>
            <span className="font-bold text-slate-900">{research?.references?.length || 4} مصادر ومراجع</span>
          </div>
        </div>

        {/* Post-actions */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onPrev}
            className="btn btn-secondary text-sm"
          >
            <span>العودة للمعاينة والتعديل</span>
          </button>

          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="btn btn-secondary text-sm">
              <LayoutDashboard className="w-4 h-4" />
              <span>لوحة بحوثي</span>
            </Link>

            <Link to="/research/new" className="btn btn-primary text-sm">
              <PlusCircle className="w-4 h-4" />
              <span>بدء بحث جديد</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step10Export;
