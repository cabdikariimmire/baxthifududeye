const Research = require('../models/Research');
const ActivityLog = require('../models/ActivityLog');
const AIService = require('../services/ai/aiService');
const DocumentBuilder = require('../services/document/documentBuilder');
const { extractReferencesFromResearch } = require('../services/references/extractor');
const TOCBuilder = require('../services/toc/tocBuilder');
const PDFGenerator = require('../services/pdf/pdfGenerator');
const config = require('../config/env');
const {
  normalizeToSemanticTree,
  flattenSemanticTreeToTopics
} = require('../services/document/academicHierarchy');
const {
  RESEARCH_FONTS,
  DEFAULT_FONT_ID,
  isValidFontId,
  normalizeFontId
} = require('../config/researchFonts');

// 1. Create Research Project
const createResearch = async (req, res, next) => {
  try {
    const { title, borderId, templateId, fontFamily, cover } = req.body;

    const research = await Research.create({
      userId: req.user._id,
      title: title || cover?.title || '',
      borderId: borderId || 'none',
      templateId: templateId || 'template-default-a4',
      fontFamily: fontFamily ? normalizeFontId(fontFamily) : DEFAULT_FONT_ID,
      currentStep: 1,
      status: 'draft',
      cover: cover || {}
    });

    ActivityLog.record({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'research_created',
      targetId: String(research._id),
      details: `إنشاء بحث جديد: "${research.title || 'بدون عنوان'}"`
    });

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء مشروع البحث بنجاح',
      data: { research }
    });
  } catch (err) {
    next(err);
  }
};

// 2. List User's Researches
const listResearches = async (req, res, next) => {
  try {
    const researches = await Research.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select('title status currentStep borderId fontFamily cover updatedAt createdAt');

    return res.json({
      success: true,
      data: { researches }
    });
  } catch (err) {
    next(err);
  }
};

// 3. Get Single Research by ID
const getResearchById = async (req, res, next) => {
  try {
    const research = await Research.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!research) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'مشروع البحث غير موجود'
      });
    }

    return res.json({
      success: true,
      data: { research }
    });
  } catch (err) {
    next(err);
  }
};

// 4. Update Research (Progressive Saving)
const updateResearch = async (req, res, next) => {
  try {
    const allowedUpdates = [
      'title',
      'currentStep',
      'status',
      'borderId',
      'templateId',
      'fontFamily',
      'cover',
      'introduction',
      'structure',
      'topics',
      'conclusion',
      'references',
      'toc'
    ];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (updates.fontFamily !== undefined) {
      if (!isValidFontId(updates.fontFamily)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_FONT',
          message: 'نوع الخط المحدد غير معتمد'
        });
      }
      updates.fontFamily = normalizeFontId(updates.fontFamily);
    }

    const research = await Research.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!research) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'مشروع البحث غير موجود'
      });
    }

    return res.json({
      success: true,
      message: 'تم حفظ التعديلات بنجاح',
      data: { research }
    });
  } catch (err) {
    next(err);
  }
};

// 5. Delete Research
const deleteResearch = async (req, res, next) => {
  try {
    const research = await Research.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!research) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'مشروع البحث غير موجود'
      });
    }

    return res.json({
      success: true,
      message: 'تم حذف مشروع البحث بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

// 5.5. AI Generate Introduction & Plan tailored to research title & structure
const generateIntroduction = async (req, res, next) => {
  try {
    const research = await Research.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!research) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'مشروع البحث غير موجود'
      });
    }

    const { title, structure, mataleeb, topics } = req.body || {};

    const researchTitle = title || research.cover?.title || research.title || 'بحث علمي';
    const currentStructure = structure || research.structure || {};
    const currentMataleeb = mataleeb || research.structure?.detectedMataleeb || [];
    const currentTopics = topics || research.topics || [];

    const aiResult = await AIService.generateIntroduction({
      userId: req.user._id,
      researchId: research._id,
      title: researchTitle,
      structure: currentStructure,
      mataleeb: currentMataleeb,
      topics: currentTopics
    });

    // Update research introduction
    research.introduction.text = aiResult.fullText;
    if (aiResult.opening) {
      research.introduction.opening = aiResult.opening;
    }
    await research.save();

    return res.json({
      success: true,
      message: 'تمت صياغة المقدمة وخطة البحث بنجاح',
      data: {
        introduction: aiResult,
        research
      }
    });
  } catch (err) {
    next(err);
  }
};

