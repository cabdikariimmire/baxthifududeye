import React, { useState, useEffect } from 'react';
import { ListOrdered, ArrowLeft, ArrowRight, RefreshCw, CheckCircle2, Navigation } from 'lucide-react';
import A4Page from '../../../components/common/A4Page';
import { paginateTOCContent } from '../../../utils/paginationHelper';
import api from '../../../services/api';

const Step8TOC = ({ research, onSave, onNext, onPrev, onNavigateToPage }) => {
  const [tocEntries, setTocEntries] = useState(research?.toc || []);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(() => research?.documentMetadata?.totalPages || 8);

  useEffect(() => {
    handleGenerateTOC();
  }, [research?._id]);

  const handleGenerateTOC = async () => {
    const researchId = research?._id;
    if (!researchId || researchId === 'new') return;

    setGenerating(true);
    setError(null);
    try {
      const res = await api.post(`/researches/${researchId}/toc/generate`);
      if (res.data?.success && res.data?.data) {
        if (res.data.data.toc) {
          setTocEntries(res.data.data.toc);
        }
        if (res.data.data.totalPages) {
          setTotalPages(res.data.data.totalPages);
        }
      }
    } catch (err) {
      console.warn('TOC generation notice:', err);
      setError(err.response?.data?.message || err.message || 'تعذر إعادة حساب الفهرس آلياً');
    } finally {
      setGenerating(false);
    }
  };

  const handleNext = async () => {
    setSaving(true);
    setError(null);
    try {
      if (onSave) {
        await onSave({
          toc: tocEntries,
          currentStep: 8
        });
      }
      if (onNext) {
        onNext();
      }
    } catch (err) {
      console.error('Save TOC step error:', err);
      setError('تعذر حفظ بيانات الفهرس. يرجى المحاولة مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };


  const tocPageNumber = totalPages;

  const paginatedTOCPages = paginateTOCContent({
    entries: tocEntries,
    startPageNumber: tocPageNumber
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: TOC Info and Clickable List (lg: 6 cols) */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-success text-xs font-bold">
                  ترقيم دقيق محسوب آلياً
                </span>
                <span className="text-xs text-slate-400">إجمالي {totalPages} صفحات</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-cairo mt-1 flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-teal-700" />
                <span>٧. فهرس الموضوعات المحسوب</span>
              </h2>
            </div>

            <button
              type="button"
              onClick={handleGenerateTOC}
              disabled={generating}
              className="btn btn-secondary text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>إعادة حساب الترقيم</span>
            </button>
          </div>

          <p className="text-xs text-slate-500">
            تم بناء الفهرس بناءً على التموضع الفعلي للعناوين والمطالب في صفحات البحث النهائية دون أي تخمين لأرقام الصفحات. انقر على أي بند للانتقال السريع.
          </p>

          {error && (
            <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200 font-amiri">
              {error}
            </div>
          )}


          <div className="space-y-2 mt-4 max-h-96 overflow-y-auto pr-1">
            {tocEntries.map((entry, idx) => (
              <div
                key={idx}
                onClick={() => onNavigateToPage && onNavigateToPage(entry.pageNumber)}
                className={`p-3 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 cursor-pointer transition-all flex items-center justify-between ${
                  entry.level === 2 ? 'pr-6 bg-slate-50 text-slate-700 text-xs' : 'bg-white font-semibold text-slate-900 text-sm'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                  <span className="truncate">{entry.title}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold font-amiri text-sm flex items-center justify-center">
                    {entry.pageNumberAr || entry.pageNumber}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onPrev}
              className="btn btn-secondary"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق (المراجع)</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="btn btn-primary px-8 py-3 text-base shadow-md shadow-teal-700/20"
            >
              <span>{saving ? 'جاري الحفظ...' : 'متابعة لمعاينة البحث كاملاً'}</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Live A4 TOC Preview (lg: 6 cols) */}
      <div className="lg:col-span-6 flex flex-col items-center space-y-6">
        <div className="w-full flex items-center justify-between px-2">
          <span className="font-bold text-sm text-slate-700 font-cairo">
            معاينة صفحة فهرس الموضوعات (A4)
          </span>
          <span className="badge badge-primary text-xs">
            {paginatedTOCPages.length > 1 ? `${paginatedTOCPages.length} صفحات A4` : `صفحة ${tocPageNumber}`}
          </span>
        </div>

        {paginatedTOCPages.map((pageItem, pIdx) => (
          <div key={pIdx} className="w-full flex flex-col items-center">
            {paginatedTOCPages.length > 1 && (
              <div className="text-xs font-bold text-slate-500 font-cairo mb-1.5 self-start px-2">
                صفحة {pageItem.pageNumberAr || pageItem.pageNumber}
              </div>
            )}
            <div className="bg-slate-200/80 p-4 rounded-xl shadow-inner w-full flex justify-center overflow-x-auto">
              <A4Page
                page={pageItem}
                borderId={research?.borderId}
                onTOCLinkClick={(pageNum) => onNavigateToPage && onNavigateToPage(pageNum)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Step8TOC;
