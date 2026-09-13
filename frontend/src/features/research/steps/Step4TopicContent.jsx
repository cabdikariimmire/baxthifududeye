import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Plus, Trash2, ArrowLeft, ArrowRight, CheckCircle2, Check, BookOpen } from 'lucide-react';
import A4Page from '../../../components/common/A4Page';
import api from '../../../services/api';
import { paginateTopicContent } from '../../../utils/paginationHelper';
import {
  detectAcademicLevel,
  getHighestAcademicLevel,
  resolveAcademicHeadingStyle,
  buildTopicViewModels,
  ACADEMIC_LEVELS
} from '../../../utils/academicHierarchy';

const sampleTopicContents = {
  1: `الفرع الأول : المعنى اللغوي
افتعال من العكوف، افتعل أي دخل في العكوف، مأخوذ من عكف على شيء أي لزمه وداوم عليه (1). ومنه قول إبراهيم -عليه السلام:- {مَا هَذِهِ التَّمَاثِيلُ الَّتِي أَنْتُمْ لَهَا عَاكِفُونَ} أي لها ملازمون، وقول الله تعالى: {يَعْكُفُونَ عَلَى أَصْنَامٍ لَهُمْ} أي يلازمونها ويداومون عليها (2).

الفرع الثاني : المعنى الإصطلاحي
فهو لزوم المسلم المسجد لطاعة الله تعالى مدةً مخصوصة مع نية التعبد والتقرب إليه سبحانه. ويقصد المعتكف من ذلك التفرغ للعبادة من صلاة وذكر وقراءة قرآن ودعاء وتأمل.

وقد ثبتت مشروعية الاعتكاف بالكتاب والسنة والإجماع. فمن القرآن الكريم قوله تعالى: ﴿وَلَا تُبَاشِرُوهُنَّ وَأَنْتُمْ عَاكِفُونَ فِي الْمَسَاجِدِ﴾ [البقرة: 187]، حيث دلت الآية على مشروعية الاعتكاف وارتباطه بالمساجد.
ومن السنة ما روته أم المؤمنين عائشة رضي الله عنها: «أن النبي صلى الله عليه وسلم كان يعتكف العشر الأواخر من رمضان حتى توفاه الله، ثم اعتكف أزواجه من بعده» (متفق عليه). كما أجمع العلماء على مشروعية الاعتكاف واستحبابه، وخاصة في العشر الأواخر من رمضان.`,
  2: `الاعتكاف سنة مؤكدة عند جمهور الفقهاء، ويتأكد استحبابه في العشر الأواخر من رمضان اقتداءً بالنبي صلى الله عليه وسلم (1). وقد يكون واجباً إذا نذره المسلم، لقوله صلى الله عليه وسلم: «من نذر أن يطيع الله فليطعه» رواه البخاري.

وللاعتكاف شروط لا بد من تحققها، من أهمها الإسلام والعقل والنية، وأن يكون الاعتكاف في مسجد؛ لقوله تعالى: ﴿وَأَنْتُمْ عَاكِفُونَ فِي الْمَسَاجِدِ﴾. كما اشترط جمهور العلماء الطهارة من الجنابة، وأن يمكث المعتكف في المسجد مدةً يتحقق بها معنى الاعتكاف.

ويُستحب للمعتكف الإكثار من قراءة القرآن الكريم، والذكر، والدعاء، والصلاة، والتوبة، ومحاسبة النفس. ويُكره له الاشتغال بما لا فائدة فيه من الأقوال والأفعال، كما يُمنع من الجماع ومقدماته؛ لقوله تعالى: ﴿وَلَا تُبَاشِرُوهُنَّ وَأَنْتُمْ عَاكِفُونَ فِي الْمَسَاجِدِ﴾.
ومن مبطلات الاعتكاف الخروج من المسجد بغير حاجة أو عذر شرعي، والجماع، والردة عن الإسلام، وكل ما ينافي مقصود الاعتكاف من الانقطاع لعبادة الله تعالى.`,
  3: `يحقق الاعتكاف مقاصد عظيمة في حياة المسلم، فهو عبادة تهدف إلى تقوية الصلة بالله تعالى، وتجديد الإيمان في القلب، وتربية النفس على الإخلاص والخشوع (1). كما يساعد على تصفية القلب من شواغل الدنيا والانشغال بذكر الله تعالى وطاعته.

ومن أهم آثاره التربوية أنه يربي المسلم على الصبر والانضباط ومجاهدة النفس، ويعوده على استثمار الوقت فيما ينفع. كما ينمي مراقبة الله تعالى والشعور بمعيته، ويزيد من التدبر في القرآن الكريم والتفكر في نعم الله وآياته.

ويُعد الاعتكاف فرصةً لمراجعة النفس وتصحيح الأخطاء وتجديد التوبة، ولذلك كان النبي صلى الله عليه وسلم يحرص عليه في العشر الأواخر من رمضان طلباً لليلة القدر التي هي خير من ألف شهر. كما يسهم الاعتكاف في تحقيق السكينة النفسية والطمأنينة الروحية التي يحتاج إليها المسلم في حياته.

ومن المقاصد الشرعية للاعتكاف تحقيق العبودية الخالصة لله تعالى، والانقطاع عن الملهيات الدنيوية، وتعظيم شعائر الله، وإحياء سنة النبي صلى الله عليه وسلم، وإعداد المسلم إعداداً إيمانياً يمكنه من مواصلة الطاعات بعد انتهاء موسم العبادة.`,
  4: `تتنوع صور الاعتكاف المعاصرة وتطبيقاته العملية في المساجد الكبرى والمراكز الإسلامية حول العالم، حيث تنظم برامج إيمانية وتوعوية متكاملة للمعتكفين في العشر الأواخر (1).

ويحرص القائمون على المساجد على توفير البيئة المناسبة للمعتكف من حيث الهدوء والترتيب لتمكينه من التفرغ التام للعبادة والذكر، مع الحفاظ على المقاصد الشرعية للاعتكاف دون إفراط أو تفريط.

وتبرز أهمية الالتزام بالآداب والأحكام الفقهية وتجنب الانشغال بالهواتف الذكية ووسائل التواصل أثناء مدة الاعتكاف، ليبقى القلب حاضراً ومتصلاً بالله عز وجل.`
};