// 6. AI Analyze Introduction
const analyzeIntroduction = async (req, res, next) => {
  try {
    const { text } = req.body;
    const research = await Research.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!research) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'مشروع البحث غير موجود'
      });
    }

    const aiResult = await AIService.analyzeIntroduction({
      userId: req.user._id,
      researchId: research._id,
      text
    });

    const normalizedTree = normalizeToSemanticTree(aiResult.tree || aiResult.mataleeb);
    research.introduction.text = text;
    research.structure.tree = normalizedTree;
    research.structure.detectedMataleeb = normalizedTree;
    research.structure.confirmed = false;
    research.currentStep = 3;
    research.status = 'structure_review';
    await research.save();

    return res.json({
      success: true,
      message: `تم استخراج ${normalizedTree.length} عناصر رئيسية في خطة البحث بنجاح`,
      data: {
        analysis: {
          ...aiResult,
          tree: normalizedTree,
          mataleeb: normalizedTree
        },
        research
      }
    });
  } catch (err) {
    next(err);
  }
};

// 7. Confirm or Edit Structure
const updateStructure = async (req, res, next) => {
  try {
    const { tree, mataleeb, confirmed } = req.body;
    const research = await Research.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!research) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'مشروع البحث غير موجود'
      });
    }

    const normalizedTree = normalizeToSemanticTree(tree || mataleeb);
    research.structure.tree = normalizedTree;
    research.structure.detectedMataleeb = normalizedTree;
    research.structure.confirmed = confirmed !== undefined ? confirmed : true;

    // Initialize or sync topics array using flattenSemanticTreeToTopics
    const flattenedTopics = flattenSemanticTreeToTopics(normalizedTree);
    const existingTopicsMap = new Map((research.topics || []).map((t) => [t.topicId || t.structureNodeId, t]));

    research.topics = flattenedTopics.map((t, idx) => {
      const topicId = t.topicId || `topic-${idx + 1}`;
      const existing = existingTopicsMap.get(topicId);
      return {
        topicId,
        structureNodeId: topicId,
        nodeType: t.nodeType || 'matlab',
        order: idx + 1,
        h1Title: t.h1Title,
        mabhathId: t.mabhathId || null,
        mabhathTitle: t.mabhathTitle || null,
        mabhathOrder: t.mabhathOrder || null,
        matlabOrder: t.matlabOrder || idx + 1,
        status: existing?.status || 'incomplete',
        branches: (t.branches || []).map((b, bIdx) => ({
          id: b.id || `branch-${topicId}-${bIdx + 1}`,
          type: 'branch',
          title: typeof b === 'string' ? b : b.title,
          order: b.order || bIdx + 1,
          parentId: topicId
        })),
        rawContent: existing?.rawContent || '',
        blocks: existing?.blocks && existing.blocks.length > 0
          ? existing.blocks.map((blk, bIdx) => (bIdx === 0 && blk.type === 'h1' ? { ...blk, text: t.h1Title } : blk))
          : [{ type: 'h1', text: t.h1Title }],
        footnotes: existing?.footnotes || []
      };
    });

    if (confirmed) {
      research.currentStep = 4;
      research.status = 'in_progress';
    }

    await research.save();

    return res.json({
      success: true,
      message: 'تم تأكيد وحفظ هيكلية البحث بنجاح',
      data: { research }
    });
  } catch (err) {
    next(err);
  }
};


// 9. Save Topic Content & Footnotes
const saveTopic = async (req, res, next) => {
  try {
    const { id, topicId } = req.params;
    const { rawContent, blocks, footnotes, h1Title, status } = req.body;

    const research = await Research.findOne({ _id: id, userId: req.user._id });
    if (!research) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'البحث غير موجود' });
    }

    const topicIndex = research.topics.findIndex((t) => t.topicId === topicId || t.structureNodeId === topicId);
    if (topicIndex === -1) {
      research.topics.push({
        topicId,
        structureNodeId: topicId,
        order: research.topics.length + 1,
        h1Title: h1Title || `المطلب ${research.topics.length + 1}`,
        status: status || 'in_progress',
        rawContent: rawContent || '',
        blocks: blocks || [],
        footnotes: footnotes || []
      });
    } else {
      if (h1Title) research.topics[topicIndex].h1Title = h1Title;
      if (status) research.topics[topicIndex].status = status;
      if (rawContent !== undefined) research.topics[topicIndex].rawContent = rawContent;
      if (blocks !== undefined) research.topics[topicIndex].blocks = blocks;
      if (footnotes !== undefined) research.topics[topicIndex].footnotes = footnotes;
    }

    await research.save();

    return res.json({
      success: true,
      message: 'تم حفظ المطلب والهوامش بنجاح',
      data: { research }
    });
  } catch (err) {
    next(err);
  }
};

