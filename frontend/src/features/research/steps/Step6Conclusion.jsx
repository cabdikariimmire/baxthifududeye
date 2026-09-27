import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, ArrowRight, CheckCircle2, Award } from 'lucide-react';
import A4Page from '../../../components/common/A4Page';
import A4ScaleWrapper from '../../../components/common/A4ScaleWrapper';
import { paginateConclusionContent } from '../../../utils/paginationHelper';

const Step6Conclusion = ({ research, onSave, onNext, onPrev }) => {
  const [title, setTitle] = useState(research?.conclusion?.title || 'الخاتمة');
  const [introText, setIntroText] = useState(
    research?.conclusion?.opening ||
      research?.conclusion?.text ||
      ''
  );
  const [points, setPoints] = useState(
    Array.isArray(research?.conclusion?.points)
      ? research.conclusion.points
      : []
  );
  const [saving, setSaving] = useState(false);

  const handlePointChange = (idx, val) => {
    const updated = [...points];
    updated[idx] = val;
    setPoints(updated);
  };

  const handleAddPoint = () => {
    setPoints([...points, '']);
  };

  const handleDeletePoint = (idx) => {
    setPoints(points.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const validPoints = points.filter((p) => p && p.trim() !== '');
      await onSave({
        conclusion: {
          title: title.trim() || 'الخاتمة',
          opening: introText.trim(),
          text: introText.trim(),
          points: validPoints
        },
        currentStep: 6
      });
      if (onNext) onNext();
    } finally {
      setSaving(false);
    }
  };

  const conclusionStartPageNumber = (research?.topics?.length || 3) + 3;
  const paginatedConclusionPages = paginateConclusionContent({
    title: title.trim() || 'الخاتمة',
    opening: introText.trim(),
    points: points.filter((p) => p && p.trim() !== ''),
    startPageNumber: conclusionStartPageNumber
  });

  return (
    <div className="space-y-8 w-full">
      {/* ═══════ EDITOR / FORM CONTROLS (TOP) ═══════ */}
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xl font-bold text-slate-900 font-cairo flex items-center gap-2">
              <Award className="w-5 h-5 text-teal-700" />
              <span>٥. خاتمة البحث وأهم النتائج</span>
            </h2>

            <button
              type="button"
              onClick={handleAddPoint}
              className="btn btn-secondary text-xs"
            >
              <Plus className="w-3.5 h-3.5 text-teal-700" />
              <span>إضافة نتيجة جديدة</span>
            </button>
          </div>

          {/* Unnumbered Introductory Paragraph */}
          <div>
            <label className="form-label font-bold text-slate-800 mb-1 block">
              فقرة افتتاح الخاتمة (تصدير تمهيدي)
            </label>
            <textarea
              rows={2}
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
              className="textarea-field font-amiri text-base leading-relaxed bg-white text-slate-800"
              placeholder="اكتب التصدير التمهيدي للخاتمة (مثال: في ختام هذا البحث الذي تناولنا فيه...)"
            />
          </div>

          {/* 3. Structurally Numbered Results List */}
          <div>
            <label className="form-label font-bold text-slate-800">
              نتائج وتوصيات البحث (قائمة مرقمة تلقائياً)
            </label>
            <div className="space-y-3 mt-2">
              {points.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                  <p className="text-xs text-slate-500 font-amiri">لا توجد نتائج مسجلة حتى الآن. انقر على &quot;إضافة نتيجة جديدة&quot; لإضافة أول نتيجة.</p>
                  <button
                    type="button"
                    onClick={handleAddPoint}
                    className="btn btn-secondary text-xs mt-2"
                  >
                    <Plus className="w-3.5 h-3.5 text-teal-700" />
                    <span>إضافة نتيجة أولى</span>
                  </button>
                </div>
              ) : (
                points.map((pt, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-sm font-cairo flex-shrink-0 mt-2">
                      .{idx + 1}
                    </div>

                    <div className="flex-1">
                      <textarea
                        rows={3}
                        value={pt}
                        onChange={(e) => handlePointChange(idx, e.target.value)}
                        className="textarea-field font-amiri text-base leading-relaxed bg-white text-slate-800"
                        placeholder={`نتيجة البحث رقم ${idx + 1}...`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePoint(idx)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors mt-2"
                      title="حذف هذه النتيجة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onPrev}
              className="btn btn-secondary"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق (محتوى المطالب)</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary px-8 py-3 text-base shadow-md shadow-teal-700/20"
            >
              <span>{saving ? 'جاري الحفظ...' : 'حفظ ومتابعة للمصادر والمراجع'}</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* ═══════ A4 DOCUMENT PREVIEW (BOTTOM) ═══════ */}
      <div className="w-full space-y-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-2">
          <span className="font-bold text-sm text-slate-700 font-cairo">
            معاينة صفحة الخاتمة (A4)
          </span>
          <span className="badge badge-primary text-xs">
            {paginatedConclusionPages.length > 1 ? `${paginatedConclusionPages.length} صفحات A4` : `صفحة ${conclusionStartPageNumber}`}
          </span>
        </div>

        <A4ScaleWrapper pageCount={paginatedConclusionPages.length}>
          {paginatedConclusionPages.map((pageItem, pIdx) => (
            <div key={pIdx} className="w-full flex flex-col items-center">
              {paginatedConclusionPages.length > 1 && (
                <div className="text-xs font-bold text-slate-500 font-cairo mb-1.5 self-start px-2">
                  صفحة {pageItem.pageNumberAr || pageItem.pageNumber}
                </div>
              )}
              <A4Page
                page={pageItem}
                borderId={research?.borderId}
                fontFamily={research?.fontFamily}
              />
            </div>
          ))}
        </A4ScaleWrapper>
      </div>
    </div>
  );
};

export default Step6Conclusion;