const sampleFootnotesByTopic = {
  1: [
    {
      footnoteId: 'fn-topic-1-1',
      number: 1,
      marker: '(1)',
      text: 'المصباح المنير في غريب الشرح الكبير، أحمد بن محمد بن علي الفيومي، المكتبة العلمية – بيروت، ج1، ص 424'
    },
    {
      footnoteId: 'fn-topic-1-2',
      number: 2,
      marker: '(2)',
      text: 'الفقه على المذاهب الأربعة، عبد الرحمن الجزيري، دار الكتب العلمية، بيروت، الطبعة الثانية، 2003م، ج1، ص 566'
    }
  ],
  2: [
    {
      footnoteId: 'fn-topic-2-1',
      number: 1,
      marker: '(1)',
      text: 'توضيح الأحكام من بلوغ المرام، عبد الله بن عبد الرحمن البسام، مكتبة الأسدي، مكة المكرمة، الطبعة الخامسة، 1423هـ، ج3، ص 551'
    }
  ],
  3: [
    {
      footnoteId: 'fn-topic-3-1',
      number: 1,
      marker: '(1)',
      text: 'إحياء علوم الدين، أبو حامد الغزالي، دار المعرفة، بيروت، ج1، ص 238'
    }
  ],
  4: [
    {
      footnoteId: 'fn-topic-4-1',
      number: 1,
      marker: '(1)',
      text: 'مجموع الفتاوى، ابن تيمية، مجمع الملك فهد لطباعة المصحف الشريف، المدينة المنورة، 1416هـ، ج20، ص 310'
    }
  ]
};