// 10. Auto Generate References from Footnotes
const generateReferences = async (req, res, next) => {
  try {
    const research = await Research.findOne({ _id: req.params.id, userId: req.user._id });
    if (!research) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'البحث غير موجود' });
    }

    const references = await extractReferencesFromResearch(research, req.user._id);
    research.references = references;
    research.currentStep = 7;
    await research.save();

    return res.json({
      success: true,
      message: `تم استخراج ${references.length} مصادر ومراجع بنجاح مع إزالة أرقام الأجزاء والصفحات`,
      data: {
        references,
        research
      }
    });
  } catch (err) {
    next(err);
  }
};

// 11. Generate TOC & Paginate
const generateTOC = async (req, res, next) => {
  try {
    const research = await Research.findOne({ _id: req.params.id, userId: req.user._id });
    if (!research) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'البحث غير موجود' });
    }

    const documentModel = DocumentBuilder.buildDocument(research);
    research.toc = documentModel.toc;
    research.documentMetadata.totalPages = documentModel.totalPages;
    research.currentStep = 8;
    await research.save();

    return res.json({
      success: true,
      message: 'تم توليد فهرس الموضوعات وترقيم الصفحات النهائي بنجاح',
      data: {
        toc: documentModel.toc,
        totalPages: documentModel.totalPages,
        research
      }
    });
  } catch (err) {
    next(err);
  }
};

// 12. Get Complete Document Preview Model
const getPreview = async (req, res, next) => {
  try {
    const research = await Research.findOne({ _id: req.params.id, userId: req.user._id });
    if (!research) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'البحث غير موجود' });
    }

    const documentModel = DocumentBuilder.buildDocument(research);

    return res.json({
      success: true,
      data: {
        document: documentModel
      }
    });
  } catch (err) {
    next(err);
  }
};

// 13. Upload or remove University Logo
const uploadLogo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const research = await Research.findOne({ _id: id, userId: req.user._id });
    if (!research) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'البحث غير موجود' });
    }

    if (req.body.action === 'remove') {
      research.cover.logoUrl = '';
      await research.save();
      return res.json({
        success: true,
        message: 'تمت إزالة الشعار بنجاح',
        data: { logoUrl: '', research }
      });
    }

    let logoUrl = '';
    if (req.file) {
      logoUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.logoUrl) {
      logoUrl = req.body.logoUrl;
    }

    research.cover.logoUrl = logoUrl;
    await research.save();

    return res.json({
      success: true,
      message: 'تم حفظ وتحديث الشعار بنجاح',
      data: { logoUrl, research }
    });
  } catch (err) {
    next(err);
  }
};

// 14. AI Full Document Analysis
const analyzeFullDocument = async (req, res, next) => {
  try {
    const { text } = req.body;
    const { id } = req.params;

    if (!text || text.trim().length < 20) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_INPUT',
        message: 'يرجى إدخال نص البحث كاملاً للتحليل'
      });
    }

    const research = await Research.findOne({ _id: id, userId: req.user._id });
    if (!research) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'البحث غير موجود' });
    }

    const analysis = await AIService.analyzeFullDocument({
      userId: req.user._id,
      researchId: research._id,
      text
    });

    return res.json({
      success: true,
      message: 'تم تحليل المستند الكامل بنجاح',
      data: { analysis }
    });
  } catch (err) {
    next(err);
  }
};

