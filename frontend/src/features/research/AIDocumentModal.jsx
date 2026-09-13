import React, { useState } from 'react';
import { Sparkles, X, Check, AlertCircle, ArrowLeft, FileText, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

const AIDocumentModal = ({ isOpen, onClose, researchId, onApplied }) => {
  const [inputText, setInputText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!inputText || inputText.trim().length < 30) {
      setError('يرجى لصق نص البحث كاملاً بما في ذلك المقدمة والمطالب والخاتمة والهوامش.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    try {
      const res = await api.post(`/researches/${researchId}/ai/full-document`, { text: inputText });
      if (res.data.success && res.data.data?.analysis) {
        setAnalysisResult(res.data.data.analysis);
      } else {
        throw new Error(res.data.message || 'فشل التحليل الذكي للمستند');
      }
    } catch (err) {
      console.error('Full document analysis error:', err);
      setError(err.response?.data?.message || 'تعذر تحليل المستند بالذكاء الاصطناعي. يرجى التأكد من اكتمال النص والمحاولة مرة أخرى.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = async () => {
    if (!analysisResult) return;

    setApplying(true);
    setError(null);
    try {
      const res = await api.post(`/researches/${researchId}/ai/apply-full-document`, {
        analysis: analysisResult
      });
      if (res.data.success) {
        if (onApplied) onApplied(res.data.data.research);
        onClose();
      }
    } catch (err) {
      console.error('Apply document error:', err);
      setError(err.response?.data?.message || 'تعذر تطبيق البيانات على نموذج البحث.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-800 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h2 className="text-lg font-bold font-cairo">المعالجة الذكية للبحث الكامل (AI Extraction)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-teal-200 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!analysisResult ? (
            /* Input Step */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 font-cairo mb-1">
                  الصق نص البحث الأكاديمي كاملاً هنا:
                </label>
                <p className="text-xs text-slate-500 font-amiri mb-2">
                  يقوم المحرك الذكي بقراءة النص واستخراج بيانات الغلاف، المقدمة، المطالب الأربعة، الحواشي السفلية، الخاتمة، وقائمة المصادر والمراجع بدقة متناهية دون اختلاق أي بيانات مفقودة.
                </p>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="الصق نص بحثك هنا (يشمل الغلاف، المقدمة، المطلب الأول، الثاني، الثالث، الرابع، الخاتمة، المصادر)..."
                  rows={14}
                  className="w-full p-4 border border-slate-300 rounded-xl font-amiri text-sm leading-relaxed focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary text-sm"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing || !inputText.trim()}
                  className="btn btn-primary text-sm shadow-md flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{analyzing ? 'جاري تحليل النص وهيكلته...' : 'تحليل وهيكلة البحث بالذكاء الاصطناعي'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Review Extracted Data Step */
            <div className="space-y-4 font-amiri">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>تم تحليل وهيكلة البحث بنجاح. يرجى مراجعة البيانات المستخرجة قبل اعتمادها:</span>
              </div>

              {/* Cover Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h3 className="font-bold text-sm text-slate-900 font-cairo flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-700" />
                  <span>بيانات الغلاف المستخرجة:</span>
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-500">العنوان:</span> <span className="font-bold text-slate-800">{analysisResult.title || analysisResult.cover?.title || 'غير محدد'}</span></div>
                  <div><span className="text-slate-500">الباحث:</span> <span className="font-bold text-slate-800">{analysisResult.cover?.studentName || 'غير محدد'}</span></div>
                  <div><span className="text-slate-500">الجامعة:</span> <span className="font-bold text-slate-800">{analysisResult.cover?.university || 'غير محدد'}</span></div>
                  <div><span className="text-slate-500">المشرف:</span> <span className="font-bold text-slate-800">{analysisResult.cover?.supervisor || 'غير محدد'}</span></div>
                </div>
              </div>

              {/* Topics Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h3 className="font-bold text-sm text-slate-900 font-cairo flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-700" />
                  <span>المطالب المستخرجة ({analysisResult.mataleeb?.length || 0}):</span>
                </h3>
                <div className="space-y-1.5 text-xs">
                  {(analysisResult.mataleeb || []).map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                      <span className="font-bold text-slate-800">{m.title}</span>
                      <span className="text-[11px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                        {m.footnotes?.length || 0} هوامش
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* References Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h3 className="font-bold text-sm text-slate-900 font-cairo flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-teal-700" />
                  <span>المصادر والمراجع المستخرجة ({analysisResult.references?.length || 0}):</span>
                </h3>
                <div className="max-h-28 overflow-y-auto space-y-1 text-xs pr-1">
                  {(analysisResult.references || []).map((r, idx) => (
                    <div key={idx} className="text-slate-700">
                      {idx + 1}. {r.book} {r.author ? ` - ${r.author}` : ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAnalysisResult(null)}
                  className="btn btn-secondary text-xs"
                >
                  إعادة اللصق والتحليل
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-secondary text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={applying}
                    className="btn btn-primary text-xs shadow-md flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{applying ? 'جاري الاعتماد...' : 'اعتماد وتطبيق في نموذج البحث'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDocumentModal;
