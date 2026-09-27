import React, { useState } from 'react';
import { Sparkles, ArrowLeft, ArrowRight, BookOpen, RefreshCw, Wand2 } from 'lucide-react';
import A4Page from '../../../components/common/A4Page';
import A4ScaleWrapper from '../../../components/common/A4ScaleWrapper';
import { paginateIntroductionContent } from '../../../utils/paginationHelper';
import api from '../../../services/api';

const Step2Introduction = ({ research, onSave, onNext, onPrev }) => {
  const researchTitle = research?.cover?.title || research?.title || '';

  // Seamlessly initialize continuous text from existing user data
  const getInitialContent = () => {
    const rawText = research?.introduction?.text || '';
    const rawOpening = research?.introduction?.opening || '';

    if (rawText.trim()) {
      if (rawText.includes('الحمد لله رب العالمين') || !rawOpening.trim()) {
        return rawText;
      }
      return `${rawOpening.trim()}\n\n${rawText.trim()}`;
    }

    return rawOpening.trim() || '';
  };

  const [content, setContent] = useState(getInitialContent);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const handleGenerateAIIntro = async () => {
    if (!research?._id) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await api.post(`/researches/${research._id}/introduction/generate`, {
        title: researchTitle,
        structure: research.structure,
        mataleeb: research.structure?.detectedMataleeb,
        topics: research.topics
      });

      if (res.data?.success && res.data.data?.introduction?.fullText) {
        setContent(res.data.data.introduction.fullText);
      }
    } catch (err) {
      console.error('AI Generation error:', err);
      setError(
        err.response?.data?.message ||
          'حدث خطأ أثناء الصياغة الآلية للمقدمة، يمكنك تعديل النص يدوياً'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleAnalyzeAndNext = async (e) => {
    e.preventDefault();
    if (!content.trim() || content.length < 10) {
      setError('يرجى كتابة نص المقدمة وخطة البحث قبل المتابعة');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // 1. Save unified introduction text
      await onSave({
        introduction: {
          opening: 'الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد وعلى آله وصحبه أجمعين، أما بعد:',
          text: content.trim()
        },
        currentStep: 2
      });

      // 2. Call AI introduction analyzer to construct canonical structure
      const res = await api.post(`/researches/${research._id}/introduction/analyze`, {
        text: content.trim()
      });

      if (res.data?.success) {
        if (res.data.data?.research && onSave) {
          await onSave(res.data.data.research);
        }
        if (onNext) onNext();
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(
        err.response?.data?.message ||
          'حدث خطأ أثناء تحليل المقدمة، يمكنك المتابعة ومراجعة الهيكلية يدوياً'
      );
      if (onNext) onNext();
    } finally {
      setAnalyzing(false);
    }
  };

  // Live A4 Paginated Pages representation
  const paginatedIntroPages = paginateIntroductionContent({
    title: 'المقدمة وخطة البحث',
    content,
    startPageNumber: 2
  });

  return (
    <div className="space-y-8 w-full">
      {/* ═══════ EDITOR / FORM CONTROLS (TOP) ═══════ */}
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-cairo flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-700" />
                <span>٢. المقدمة وخطة البحث</span>
              </h2>
              <p className="text-xs text-slate-500 font-amiri mt-1">
                صياغة متصلة لنص المقدمة والاستفتاح وخطة المطالب في محرر أكاديمي واحد
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-cairo">
              <span>الكلمات: <b className="text-teal-800">{wordCount}</b></span>
              <span>|</span>
              <span>الحروف: <b className="text-teal-800">{charCount}</b></span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleAnalyzeAndNext} className="space-y-4">
            {/* ONE SINGLE CONTENT CONTAINER */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label htmlFor="intro-content-editor" className="font-bold text-slate-800 text-sm font-cairo">
                    محرر نص المقدمة وخطة البحث المتصل
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAIIntro}
                    disabled={generating || analyzing}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg border border-teal-200 shadow-sm transition-all font-cairo disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{generating ? 'جاري الصياغة...' : 'صياغة المقدمة والخطة بالذكاء الاصطناعي'}</span>
                  </button>
                </div>
                <span className="text-xs text-slate-400 font-amiri">
                  16pt Amiri • تباعد أسطر 1.5
                </span>
              </div>

              <textarea
                id="intro-content-editor"
                rows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 bg-slate-50/40 focus:bg-white font-amiri text-[16pt] leading-[1.5] text-slate-900 resize-y outline-none transition-all"
                placeholder="اكتب نص المقدمة وخطة البحث المتصل هنا..."
                dir="rtl"
                required
              />
            </div>

            {analyzing && (
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-3 text-teal-900 animate-pulse">
                <Sparkles className="w-6 h-6 text-teal-700 animate-spin" />
                <div>
                  <div className="font-bold text-sm font-cairo">
                    جاري تحليل المقدمة واكتشاف المطالب بواسطة الذكاء الاصطناعي...
                  </div>
                  <div className="text-xs text-teal-700 font-amiri">
                    يتم استخراج المطالب الرئيسية والفروع وبناء الهيكلية الأكاديمية
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={onPrev}
                className="btn btn-secondary"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق (الغلاف)</span>
              </button>

              <button
                type="submit"
                disabled={analyzing}
                className="btn btn-primary px-8 py-3 text-base shadow-md shadow-teal-700/20"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>{analyzing ? 'جاري التحليل...' : 'تحليل المقدمة واكتشاف الهيكلية'}</span>
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ═══════ A4 DOCUMENT PREVIEW (BOTTOM) ═══════ */}
      <div className="w-full space-y-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-2">
          <span className="font-bold text-sm text-slate-700 font-cairo">
            المعاينة الحية للمقدمة (A4 - 16pt Amiri)
          </span>
          <span className="badge badge-success text-[11px] font-bold">
            {paginatedIntroPages.length > 1 ? `${paginatedIntroPages.length} صفحات A4` : 'صفحة ٢'}
          </span>
        </div>

        <A4ScaleWrapper pageCount={paginatedIntroPages.length}>
          {paginatedIntroPages.map((pageItem, pIdx) => (
            <div key={pIdx} className="w-full flex flex-col items-center">
              {paginatedIntroPages.length > 1 && (
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

export default Step2Introduction;