// 15. Apply Approved Full Document Structure
const applyFullDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { analysis } = req.body;

    if (!analysis) {
      return res.status(400).json({ success: false, message: 'بيانات التحليل مطلوبة' });
    }

    const research = await Research.findOne({ _id: id, userId: req.user._id });
    if (!research) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'البحث غير موجود' });
    }

    if (analysis.title) research.title = analysis.title;
    if (analysis.cover) {
      research.cover = {
        ...research.cover.toObject(),
        ...analysis.cover
      };
    }
    if (analysis.introduction) {
      research.introduction = {
        opening: analysis.introduction.opening || research.introduction.opening,
        text: analysis.introduction.text || '',
        planSummary: analysis.introduction.planSummary || ''
      };
    }
    if (analysis.mataleeb && Array.isArray(analysis.mataleeb)) {
      research.structure.detectedMataleeb = analysis.mataleeb.map((m, idx) => ({
        title: m.title,
        order: idx + 1,
        branches: m.branches || []
      }));
      research.structure.confirmed = true;

      research.topics = analysis.mataleeb.map((m, idx) => ({
        topicId: `topic-${idx + 1}`,
        order: idx + 1,
        h1Title: m.title,
        branches: m.branches || [],
        rawContent: m.rawContent || '',
        blocks:
          m.blocks && m.blocks.length > 0
            ? m.blocks
            : [
                { type: 'h1', text: m.title },
                { type: 'paragraph', text: m.rawContent || '' }
              ],
        footnotes: (m.footnotes || []).map((fn, fIdx) => ({
          footnoteId: `fn-${idx + 1}-${fIdx + 1}`,
          number: fIdx + 1,
          marker: `(${fIdx + 1})`,
          text: fn.text
        })),
        status: 'complete'
      }));
    }
    if (analysis.conclusion) {
      research.conclusion = {
        title: analysis.conclusion.title || 'الخاتمة',
        text: analysis.conclusion.text || '',
        points: analysis.conclusion.points || []
      };
    }
    if (analysis.references && Array.isArray(analysis.references)) {
      research.references = analysis.references.map((r, idx) => ({
        order: idx + 1,
        book: r.book,
        author: r.author || '',
        publisher: r.publisher || '',
        city: r.city || '',
        edition: r.edition || '',
        year: r.year || '',
        rawFootnote: r.rawFootnote || ''
      }));
    }

    // Build paginated document to calculate TOC
    const docModel = DocumentBuilder.buildDocument(research);
    research.toc = docModel.toc;
    research.documentMetadata.totalPages = docModel.totalPages;
    research.currentStep = 9;
    research.status = 'ready';

    await research.save();

    return res.json({
      success: true,
      message: 'تم اعتماد وتطبيق نتائج التحليل الذكي على نموذج البحث بنجاح',
      data: { research, document: docModel }
    });
  } catch (err) {
    next(err);
  }
};

// 16. Export PDF (Strictly PDF-Only)
const exportPDF = async (req, res, next) => {
  try {
    const research = await Research.findOne({ _id: req.params.id, userId: req.user._id });
    if (!research) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'مشروع البحث غير موجود أو لا تملك صلاحية الوصول إليه'
      });
    }

    if (!research.title && !research.cover?.title && !research.topic?.title) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_FAILED',
        message: 'عنوان البحث غير محدد. يرجى إدخال عنوان البحث في صفحة الغلاف.'
      });
    }

    const pdfBuffer = await PDFGenerator.generatePDF(research);

    research.status = 'exported';
    research.documentMetadata.lastExportedAt = new Date();
    await research.save();

    ActivityLog.record({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'pdf_exported',
      targetId: String(research._id),
      details: `تصدير ملف PDF للبحث: "${research.title || research.cover?.title || 'بحث أكاديمي'}"`
    });

    const safeTitle = encodeURIComponent((research.title || research.cover?.title || 'research').replace(/\s+/g, '_'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="research_${research._id}.pdf"; filename*=UTF-8''${safeTitle}.pdf`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('[PDF Export Error]:', err);
    return res.status(500).json({
      success: false,
      code: 'PDF_EXPORT_FAILED',
      message: 'تعذر إنشاء ملف PDF. حاول مرة أخرى.'
    });
  }
};

// 17. Get Printable HTML
const getPrintableHTML = async (req, res, next) => {
  try {
    const research = await Research.findOne({ _id: req.params.id, userId: req.user._id });
    if (!research) {
      return res.status(404).send('Research not found');
    }

    const documentModel = DocumentBuilder.buildDocument(research);
    const html = PDFGenerator.buildDocumentHTML(documentModel);

    return res.send(html);
  } catch (err) {
    next(err);
  }
};

// 18. Get Available Research Fonts
const getResearchFonts = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      data: {
        fonts: RESEARCH_FONTS,
        defaultFontId: DEFAULT_FONT_ID
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createResearch,
  listResearches,
  getResearchById,
  updateResearch,
  deleteResearch,
  generateIntroduction,
  analyzeIntroduction,
  updateStructure,
  saveTopic,
  generateReferences,
  generateTOC,
  getPreview,
  uploadLogo,
  analyzeFullDocument,
  applyFullDocument,
  exportPDF,
  getPrintableHTML,
  getResearchFonts
};

