import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Sparkles,
  FolderTree,
  FileText,
  GitBranch
} from 'lucide-react';
import api from '../../../services/api';
import {
  ACADEMIC_LEVELS,
  normalizeToSemanticTree,
  getArabicOrdinal,
  stripAcademicPrefix,
  formatAcademicHeadingTitle,
  flattenSemanticTreeToTopics
} from '../../../utils/academicHierarchy';

const Step3StructureReview = ({ research, onSave, onNext, onPrev }) => {
  const researchTitle = research?.cover?.title || research?.title || '';

  const initialTree = React.useMemo(() => {
    const raw = research?.structure?.tree?.length
      ? research.structure.tree
      : research?.structure?.detectedMataleeb?.length
      ? research.structure.detectedMataleeb
      : research?.topics?.length
      ? research.topics
      : [];
    return normalizeToSemanticTree(raw);
  }, [research]);

  const [tree, setTree] = useState(initialTree);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const hasMabhath = tree.some((n) => n.type === ACADEMIC_LEVELS.MABHATH);

  // 1. ADD MABHATH
  const handleAddMabhath = () => {
    if (!hasMabhath) {
      // Transition from Case 2 (No Mabhath) to Case 1 (With Mabhath):
      // The existing root Mataleeb become the children of this new Mabhath!
      const newMabhath = {
        id: `mabhath-1`,
        type: ACADEMIC_LEVELS.MABHATH,
        title: researchTitle ? `الإطار العام لـ ${researchTitle}` : 'المبحث الأول',
        parentId: null,
        order: 1,
        children: tree.map((matlab, mIdx) => ({
          ...matlab,
          parentId: 'mabhath-1',
          order: mIdx + 1
        }))
      };
      setTree([newMabhath]);
    } else {
      // Append a second or subsequent Mabhath
      const newMbOrder = tree.length + 1;
      const mbOrdinal = getArabicOrdinal(newMbOrder);
      const newMabhath = {
        id: `mabhath-${newMbOrder}`,
        type: ACADEMIC_LEVELS.MABHATH,
        title: `عنوان المبحث ${mbOrdinal}`,
        parentId: null,
        order: newMbOrder,
        children: [
          {
            id: `matlab-${newMbOrder}-1`,
            type: ACADEMIC_LEVELS.MATALAB,
            title: 'موضوع المطلب الأول',
            parentId: `mabhath-${newMbOrder}`,
            order: 1,
            children: [
              {
                id: `branch-${newMbOrder}-1-1`,
                type: ACADEMIC_LEVELS.BRANCH,
                title: 'فرع توضيحي أول',
                parentId: `matlab-${newMbOrder}-1`,
                order: 1
              }
            ]
          }
        ]
      };
      setTree([...tree, newMabhath]);
    }
  };

  // 2. ADD MATLAB (Created as child under the Mabhath if Mabhath exists, or at root)
  const handleAddMatlab = (mabhathIdx = 0) => {
    if (hasMabhath) {
      const targetMabhath = tree[mabhathIdx] || tree[0];
      const newMatlabOrder = (targetMabhath.children || []).length + 1;
      const matlabOrdinal = getArabicOrdinal(newMatlabOrder);

      const newMatlab = {
        id: `matlab-${targetMabhath.id}-${Date.now()}`,
        type: ACADEMIC_LEVELS.MATALAB,
        title: `عنوان المطلب ${matlabOrdinal}`,
        parentId: targetMabhath.id,
        order: newMatlabOrder,
        children: [
          {
            id: `branch-${Date.now()}`,
            type: ACADEMIC_LEVELS.BRANCH,
            title: 'فرع توضيحي',
            parentId: `matlab-${targetMabhath.id}-${Date.now()}`,
            order: 1
          }
        ]
      };

      const updated = tree.map((mb, idx) => {
        if (idx === mabhathIdx) {
          return {
            ...mb,
            children: [...(mb.children || []), newMatlab]
          };
        }
        return mb;
      });
      setTree(updated);
    } else {
      const newMatlabOrder = tree.length + 1;
      const matlabOrdinal = getArabicOrdinal(newMatlabOrder);
      const newMatlab = {
        id: `matlab-${Date.now()}`,
        type: ACADEMIC_LEVELS.MATALAB,
        title: `عنوان المطلب ${matlabOrdinal}`,
        parentId: null,
        order: newMatlabOrder,
        children: [
          {
            id: `branch-${Date.now()}`,
            type: ACADEMIC_LEVELS.BRANCH,
            title: 'فرع توضيحي',
            parentId: `matlab-${Date.now()}`,
            order: 1
          }
        ]
      };
      setTree([...tree, newMatlab]);
    }
  };

  // 3. ADD BRANCH (Created as child under the Matlab)
  const handleAddBranch = (mabhathIdx, matlabIdx) => {
    if (hasMabhath) {
      const updated = tree.map((mb, mbI) => {
        if (mbI === mabhathIdx) {
          const updatedChildren = mb.children.map((matlab, mI) => {
            if (mI === matlabIdx) {
              const newBranchOrder = (matlab.children || []).length + 1;
              const branchOrdinal = getArabicOrdinal(newBranchOrder);
              const newBranch = {
                id: `branch-${Date.now()}`,
                type: ACADEMIC_LEVELS.BRANCH,
                title: `عنوان الفرع ${branchOrdinal}`,
                parentId: matlab.id,
                order: newBranchOrder
              };
              return {
                ...matlab,
                children: [...(matlab.children || []), newBranch]
              };
            }
            return matlab;
          });
          return { ...mb, children: updatedChildren };
        }
        return mb;
      });
      setTree(updated);
    } else {
      const updated = tree.map((matlab, mI) => {
        if (mI === matlabIdx) {
          const newBranchOrder = (matlab.children || []).length + 1;
          const branchOrdinal = getArabicOrdinal(newBranchOrder);
          const newBranch = {
            id: `branch-${Date.now()}`,
            type: ACADEMIC_LEVELS.BRANCH,
            title: `عنوان الفرع ${branchOrdinal}`,
            parentId: matlab.id,
            order: newBranchOrder
          };
          return {
            ...matlab,
            children: [...(matlab.children || []), newBranch]
          };
        }
        return matlab;
      });
      setTree(updated);
    }
  };

  // 4. DELETE MABHATH (Safely unwraps children to root if 1 mabhath, or removes mabhath)
  const handleDeleteMabhath = (mabhathIdx) => {
    if (tree.length === 1) {
      // Transition back to Case 2 (No Mabhath): promote children Mataleeb to root level
      const childMataleeb = (tree[0].children || []).map((m, idx) => ({
        ...m,
        parentId: null,
        order: idx + 1
      }));
      setTree(childMataleeb.length > 0 ? childMataleeb : initialTree);
    } else {
      const updated = tree.filter((_, idx) => idx !== mabhathIdx).map((mb, idx) => ({
        ...mb,
        order: idx + 1
      }));
      setTree(updated);
    }
  };

  // 5. DELETE MATLAB
  const handleDeleteMatlab = (mabhathIdx, matlabIdx) => {
    if (hasMabhath) {
      const targetMb = tree[mabhathIdx];
      if ((targetMb.children || []).length <= 1 && tree.length <= 1) {
        setError('يجب الإبقاء على مطلب واحد على الأقل داخل المبحث');
        return;
      }

      const updated = tree.map((mb, mbI) => {
        if (mbI === mabhathIdx) {
          const updatedChildren = mb.children
            .filter((_, mI) => mI !== matlabIdx)
            .map((m, idx) => ({ ...m, order: idx + 1 }));
          return { ...mb, children: updatedChildren };
        }
        return mb;
      });
      setTree(updated);
    } else {
      if (tree.length <= 1) {
        setError('يجب الإبقاء على مطلب واحد على الأقل في خطة البحث');
        return;
      }
      const updated = tree.filter((_, mI) => mI !== matlabIdx).map((m, idx) => ({
        ...m,
        order: idx + 1
      }));
      setTree(updated);
    }
  };

  // 6. DELETE BRANCH
  const handleDeleteBranch = (mabhathIdx, matlabIdx, branchIdx) => {
    if (hasMabhath) {
      const updated = tree.map((mb, mbI) => {
        if (mbI === mabhathIdx) {
          const updatedChildren = mb.children.map((matlab, mI) => {
            if (mI === matlabIdx) {
              const updatedBranches = (matlab.children || [])
                .filter((_, bI) => bI !== branchIdx)
                .map((b, idx) => ({ ...b, order: idx + 1 }));
              return { ...matlab, children: updatedBranches };
            }
            return matlab;
          });
          return { ...mb, children: updatedChildren };
        }
        return mb;
      });
      setTree(updated);
    } else {
      const updated = tree.map((matlab, mI) => {
        if (mI === matlabIdx) {
          const updatedBranches = (matlab.children || [])
            .filter((_, bI) => bI !== branchIdx)
            .map((b, idx) => ({ ...b, order: idx + 1 }));
          return { ...matlab, children: updatedBranches };
        }
        return matlab;
      });
      setTree(updated);
    }
  };

  // 7. EDIT TITLE HANDLERS
  const handleMabhathTitleChange = (mbIdx, newTitle) => {
    const updated = [...tree];
    updated[mbIdx].title = newTitle;
    setTree(updated);
  };

  const handleMatlabTitleChange = (mbIdx, mIdx, newTitle) => {
    if (hasMabhath) {
      const updated = [...tree];
      updated[mbIdx].children[mIdx].title = newTitle;
      setTree(updated);
    } else {
      const updated = [...tree];
      updated[mIdx].title = newTitle;
      setTree(updated);
    }
  };

  const handleBranchTitleChange = (mbIdx, mIdx, bIdx, newTitle) => {
    if (hasMabhath) {
      const updated = [...tree];
      updated[mbIdx].children[mIdx].children[bIdx].title = newTitle;
      setTree(updated);
    } else {
      const updated = [...tree];
      updated[mIdx].children[bIdx].title = newTitle;
      setTree(updated);
    }
  };

  // 8. CONFIRM AND PERSIST
  const handleConfirmStructure = async () => {
    setSaving(true);
    setError(null);

    try {
      const flattenedTopics = flattenSemanticTreeToTopics(tree);

      // Build backward-compatible detectedMataleeb array
      const detectedMataleeb = flattenedTopics.map((t) => ({
        id: t.topicId,
        type: t.nodeType || 'matlab',
        title: t.h1Title,
        order: t.order,
        parentId: t.mabhathId || null,
        branches: t.branches
      }));

      const res = await api.patch(`/researches/${research._id}/structure`, {
        tree,
        mataleeb: detectedMataleeb,
        confirmed: true
      });

      if (res.data?.success) {
        if (res.data.data?.research && onSave) {
          await onSave(res.data.data.research);
        }
        if (onNext) onNext();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء تأكيد هيكلية البحث');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        {/* Header with Semantic Level Indicators */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-800">
                <FolderTree className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-cairo">
                  ٣. مراجعة وتأكيد الهيكلية الأكاديمية (شجرة المباحث والمطالب)
                </h2>
                <p className="text-xs text-slate-500 font-amiri mt-0.5">
                  {hasMabhath
                    ? 'الهيكل المعتمد: المبحث (مستوى أول رئيسي) ➔ المطالب التابعة ➔ الفروع'
                    : 'الهيكل المعتمد: المطالب (مستوى أول رئيسي) ➔ الفروع التابعة'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleAddMabhath}
              className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 font-bold border-teal-600 text-teal-900 bg-teal-50/50 hover:bg-teal-100/70 shadow-sm"
              title="إضافة مبحث رئيسي جديد لتنظيم المطالب تحته"
            >
              <Plus className="w-4 h-4 text-teal-700" />
              <span>{hasMabhath ? 'إضافة مبحث آخر' : '＋ إضافة مبحث رئيسي'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddMatlab(0)}
              className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 font-bold border-slate-300 text-slate-800 hover:bg-slate-100 shadow-sm"
              title="إضافة مطلب جديد"
            >
              <Plus className="w-4 h-4 text-slate-600" />
              <span>إضافة مطلب</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Empty State when no structure exists */}
        {tree.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 space-y-4">
            <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <FolderTree className="w-8 h-8 text-teal-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 font-cairo">لا توجد هيكلية مضافة بعد</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto font-amiri leading-relaxed">
              يمكنك إضافة مباحث أو مطالب يدوياً، أو استخراجها آلياً من نص المقدمة وخطة البحث.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleAddMatlab(0)}
                className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مطلب</span>
              </button>
              <button
                type="button"
                onClick={handleAddMabhath}
                className="btn btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-teal-700" />
                <span>إضافة مبحث</span>
              </button>
            </div>
          </div>
        ) : hasMabhath ? (
          <div className="space-y-6">
            {tree.map((mabhath, mbIdx) => {
              const mbOrdinal = getArabicOrdinal(mbIdx + 1);
              const cleanMbTitle = stripAcademicPrefix(mabhath.title) || mabhath.title;

              return (
                <div
                  key={mabhath.id || mbIdx}
                  className="border-2 border-teal-700/80 rounded-2xl p-5 bg-teal-50/20 shadow-sm space-y-4 transition-all"
                >
                  {/* LEVEL 1: MABHATH HEADER (18pt Bold Centered) */}
                  <div className="flex items-center justify-between gap-3 border-b border-teal-200/80 pb-3.5">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="px-3.5 py-1.5 rounded-xl bg-teal-800 text-white font-bold text-sm font-cairo shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                        <FolderTree className="w-4 h-4" />
                        <span>المبحث {mbOrdinal}</span>
                      </span>

                      <input
                        type="text"
                        value={cleanMbTitle}
                        onChange={(e) => handleMabhathTitleChange(mbIdx, e.target.value)}
                        className="input-field font-bold font-amiri text-lg text-teal-950 bg-white border-teal-300 focus:border-teal-700 text-center flex-1"
                        placeholder="عنوان المبحث الرئيسي..."
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMabhath(mbIdx)}
                      title="حذف هذا المبحث"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* LEVEL 2: MATALEEB UNDER THIS MABHATH */}
                  <div className="pr-4 sm:pr-6 space-y-4 border-r-4 border-teal-600/60 mr-2">
                    <div className="text-xs font-bold text-teal-900 font-cairo flex items-center justify-between">
                      <span>المطالب التابعة للمبحث {mbOrdinal}:</span>
                      <span className="text-[11px] text-slate-500 font-amiri">
                        ({(mabhath.children || []).length} مطالب)
                      </span>
                    </div>

                    {(mabhath.children || []).map((matlab, mIdx) => {
                      const matlabOrdinal = getArabicOrdinal(mIdx + 1);
                      const cleanMatlabTitle = stripAcademicPrefix(matlab.title) || matlab.title;

                      return (
                        <div
                          key={matlab.id || mIdx}
                          className="border border-slate-200/90 rounded-xl p-4 bg-white shadow-sm space-y-3"
                        >
                          {/* Matlab Header (Level 2) */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-white font-bold text-xs font-cairo whitespace-nowrap">
                                المطلب {matlabOrdinal}
                              </span>

                              <input
                                type="text"
                                value={cleanMatlabTitle}
                                onChange={(e) => handleMatlabTitleChange(mbIdx, mIdx, e.target.value)}
                                className="input-field font-bold font-amiri text-base text-slate-900 bg-slate-50/50 border-slate-300 focus:bg-white flex-1"
                                placeholder="عنوان المطلب..."
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteMatlab(mbIdx, mIdx)}
                              title="حذف هذا المطلب"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* LEVEL 3: BRANCHES UNDER THIS MATLAB */}
                          <div className="pr-6 space-y-2 border-r-2 border-teal-300 mr-2">
                            {(matlab.children || []).map((branch, bIdx) => {
                              const branchOrdinal = getArabicOrdinal(bIdx + 1);
                              const cleanBranchTitle = stripAcademicPrefix(branch.title) || branch.title;

                              return (
                                <div key={branch.id || bIdx} className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-teal-700 whitespace-nowrap font-cairo">
                                    الفرع {branchOrdinal}:
                                  </span>

                                  <input
                                    type="text"
                                    value={cleanBranchTitle}
                                    onChange={(e) =>
                                      handleBranchTitleChange(mbIdx, mIdx, bIdx, e.target.value)
                                    }
                                    className="input-field text-sm font-amiri bg-slate-50 border-slate-200 focus:bg-white py-1.5"
                                    placeholder="عنوان الفرع..."
                                  />

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBranch(mbIdx, mIdx, bIdx)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                                    title="حذف الفرع"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}

                            <button
                              type="button"
                              onClick={() => handleAddBranch(mbIdx, mIdx)}
                              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 pt-1 font-cairo"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>إضافة فرع لهذا المطلب</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handleAddMatlab(mbIdx)}
                      className="btn btn-secondary text-xs py-2 px-3 w-full border-dashed border-teal-400 text-teal-800 bg-white hover:bg-teal-50 flex items-center justify-center gap-1.5 font-bold font-cairo shadow-sm"
                    >
                      <Plus className="w-4 h-4 text-teal-700" />
                      <span>＋ إضافة مطلب جديد تحت المبحث {mbOrdinal}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ======================================================== */
          /* CASE 2: NO MABHATH (Mataleeb are Level 1 Main Topics)    */
          /* ======================================================== */
          <div className="space-y-4">
            {tree.map((matlab, mIdx) => {
              const matlabOrdinal = getArabicOrdinal(mIdx + 1);
              const cleanMatlabTitle = stripAcademicPrefix(matlab.title) || matlab.title;

              return (
                <div
                  key={matlab.id || mIdx}
                  className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 hover:bg-slate-50 transition shadow-sm space-y-3"
                >
                  {/* Level 1: Matlab Header (Main Topic when no Mabhath) */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1">
                      <span className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-sm font-cairo shadow-sm">
                        {mIdx + 1}
                      </span>

                      <span className="text-sm font-bold text-teal-900 font-cairo whitespace-nowrap">
                        المطلب {matlabOrdinal}:
                      </span>

                      <input
                        type="text"
                        value={cleanMatlabTitle}
                        onChange={(e) => handleMatlabTitleChange(0, mIdx, e.target.value)}
                        className="input-field font-bold font-amiri text-base bg-white border-slate-300 focus:border-teal-700 flex-1"
                        placeholder="عنوان المطلب الرئيسي..."
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMatlab(0, mIdx)}
                      title="حذف هذا المطلب"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Level 2: Branches under this Matlab */}
                  <div className="pr-6 space-y-2 border-r-2 border-teal-300 mr-3">
                    {(matlab.children || []).map((branch, bIdx) => {
                      const branchOrdinal = getArabicOrdinal(bIdx + 1);
                      const cleanBranchTitle = stripAcademicPrefix(branch.title) || branch.title;

                      return (
                        <div key={branch.id || bIdx} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-teal-700 whitespace-nowrap font-cairo">
                            الفرع {branchOrdinal}:
                          </span>

                          <input
                            type="text"
                            value={cleanBranchTitle}
                            onChange={(e) => handleBranchTitleChange(0, mIdx, bIdx, e.target.value)}
                            className="input-field text-sm font-amiri bg-white border-slate-200 py-1.5"
                            placeholder="عنوان الفرع..."
                          />

                          <button
                            type="button"
                            onClick={() => handleDeleteBranch(0, mIdx, bIdx)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                            title="حذف الفرع"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handleAddBranch(0, mIdx)}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 pt-1 font-cairo"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة فرع لهذا المطلب</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Navigation & Confirm Action */}
        <div className="pt-6 border-t border-slate-200 mt-6 flex items-center justify-between">
          <button type="button" onClick={onPrev} className="btn btn-secondary">
            <ArrowRight className="w-4 h-4" />
            <span>السابق (المقدمة)</span>
          </button>

          <button
            type="button"
            onClick={handleConfirmStructure}
            disabled={saving}
            className="btn btn-primary px-8 py-3 text-base shadow-md shadow-teal-700/20 flex items-center gap-2 font-bold font-cairo"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{saving ? 'جاري التأكيد...' : 'تأكيد الهيكلية والبدء في المحتوى'}</span>
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step3StructureReview;
