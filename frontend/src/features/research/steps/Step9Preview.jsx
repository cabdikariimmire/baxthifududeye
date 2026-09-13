import React, { useState, useEffect } from 'react';
import { Eye, ChevronRight, ChevronLeft, Download, Printer, ArrowLeft, ArrowRight, Layers, ZoomIn, ZoomOut } from 'lucide-react';
import A4Page from '../../../components/common/A4Page';
import api from '../../../services/api';

const Step9Preview = ({ research, onNext, onPrev, targetPageNumber }) => {
  const [documentModel, setDocumentModel] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(targetPageNumber ? targetPageNumber - 1 : 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPreview = async () => {
    const researchId = research?._id;
    if (!researchId || researchId === 'new') return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/researches/${researchId}/preview`);
      if (res.data?.success && res.data?.data?.document) {
        setDocumentModel(res.data.data.document);
      } else {
        throw new Error('فشل تحميل نموذج المعاينة');
      }
    } catch (err) {
      console.error('Fetch preview error:', err);
      setError(err.response?.data?.message || err.message || 'تعذر تحميل معاينة صفحات البحث');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [research?._id]);

  useEffect(() => {
    if (targetPageNumber && targetPageNumber > 0) {
      setCurrentPageIndex(targetPageNumber - 1);
    }
  }, [targetPageNumber]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin w-10 h-10 border-4 border-teal-700 border-t-transparent rounded-full mx-auto mb-4"></div>
        <div className="font-bold text-slate-700 font-cairo">جاري تجهيز وتنسيق صفحات البحث الكاملة...</div>
      </div>
    );
  }

  if (error || !documentModel) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="bg-white rounded-2xl p-8 border border-red-200 shadow-sm flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900 font-cairo">تعذر تحميل المعاينة الكاملة</h2>
          <p className="text-xs text-slate-500 font-amiri leading-relaxed">{error || 'لم يتم العثور على صفحات المعاينة'}</p>
          <div className="flex items-center gap-3 w-full pt-2">
            <button
              onClick={fetchPreview}
              className="btn btn-primary flex-1 text-xs py-2.5 flex items-center justify-center gap-2"
            >
              إعادة المحاولة
            </button>
            {onPrev && (
              <button
                onClick={onPrev}
                className="btn btn-secondary flex-1 text-xs py-2.5 flex items-center justify-center gap-2"
              >
                العودة للفهرس
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }


  const pages = documentModel.pages || [];
  const activePage = pages[currentPageIndex] || pages[0];

  const handleTOCJump = (pageNumber) => {
    const targetIdx = pages.findIndex((p) => p.pageNumber === pageNumber);
    if (targetIdx !== -1) {
      setCurrentPageIndex(targetIdx);
    }
    const el = document.getElementById(`preview-page-${pageNumber}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Action & Navigation Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-cairo">
              ٨. معاينة البحث كاملاً بدقة الطباعة A4
            </h2>
            <div className="text-xs text-slate-500">
              المستند الكامل يتكون من <span className="font-bold text-teal-800">{pages.length}</span> صفحات A4 مصممة ومطبوعة بالترتيب الأكاديمي المعتمد
            </div>
          </div>
        </div>

        {/* Quick Jump Buttons */}
        <div className="flex items-center gap-2 self-center">
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
            إجمالي {pages.length} صفحات A4
          </span>
        </div>

        {/* Action button to export */}
        <button
          onClick={onNext}
          className="btn btn-primary text-sm shadow-md shadow-teal-700/20"
        >
          <span>المتابعة للتصدير والتحميل</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Main Reader View with Sticky Sidebar Thumbnails and Full Vertically Stacked A4 Sheets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Thumbnails Sidebar (lg: 3 cols) - Sticky */}
        <div className="lg:col-span-3 bg-white rounded-xl p-4 border border-slate-200 shadow-sm max-h-[800px] overflow-y-auto space-y-3 sticky top-24">
          <div className="font-bold text-xs text-slate-500 font-cairo uppercase mb-2 flex items-center justify-between">
            <span>فهرس صفحات البحث</span>
            <span className="badge badge-primary text-[10px]">{pages.length} صفحات</span>
          </div>

          {pages.map((p, idx) => {
            const pNum = p.pageNumber || idx + 1;
            return (
              <div
                key={idx}
                onClick={() => handleTOCJump(pNum)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  currentPageIndex === idx
                    ? 'border-teal-700 bg-teal-50 shadow-sm font-bold text-teal-900'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-5 h-5 rounded bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                    {p.pageNumberAr || pNum}
                  </span>
                  <span className="truncate">{p.title}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono uppercase">{p.pageType}</span>
              </div>
            );
          })}
        </div>

        {/* Right Multi-Page Continuous A4 Document Preview (lg: 9 cols) */}
        <div className="lg:col-span-9 bg-slate-300/80 p-4 md:p-8 rounded-2xl shadow-inner w-full flex flex-col items-center space-y-8 overflow-x-auto">
          {pages.map((pageItem, pIdx) => {
            const pageNum = pageItem.pageNumber || pIdx + 1;
            return (
              <div
                key={pIdx}
                id={`preview-page-${pageNum}`}
                className="w-full flex flex-col items-center scroll-mt-6"
              >
                <div className="w-[210mm] max-w-full flex items-center justify-between px-2 mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 font-cairo">
                    <span className="bg-white/90 px-2.5 py-1 rounded shadow-sm text-teal-900 border border-slate-200">
                      صفحة {pageItem.pageNumberAr || pageNum}
                    </span>
                    <span className="text-slate-600 font-bold truncate max-w-md">
                      {pageItem.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase bg-slate-200/90 px-2 py-0.5 rounded border border-slate-300">
                    {pageItem.pageType}
                  </span>
                </div>

                <div className="w-full flex justify-center overflow-x-auto">
                  <A4Page
                    page={pageItem}
                    borderSvg={documentModel.border?.svgPattern}
                    borderId={research?.borderId}
                    onTOCLinkClick={handleTOCJump}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="btn btn-secondary"
        >
          <ArrowRight className="w-4 h-4" />
          <span>السابق (الفهرس)</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="btn btn-primary px-8 py-3 text-base shadow-md shadow-teal-700/20"
        >
          <span>تأكيد المستند والانتقال لتصدير PDF</span>
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Step9Preview;
