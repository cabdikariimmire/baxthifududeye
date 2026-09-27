import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Hash } from 'lucide-react';
import A4Page from '../../../components/common/A4Page';
import A4ScaleWrapper from '../../../components/common/A4ScaleWrapper';
import { paginateTopicContent } from '../../../utils/paginationHelper';
import api from '../../../services/api';

const Step5Footnotes = ({ research, onSave, onNext, onPrev }) => {
  const topics = research?.topics || [];
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);

  const currentTopic = topics[activeTopicIndex] || {
    topicId: 'topic-1',
    h1Title: '',
    blocks: [],
    footnotes: []
  };

  const getInitialFootnotes = () => {
    if (currentTopic.footnotes && currentTopic.footnotes.length > 0) {
      return currentTopic.footnotes.map((fn, idx) => ({
        footnoteId: fn.footnoteId || `fn-${currentTopic.topicId}-${idx + 1}`,
        number: idx + 1,
        marker: `(${idx + 1})`,
        text: fn.text || ''
      }));
    }
    return [];
  };

  const [footnotes, setFootnotes] = useState(getInitialFootnotes());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = topics[activeTopicIndex];
    if (t) {
      if (t.footnotes && t.footnotes.length > 0) {
        setFootnotes(
          t.footnotes.map((fn, idx) => ({
            footnoteId: fn.footnoteId || `fn-${t.topicId}-${idx + 1}`,
            number: idx + 1,
            marker: `(${idx + 1})`,
            text: fn.text || ''
          }))
        );
      } else {
        setFootnotes([]);
      }
    } else {
      setFootnotes([]);
    }
  }, [activeTopicIndex, topics]);

  const handleTopicSwitch = (idx) => {
    setActiveTopicIndex(idx);
  };

  const handleFootnoteChange = (index, text) => {
    const updated = [...footnotes];
    updated[index].text = text;
    setFootnotes(updated);
  };

  const handleAddFootnote = () => {
    const newNumber = footnotes.length + 1;
    const newFnId = `fn-${currentTopic.topicId}-${Date.now().toString(36)}-${newNumber}`;
    setFootnotes([
      ...footnotes,
      {
        footnoteId: newFnId,
        number: newNumber,
        marker: `(${newNumber})`,
        text: ''
      }
    ]);
  };

  // Requirement 2: Deleting footnote automatically renumbers all subsequent markers
  const handleDeleteFootnote = (targetIdOrIndex) => {
    let targetIndex = -1;
    if (typeof targetIdOrIndex === 'number') {
      targetIndex = targetIdOrIndex;
    } else if (typeof targetIdOrIndex === 'string') {
      targetIndex = footnotes.findIndex(
        (f) => f.footnoteId === targetIdOrIndex || f.id === targetIdOrIndex
      );
    }
    if (targetIndex === -1) return;

    const remaining = footnotes.filter((_, i) => i !== targetIndex);
    const renumbered = remaining.map((fn, idx) => ({
      ...fn,
      number: idx + 1,
      marker: `(${idx + 1})`
    }));
    setFootnotes(renumbered);
  };

  const handleSaveCurrentFootnotes = async () => {
    setSaving(true);
    try {
      const validFootnotes = footnotes
        .filter((f) => f.text && f.text.trim() !== '')
        .map((f, idx) => ({
          footnoteId: f.footnoteId || `fn-${currentTopic.topicId}-${idx + 1}`,
          number: idx + 1,
          marker: `(${idx + 1})`,
          text: f.text.trim()
        }));

      await api.post(`/researches/${research._id}/topics/${currentTopic.topicId}`, {
        footnotes: validFootnotes
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    await handleSaveCurrentFootnotes();

    if (activeTopicIndex < topics.length - 1) {
      setActiveTopicIndex(activeTopicIndex + 1);
    } else {
      if (onNext) onNext();
    }
  };

  const activeFootnotes = footnotes
    .filter((fn) => fn.text && fn.text.trim() !== '')
    .map((fn, idx) => ({
      footnoteId: fn.footnoteId || `fn-${currentTopic.topicId}-${idx + 1}`,
      number: idx + 1,
      marker: `(${idx + 1})`,
      text: fn.text.trim()
    }));

  const paginatedTopicPages = paginateTopicContent({
    title: currentTopic.h1Title,
    h1Title: currentTopic.h1Title,
    topicId: currentTopic.topicId,
    blocks: currentTopic.blocks || [{ type: 'h1', text: currentTopic.h1Title }],
    footnotes: activeFootnotes,
    startPageNumber: activeTopicIndex + 3
  });

  return (
    <div className="space-y-8 w-full">
      {/* ═══════ EDITOR / FORM CONTROLS (TOP) ═══════ */}
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {topics.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {topics.map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTopicSwitch(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 font-cairo ${
                  activeTopicIndex === idx
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{t.h1Title || `المطلب ${idx + 1}`}</span>
                {t.footnotes?.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeTopicIndex === idx
                        ? 'bg-teal-800 text-teal-100'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {t.footnotes.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-cairo flex items-center gap-2">
                <Hash className="w-5 h-5 text-teal-700" />
                <span>٥. إدارة وتوثيق الهوامش (Footnotes)</span>
              </h2>
              <p className="text-xs text-slate-500 font-amiri mt-1">
                توثيق المراجع والمصادر بدقة أسفل الصفحة الأكاديمية A4 مع خط فاصل 38 ملم
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddFootnote}
              className="btn btn-secondary text-xs px-3 py-1.5"
            >
              <Plus className="w-4 h-4 text-teal-700" />
              <span>إضافة هامش جديد</span>
            </button>
          </div>

          <div className="space-y-3">
            {footnotes.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-600 font-cairo">لا توجد هوامش مسجلة لهذا المطلب بعد</div>
                <p className="text-xs text-slate-400 font-amiri mt-1">
                  يمكنك إضافة هامش جديد يدوياً أو سيتم استخراجه تلقائياً من محتوى المطلب
                </p>
                <button
                  type="button"
                  onClick={handleAddFootnote}
                  className="btn btn-primary text-xs mt-4"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة أول هامش</span>
                </button>
              </div>
            ) : (
              footnotes.map((fn, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/80 flex items-start gap-3 hover:bg-white transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 font-bold text-xs flex items-center justify-center flex-shrink-0 font-amiri border border-teal-200 mt-1">
                    ({idx + 1})
                  </div>

                  <div className="flex-1 space-y-1">
                    <textarea
                      rows={2}
                      value={fn.text}
                      onChange={(e) => handleFootnoteChange(idx, e.target.value)}
                      placeholder="اكتب بيانات المرجع (اسم الكتاب، المؤلف، دار النشر، الجزء، الصفحة)..."
                      className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-teal-700 focus:ring-1 focus:ring-teal-700/20 bg-white font-amiri text-[13pt] leading-relaxed text-slate-900 resize-y outline-none"
                      dir="rtl"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteFootnote(fn.footnoteId || idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-60 group-hover:opacity-100 mt-1"
                    title="حذف الهامش"
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
              <span>السابق (المحتوى)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveCurrentFootnotes}
                disabled={saving}
                className="btn btn-secondary text-xs px-4"
              >
                <CheckCircle2 className="w-4 h-4 text-teal-700" />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ الهوامش'}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={saving}
                className="btn btn-primary px-8 py-3 text-base shadow-md shadow-teal-700/20"
              >
                <span>
                  {activeTopicIndex < topics.length - 1
                    ? 'المطلب التالي'
                    : 'حفظ ومتابعة للخاتمة'}
                </span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ A4 DOCUMENT PREVIEW (BOTTOM) ═══════ */}
      <div className="w-full space-y-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-2">
          <span className="font-bold text-sm text-slate-700 font-cairo">
            معاينة الهوامش أسفل الصفحة (A4)
          </span>
          <span className="badge badge-primary text-xs">
            {paginatedTopicPages.length > 1 ? `${paginatedTopicPages.length} صفحات A4` : `صفحة ${activeTopicIndex + 3}`}
          </span>
        </div>

        <A4ScaleWrapper pageCount={paginatedTopicPages.length}>
          {paginatedTopicPages.map((pageItem, pIdx) => (
            <div key={pIdx} className="w-full flex flex-col items-center">
              {paginatedTopicPages.length > 1 && (
                <div className="text-xs font-bold text-slate-500 font-cairo mb-1.5 self-start px-2">
                  صفحة {pageItem.pageNumberAr || pageItem.pageNumber}
                </div>
              )}
              <A4Page page={pageItem} borderId={research?.borderId} fontFamily={research?.fontFamily} />
            </div>
          ))}
        </A4ScaleWrapper>
      </div>
    </div>
  );
};

export default Step5Footnotes;