const Step4TopicContent = ({ research, onSave, onNext, onPrev }) => {
  const derivedTopics = useMemo(() => {
    return buildTopicViewModels ? buildTopicViewModels(research) : [];
  }, [research]);

  const topics = useMemo(() => {
    if (research?.topics && research.topics.length > 0) {
      return research.topics;
    }
    return derivedTopics.length > 0 ? derivedTopics : [];
  }, [research?.topics, derivedTopics]);

  const [activeTopicIndex, setActiveTopicIndex] = useState(0);

  const currentTopic = topics[activeTopicIndex] || {
    topicId: `topic-1`,
    h1Title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته',
    status: 'incomplete',
    rawContent: sampleTopicContents[1],
    blocks: [],
    footnotes: sampleFootnotesByTopic[1]
  };

  const textareaRef = useRef(null);
  const cursorPositionRef = useRef(null);

  const [rawContent, setRawContent] = useState(
    currentTopic.rawContent || sampleTopicContents[activeTopicIndex + 1] || ''
  );

  const getInitialFootnotes = () => {
    if (currentTopic.footnotes && currentTopic.footnotes.length > 0) {
      return currentTopic.footnotes.map((fn, idx) => ({
        footnoteId: fn.footnoteId || `fn-${currentTopic.topicId || currentTopic.structureNodeId || 'topic'}-${idx + 1}`,
        number: idx + 1,
        marker: `(${idx + 1})`,
        text: fn.text || ''
      }));
    }
    const samples = sampleFootnotesByTopic[activeTopicIndex + 1] || [];
    return samples.length > 0
      ? samples.map((fn, idx) => ({
          footnoteId: fn.footnoteId || `fn-${currentTopic.topicId || currentTopic.structureNodeId || 'topic'}-${idx + 1}`,
          number: idx + 1,
          marker: `(${idx + 1})`,
          text: fn.text || ''
        }))
      : [];
  };

  const [footnotes, setFootnotes] = useState(getInitialFootnotes());
  const [blocks, setBlocks] = useState(currentTopic.blocks || []);
  const [isCompleted, setIsCompleted] = useState(currentTopic.status === 'complete');
  const [structuring, setStructuring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sync state when switching topics
  useEffect(() => {
    const t = topics[activeTopicIndex];
    if (t) {
      const defaultText = t.rawContent || sampleTopicContents[activeTopicIndex + 1] || '';
      setRawContent(defaultText);

      let initialFn = [];
      if (t.footnotes && t.footnotes.length > 0) {
        initialFn = t.footnotes.map((fn, idx) => ({
          footnoteId: fn.footnoteId || `fn-${t.topicId || t.structureNodeId || 'topic'}-${idx + 1}`,
          number: idx + 1,
          marker: `(${idx + 1})`,
          text: fn.text || ''
        }));
      } else {
        const samples = sampleFootnotesByTopic[activeTopicIndex + 1] || [];
        initialFn = samples.map((fn, idx) => ({
          footnoteId: fn.footnoteId || `fn-${t.topicId || t.structureNodeId || 'topic'}-${idx + 1}`,
          number: idx + 1,
          marker: `(${idx + 1})`,
          text: fn.text || ''
        }));
      }
      setFootnotes(initialFn);

      const defaultBlocks = t.blocks?.length
        ? t.blocks
        : [{ type: 'h1', text: t.h1Title }, { type: 'paragraph', text: defaultText }];
      setBlocks(defaultBlocks);
      setIsCompleted(t.status === 'complete' || (defaultText.trim().length > 30 && defaultBlocks.length > 0));
    }
  }, [activeTopicIndex, topics]);

  // Keep track of cursor position in textarea
  const updateCursorPosition = () => {
    if (textareaRef.current) {
      cursorPositionRef.current = textareaRef.current.selectionStart;
    }
  };

  // 1. INLINE FOOTNOTE INSERTION AT EXACT CURSOR POSITION
  const handleAddInlineFootnote = () => {
    const textarea = textareaRef.current;
    let pos = 0;

    if (textarea && typeof textarea.selectionStart === 'number') {
      pos = textarea.selectionStart;
    } else if (cursorPositionRef.current !== null) {
      pos = cursorPositionRef.current;
    } else {
      pos = rawContent.length;
    }

    const nextNumber = footnotes.length + 1;
    const marker = `(${nextNumber})`;
    const insertText = ` ${marker}`;

    const textBefore = rawContent.slice(0, pos);
    const textAfter = rawContent.slice(pos);
    const updatedContent = textBefore + insertText + textAfter;

    const newFootnoteId = `fn-${currentTopic.topicId || currentTopic.structureNodeId || 'topic'}-${Date.now()}`;
    const newFootnote = {
      footnoteId: newFootnoteId,
      number: nextNumber,
      marker,
      text: ''
    };

    const updatedFootnotes = [...footnotes, newFootnote];

    setRawContent(updatedContent);
    setFootnotes(updatedFootnotes);

    // Update semantic blocks to reflect the marker immediately
    const updatedBlocks = blocks.length
      ? blocks.map((b, i) => (i === blocks.length - 1 && b.type === 'paragraph' ? { ...b, text: b.text + insertText } : b))
      : [{ type: 'h1', text: currentTopic.h1Title }, { type: 'paragraph', text: updatedContent }];
    setBlocks(updatedBlocks);

    // Restore cursor position right after the inserted marker and focus footnote input
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newPos = pos + insertText.length;
        textarea.setSelectionRange(newPos, newPos);
        cursorPositionRef.current = newPos;
      }
      const fnInput = document.getElementById(`fn-input-${newFootnoteId}`);
      if (fnInput) {
        fnInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        fnInput.focus();
      }
    }, 50);
  };

  // 2. FOOTNOTE TEXT EDITING
  const handleFootnoteChange = (index, val) => {
    const updated = [...footnotes];
    updated[index].text = val;
    setFootnotes(updated);
  };

  // 3. DELETE FOOTNOTE & AUTOMATIC RENUMBERING
  const handleDeleteFootnote = (indexToDelete) => {
    const fnToDelete = footnotes[indexToDelete];
    const oldMarker = fnToDelete.marker || `(${fnToDelete.number})`;

    // Remove footnote from array
    const remaining = footnotes.filter((_, i) => i !== indexToDelete);

    // Renumber remaining footnotes sequentially
    const renumbered = remaining.map((fn, idx) => ({
      ...fn,
      number: idx + 1,
      marker: `(${idx + 1})`
    }));

    // Update markers in rawContent text:
    // 1. Remove the deleted marker
    let updatedText = rawContent.replace(oldMarker, '').replace(/\s{2,}/g, ' ');

    // 2. Renumber remaining markers in rawContent
    remaining.forEach((oldFn, idx) => {
      const currentMarker = oldFn.marker || `(${oldFn.number})`;
      const targetMarker = `(${idx + 1})`;
      if (currentMarker !== targetMarker) {
        updatedText = updatedText.replace(currentMarker, targetMarker);
      }
    });

    setFootnotes(renumbered);
    setRawContent(updatedText);
  };

  // 4. AI SEMANTIC STRUCTURING
  const handleAIStructure = async () => {
    if (!rawContent.trim()) {
      setError('يرجى إدخال محتوى المطلب أولاً');
      return;
    }

    setStructuring(true);
    setError(null);
    try {
      const targetId = currentTopic.topicId || currentTopic.structureNodeId || currentTopic._id || `topic-${activeTopicIndex + 1}`;
      const res = await api.post(`/researches/${research._id}/topics/${targetId}/structure`, {
        title: currentTopic.h1Title,
        content: rawContent
      });

      if (res.data?.success) {
        setBlocks(res.data.data.structuredTopic.blocks);
        setIsCompleted(true);
      }
    } catch (err) {
      console.warn('AI structuring fallback to heuristic blocks');
      const lines = rawContent.split('\n').map((l) => l.trim()).filter(Boolean);
      const newBlocks = [{ type: 'h1', text: currentTopic.h1Title }];
      lines.forEach((l) => {
        if (l.startsWith('الفرع') || l.startsWith('المبحث') || l.startsWith('المسألة')) {
          newBlocks.push({ type: 'h2', text: l });
        } else {
          newBlocks.push({ type: 'paragraph', text: l });
        }
      });
      setBlocks(newBlocks);
      setIsCompleted(true);
    } finally {
      setStructuring(false);
    }
  };

  // 5. PROGRESSIVE SAVE
  const handleSaveCurrentTopic = async (markComplete = false) => {
    setSaving(true);
    try {
      const finalStatus = markComplete || isCompleted || rawContent.trim().length > 30 ? 'complete' : 'in_progress';
      const finalBlocks = blocks.length
        ? blocks
        : [{ type: 'h1', text: currentTopic.h1Title }, { type: 'paragraph', text: rawContent }];

      const targetId = currentTopic.topicId || currentTopic.structureNodeId || currentTopic._id || `topic-${activeTopicIndex + 1}`;

      const res = await api.post(`/researches/${research._id}/topics/${targetId}`, {
        h1Title: currentTopic.h1Title,
        rawContent,
        blocks: finalBlocks,
        footnotes,
        status: finalStatus
      });

      if (res.data?.success && res.data.data?.research && onSave) {
        await onSave(res.data.data.research);
      }

      if (markComplete) {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error('Error saving topic content:', err);
    } finally {
      setSaving(false);
    }
  };

  // 6. NAVIGATION TO CONCLUSION (Step 5)
  const isTopicComplete = (topic, idx) => {
    if (idx === activeTopicIndex) {
      return isCompleted || (rawContent.trim().length > 30 && blocks.length > 0);
    }
    return topic.status === 'complete' || ((topic.rawContent?.trim()?.length > 30 || sampleTopicContents[idx + 1]) && (topic.blocks?.length > 0 || true));
  };

  const completedCount = topics.filter((t, idx) => isTopicComplete(t, idx)).length;
  const totalTopics = topics.length || 1;
  const allCompleted = completedCount >= totalTopics;

  const handleNextAction = async () => {
    if (!allCompleted) {
      setError('يجب إكمال جميع المطالب قبل الانتقال إلى الخاتمة.');
      return;
    }
    await handleSaveCurrentTopic(true);
    if (onNext) onNext();
  };

  // Semantic topic parser to automatically extract headings based on dynamic academic hierarchy
  const parseContentToSemanticBlocks = (h1Title, content, structuredBlocks) => {
    if (
      structuredBlocks &&
      structuredBlocks.length > 0 &&
      structuredBlocks.some((b) => {
        const lvl = detectAcademicLevel(b);
        return lvl === ACADEMIC_LEVELS.BRANCH || lvl === ACADEMIC_LEVELS.MATALAB || lvl === ACADEMIC_LEVELS.MABHATH;
      })
    ) {
      return structuredBlocks;
    }
    const topLevel = detectAcademicLevel(h1Title) || ACADEMIC_LEVELS.MATALAB;
    if (!content || !content.trim()) {
      const emptyBlocks = [{ type: topLevel, text: h1Title || 'المطلب' }];
      if (currentTopic.branches && currentTopic.branches.length > 0) {
        currentTopic.branches.forEach((b) => {
          const bTitle = b.title || b;
          const bLevel = detectAcademicLevel(bTitle) || ACADEMIC_LEVELS.BRANCH;
          emptyBlocks.push({ type: bLevel, text: bTitle });
        });
      }
      return emptyBlocks;
    }
    const lines = content.split('\n');
    const resultBlocks = [{ type: topLevel, text: h1Title || 'المطلب' }];
    let currentParagraph = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const pText = currentParagraph.join('\n').trim();
        if (pText) {
          resultBlocks.push({ type: 'paragraph', text: pText });
        }
        currentParagraph = [];
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushParagraph();
        return;
      }
      const lineLevel = detectAcademicLevel(trimmed);
      if (lineLevel === ACADEMIC_LEVELS.MABHATH || lineLevel === ACADEMIC_LEVELS.MATALAB || lineLevel === ACADEMIC_LEVELS.BRANCH) {
        flushParagraph();
        resultBlocks.push({ type: lineLevel, text: trimmed });
      } else {
        currentParagraph.push(line);
      }
    });

    flushParagraph();
    return resultBlocks;
  };

  // Live A4 Multi-Page Paginated Preview Model
  const effectiveBlocks = parseContentToSemanticBlocks(currentTopic.h1Title, rawContent, blocks);

  const paginatedTopicPages = paginateTopicContent({
    title: currentTopic.h1Title,
    h1Title: currentTopic.h1Title,
    topicId: currentTopic.topicId,
    blocks: effectiveBlocks,
    footnotes: footnotes,
    startPageNumber: activeTopicIndex + 3
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Topic Editor & Footnotes (lg: 7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Topic Selector Tabs */}
        {topics.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {topics.map((t, idx) => {
              const complete = isTopicComplete(t, idx);
              return (
                <button
                  key={idx}
                  onClick={async () => {
                    await handleSaveCurrentTopic();
                    setActiveTopicIndex(idx);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    activeTopicIndex === idx
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{t.h1Title || `المطلب ${idx + 1}`}</span>
                  {complete ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          {/* Header with 2 Main Actions: 1. Semantic Structuring | 2. Inline Footnote */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                المطلب {activeTopicIndex + 1} من {totalTopics}
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-cairo mt-1">
                {currentTopic.h1Title}
              </h2>
            </div>

            {/* The 2 Primary Top Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleAIStructure}
                disabled={structuring}
                className="btn btn-secondary text-xs border-teal-600 text-teal-800 bg-teal-50/60 hover:bg-teal-100 flex items-center gap-1.5"
                title="هيكلة وتصنيف النص دلالياً إلى فروع ومسائل"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                <span>{structuring ? 'جاري الهيكلة...' : '✨ هيكلة وتصنيف المحتوى دلالياً'}</span>
              </button>

              <button
                type="button"
                onClick={handleAddInlineFootnote}
                className="btn btn-primary text-xs py-2 px-3.5 bg-teal-800 hover:bg-teal-900 text-white flex items-center gap-1.5 shadow-sm"
                title="إدراج رقم هامش فوري في موضع المؤشر الحالي داخل النص"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>＋ إضافة هامش</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Research Content Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="form-label font-bold text-slate-800 mb-0">
                محتوى المطلب
              </label>
              <span className="text-xs text-slate-400 font-cairo">
                {footnotes.length} {footnotes.length === 1 ? 'هامش مضاف' : 'هوامش مضافة'}
              </span>
            </div>

            <textarea
              ref={textareaRef}
              rows={11}
              value={rawContent}
              onSelect={updateCursorPosition}
              onKeyUp={updateCursorPosition}
              onMouseUp={updateCursorPosition}
              onFocus={updateCursorPosition}
              onChange={(e) => {
                setRawContent(e.target.value);
                updateCursorPosition();
                if (e.target.value.trim().length > 30) {
                  setIsCompleted(true);
                }
              }}
              className="textarea-field font-amiri text-base leading-loose p-4 border-slate-300 focus:border-teal-700 focus:ring-teal-700 rounded-xl"
              placeholder="اكتب أو الصق محتوى المطلب هنا... ضع المؤشر واضغط '＋ إضافة هامش' لربط مرجع أو مصدر فوراً..."
              required
            />
          </div>

          {/* Inline Footnotes Editor Section Below Content */}
          <div className="pt-3 border-t border-slate-100">
            {/* Short Arabic RTL Footnote Separator Line (~35-40mm / 130px) */}
            <div className="w-32 h-0.5 bg-slate-400 mb-3"></div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-800" />
                <span className="font-bold text-sm font-cairo text-slate-800">
                  الهوامش والحواشي الخاصة بهذا المطلب ({footnotes.length})
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddInlineFootnote}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>إدراج هامش جديد</span>
              </button>
            </div>

            {footnotes.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500 font-amiri">
                لا توجد هوامش مدرجة في هذا المطلب حتى الآن. ضع مؤشر الكتابة داخل النص أعلاه واضغط على زر <strong className="text-teal-800">"＋ إضافة هامش"</strong> لإدراج علامة الهامش تلقائياً.
              </div>
            ) : (
              <div className="space-y-2.5">
                {footnotes.map((fn, idx) => (
                  <div
                    key={fn.footnoteId || idx}
                    className="flex items-start gap-2.5 p-2.5 bg-slate-50/80 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs font-cairo shrink-0 mt-0.5 shadow-xs">
                      {fn.marker || `(${idx + 1})`}
                    </div>

                    <div className="flex-1">
                      <input
                        id={`fn-input-${fn.footnoteId}`}
                        type="text"
                        value={fn.text}
                        onChange={(e) => handleFootnoteChange(idx, e.target.value)}
                        placeholder="اكتب الهامش أو المصدر هنا (مثال: ابن قدامة، المغني، جـ 3، صـ 187)..."
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-amiri text-slate-800 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteFootnote(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      title="حذف هذا الهامش وتحديث الترقيم التلقائي"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button type="button" onClick={onPrev} className="btn btn-secondary">
              <ArrowRight className="w-4 h-4" />
              <span>السابق (هيكلية البحث)</span>
            </button>

            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => handleSaveCurrentTopic(true)}
                disabled={saving}
                className="btn btn-secondary text-xs"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ واعتماد المطلب'}</span>
              </button>

              <button
                type="button"
                onClick={handleNextAction}
                disabled={saving || !allCompleted}
                title={!allCompleted ? 'يجب إكمال جميع المطالب أولاً' : ''}
                className={`btn btn-primary px-6 ${!allCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>متابعة للخاتمة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!allCompleted && (
            <div className="text-center text-xs text-amber-700 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200">
              يجب إكمال جميع المطالب ({completedCount} / {totalTopics}) قبل تفعيل الانتقال إلى الخاتمة.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Live A4 Topic Pages Preview (lg: 5 cols) */}
      <div className="lg:col-span-5 flex flex-col items-center space-y-6">
        <div className="w-full flex items-center justify-between px-2">
          <span className="font-bold text-sm text-slate-700 font-cairo">
            المعاينة الحية للمطلب (A4)
          </span>
          <span className="badge badge-primary text-xs">
            {paginatedTopicPages.length > 1 ? `${paginatedTopicPages.length} صفحات A4` : `صفحة ${activeTopicIndex + 3}`}
          </span>
        </div>

        {paginatedTopicPages.map((pageItem, pIdx) => (
          <div key={pIdx} className="w-full flex flex-col items-center">
            {paginatedTopicPages.length > 1 && (
              <div className="text-xs font-bold text-slate-500 font-cairo mb-1.5 self-start px-2">
                صفحة {pageItem.pageNumberAr || pageItem.pageNumber}
              </div>
            )}
            <div className="bg-slate-200/80 p-4 rounded-xl shadow-inner w-full flex justify-center overflow-x-auto">
              <A4Page page={pageItem} borderId={research?.borderId} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Step4TopicContent;
