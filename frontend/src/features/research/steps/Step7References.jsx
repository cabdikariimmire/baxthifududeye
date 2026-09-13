import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, ArrowLeft, ArrowRight, BookMarked, RefreshCw, CheckCircle2 } from 'lucide-react';
import A4Page from '../../../components/common/A4Page';
import { paginateReferencesContent } from '../../../utils/paginationHelper';
import api from '../../../services/api';

const Step7References = ({ research, onSave, onNext, onPrev }) => {
  const [references, setReferences] = useState(
    Array.isArray(research?.references) ? research.references : []
  );

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Trigger auto-extraction on mount if empty and topics have footnotes
  useEffect(() => {
    const hasFootnotes = research?.topics?.some((t) => t.footnotes && t.footnotes.length > 0);
    if ((!research?.references || research.references.length === 0) && hasFootnotes) {
      handleAutoGenerateReferences();
    }
  }, []);

  const handleAutoGenerateReferences = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await api.post(`/researches/${research._id}/references/generate`);
      if (res.data.success && res.data.data.references?.length > 0) {
        setReferences(res.data.data.references);
      }
    } catch (err) {
      console.warn('Auto reference extraction error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleRefChange = (idx, val) => {
    const updated = [...references];
    updated[idx].book = val;
    updated[idx].displayText = val;
    setReferences(updated);
  };

  const handleAddReference = () => {
    const newOrder = references.length + 1;
    setReferences([
      ...references,
      { order: newOrder, book: '', displayText: '' }
    ]);
  };

  const handleDeleteReference = (idx) => {
    const updated = references.filter((_, i) => i !== idx).map((r, i) => ({
      ...r,
      order: i + 1
    }));
    setReferences(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const validRefs = references
        .filter((r) => (r.book && r.book.trim() !== '') || (r.displayText && r.displayText.trim() !== ''))
        .map((r, idx) => ({
          order: idx + 1,
          book: r.book || r.displayText,
          displayText: r.displayText || r.book
        }));

      await onSave({
        references: validRefs,
        currentStep: 7
      });
      if (onNext) onNext();
    } finally {
      setSaving(false);
    }
  };

  const referencesStartPageNumber = (research?.topics?.length || 3) + 4;
  const paginatedReferencePages = paginateReferencesContent({
    references: references.map((r, idx) => ({
      order: idx + 1,
      book: r.book || '',
      displayText: r.displayText || r.book || ''
    })),
    startPageNumber: referencesStartPageNumber
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: References Manager (lg: 7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-success text-xs font-bold">
                  ترتيب أبجدي مستمر
                </span>
                <span className="badge badge-primary text-xs">
                  {references.length} مرجع
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-cairo mt-1 flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-teal-700" />
                <span>٦. قائمة المصادر والمراجع الأكاديمية</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddReference}
                className="btn btn-secondary text-xs"
              >
                <Plus className="w-3.5 h-3.5 text-teal-700" />
                <span>إضافة مرجع</span>
              </button>

              <button
                type="button"
                onClick={handleAutoGenerateReferences}
                disabled={generating}
                className="btn btn-secondary text-xs text-teal-800"
                title="إعادة استخراج وترتيب المراجع من الهوامش"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                <span>{generating ? 'جاري الاستخراج...' : 'إعادة الاستخراج من الهوامش'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* References List */}
          <div className="space-y-3">
            {references.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                <BookMarked className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600 font-cairo">لا توجد مصادر أو مراجع مسجلة بعد</p>
                <p className="text-xs text-slate-400 font-amiri mt-1">
                  يمكنك استخراج المراجع تلقائياً من الهوامش أو إضافتها يدوياً
                </p>
                <button
                  type="button"
                  onClick={handleAddReference}
                  className="btn btn-secondary text-xs mt-3"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-700" />
                  <span>إضافة مرجع يدوي</span>
                </button>
              </div>
            ) : (
              references.map((ref, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs font-cairo flex-shrink-0 mt-2">
                    .{idx + 1}
                  </div>

                  <div className="flex-1">
                    <textarea
                      rows={2}
                      value={ref.displayText || ref.book}
                      onChange={(e) => handleRefChange(idx, e.target.value)}
                      className="textarea-field font-amiri text-base leading-relaxed bg-white text-slate-800"
                      placeholder="بيانات المرجع كاملة..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteReference(idx)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors mt-2"
                    title="حذف هذا المرجع"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onPrev}
              className="btn btn-secondary"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق (الخاتمة)</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary px-8 py-3 text-base shadow-md shadow-teal-700/20"
            >
              <span>{saving ? 'جاري الحفظ...' : 'حفظ ومتابعة للفهرس'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Live A4 References Preview (lg: 5 cols) */}
      <div className="lg:col-span-5 flex flex-col items-center space-y-6">
        <div className="w-full flex items-center justify-between px-2">
          <span className="font-bold text-sm text-slate-700 font-cairo">
            معاينة صفحة المصادر والمراجع (A4)
          </span>
          <span className="badge badge-primary text-xs">
            {paginatedReferencePages.length > 1 ? `${paginatedReferencePages.length} صفحات A4` : `صفحة ${referencesStartPageNumber}`}
          </span>
        </div>

        {paginatedReferencePages.map((pageItem, pIdx) => (
          <div key={pIdx} className="w-full flex flex-col items-center">
            {paginatedReferencePages.length > 1 && (
              <div className="text-xs font-bold text-slate-500 font-cairo mb-1.5 self-start px-2">
                صفحة {pageItem.pageNumberAr || pageItem.pageNumber}
              </div>
            )}
            <div className="bg-slate-200/80 p-4 rounded-xl shadow-inner w-full flex justify-center overflow-x-auto">
              <A4Page
                page={pageItem}
                borderId={research?.borderId}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Step7References;
