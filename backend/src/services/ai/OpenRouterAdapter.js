const AIAdapter = require('./AIAdapter');
const {
  systemPrompt,
  buildIntroductionPrompt,
  buildGenerateIntroductionPrompt,
  buildTopicStructuringPrompt,
  buildReferenceExtractionPrompt,
  buildFullDocumentAnalysisPrompt
} = require('./prompts');
const {
  introductionAnalysisSchema,
  introductionGenerationSchema,
  topicStructureSchema,
  bibliographySchema,
  fullDocumentAnalysisSchema
} = require('./schemas');
const {
  detectAcademicLevel,
  getHighestAcademicLevel,
  resolveAcademicHeadingStyle,
  parsePlanTextToSemanticTree,
  normalizeToSemanticTree,
  ACADEMIC_LEVELS,
  getArabicOrdinal
} = require('../document/academicHierarchy');
const env = require('../../config/env');
const aiConfig = require('../../config/ai');
const { stripVolumeAndPage } = require('../references/normalizer');

class OpenRouterAdapter extends AIAdapter {
  constructor(customConfig = {}) {
    super(customConfig);
    this.apiKey = customConfig.apiKey || env.ai.apiKey;
    this.model = customConfig.model || env.ai.model || aiConfig.defaultModel;
    this.baseUrl = customConfig.baseUrl || aiConfig.openrouterBaseUrl;
    this.temperature = customConfig.temperature !== undefined ? customConfig.temperature : aiConfig.temperature;
  }

  /**
   * Helper to execute chat completion through OpenRouter / NVIDIA Gateway
   */
  async _callOpenRouter(messages, schema) {
    if (!this.apiKey || this.apiKey.trim() === '' || this.apiKey === 'your_api_key_here') {
      throw new Error('OPENROUTER_API_KEY_NOT_CONFIGURED');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.frontendUrl,
        'X-Title': 'AI Academic Research Assistant'
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        temperature: this.temperature,
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI provider');
    }

    // Clean JSON content if wrapped in markdown blocks
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(jsonStr);
    if (schema) {
      return schema.parse(parsed);
    }
    return parsed;
  }

  /**
   * Generate academic introduction and research plan dynamically tailored to title & structure
   */
  async generateIntroduction(context = {}) {
    try {
      const highestLevel = getHighestAcademicLevel(
        context.mataleeb || context.topics || [],
        { structure: { detectedMataleeb: context.mataleeb || [] } }
      );
      const prompt = buildGenerateIntroductionPrompt({ ...context, highestLevel });
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ];
      return await this._callOpenRouter(messages, introductionGenerationSchema);
    } catch (err) {
      console.error(`[AI Adapter] Introduction generation error: ${err.message}`);
      throw new Error('خدمة الذكاء الاصطناعي غير متاحة حالياً لإنشاء المقدمة. يرجى إدخال محتوى المقدمة يدوياً أو التحقق من مفتاح الخدمة.');
    }
  }


  /**
   * Analyze introduction and plan
   */
  async analyzeIntroduction(text) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildIntroductionPrompt(text) }
      ];
      const res = await this._callOpenRouter(messages, introductionAnalysisSchema);
      const rawItems = (res.tree && res.tree.length > 0) ? res.tree : (res.mataleeb || []);
      const normalizedTree = normalizeToSemanticTree(rawItems.length > 0 ? rawItems : parsePlanTextToSemanticTree(text));

      const mataleebFormatted = normalizedTree.map((m, idx) => {
        const ordinal = getArabicOrdinal(m.order || idx + 1);
        const isMabhath = m.type === ACADEMIC_LEVELS.MABHATH;
        const prefix = isMabhath ? `المبحث ${ordinal}: ` : `المطلب ${ordinal}: `;
        const fullTitle = m.title.includes(prefix) ? m.title : `${prefix}${m.title}`;
        return {
          ...m,
          title: fullTitle,
          branches: (m.children || []).map((b, bIdx) => {
            const bOrdinal = getArabicOrdinal(b.order || bIdx + 1);
            const bPrefix = `الفرع ${bOrdinal}: `;
            return {
              ...b,
              title: b.title.includes(bPrefix) ? b.title : `${bPrefix}${b.title}`
            };
          })
        };
      });

      return {
        title: res.title || 'خطة البحث المستخرجة',
        summary: res.summary || 'تم استخراج هيكلية البحث من نص الخطة بنجاح.',
        tree: normalizedTree,
        mataleeb: mataleebFormatted
      };
    } catch (err) {
      console.warn(`[AI Adapter] Using heuristic fallback for introduction analysis: ${err.message}`);
      return this._heuristicIntroductionAnalysis(text);
    }
  }

  /**
   * Structure topic content into H1/H2/H3 and paragraphs
   */
  async structureTopicContent(title, content) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildTopicStructuringPrompt(title, content) }
      ];
      return await this._callOpenRouter(messages, topicStructureSchema);
    } catch (err) {
      console.warn(`[AI Adapter] Using heuristic fallback for topic structuring: ${err.message}`);
      return this._heuristicTopicStructuring(title, content);
    }
  }

  /**
   * Extract references from footnotes
   */
  async extractBibliography(footnotes) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildReferenceExtractionPrompt(footnotes) }
      ];
      return await this._callOpenRouter(messages, bibliographySchema);
    } catch (err) {
      console.warn(`[AI Adapter] Using heuristic fallback for reference extraction: ${err.message}`);
      return this._heuristicReferenceExtraction(footnotes);
    }
  }

  /**
   * Analyze complete full research document once
   */
  async analyzeFullDocument(fullText) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildFullDocumentAnalysisPrompt(fullText) }
      ];
      return await this._callOpenRouter(messages, fullDocumentAnalysisSchema);
    } catch (err) {
      console.warn(`[AI Adapter] Using heuristic fallback for full document analysis: ${err.message}`);
      return this._heuristicFullDocumentAnalysis(fullText);
    }
  }

  // ==========================================
  // Deterministic Heuristic Fallbacks
  // ==========================================

  _heuristicGenerateIntroduction({ title = '', structure = {}, mataleeb = [], topics = [] }) {
    const researchTitle = title.trim() || 'الموضوع المعني';
    const items = mataleeb && mataleeb.length > 0 ? mataleeb : (structure?.detectedMataleeb || topics || []);
    
    // Dynamically detect highest level
    const highestLevel = getHighestAcademicLevel(items, { structure: { detectedMataleeb: items } });
    const isMabhath = highestLevel === ACADEMIC_LEVELS.MABHATH;

    const opening = 'الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد وعلى آله وصحبه أجمعين، أما بعد:';

    // Tailored academic introductory paragraph
    const p1 = `إن دراسة موضوع "${researchTitle}" تعد من المباحث العلمية الجليلة التي تستحق العناية والبحث، لما يشتمل عليه من مسائل دقيقة وأحكام منهجية تسهم في إثراء المعرفة الأكاديمية وربط الأصول النظرية بالتطبيقات العملية المعاصرة.`;

    // Tailored academic importance paragraph
    const p2 = `وتبرز أهمية هذا البحث في كونه يسلط الضوء على الأبعاد الجوهرية لموضوع "${researchTitle}"، ويبين أصوله ومقاصده وأحكامه بأسلوب علمي تحليلي منضبط، مع بيان أثر ذلك في الواقع المعاصر بما يحقق الفهم السليم والمقاصد المنشودة.`;

    // One single transition sentence
    const sectionsCount = items.length || 3;
    const sectionsCountAr = sectionsCount === 1 ? 'مبحث واحد' : sectionsCount === 2 ? (isMabhath ? 'مبحثين' : 'مطلبين') : `${sectionsCount} ${isMabhath ? 'مباحث' : 'مطالب'}`;
    const p3 = `وقد انتظمت خطة هذا البحث وفق هيكلية أكاديمية محكمة تشتمل على ${sectionsCountAr} وخاتمة، على النحو الآتي:`;

    // Format the exact research plan
    const planLines = [];
    if (items.length > 0) {
      items.forEach((item, idx) => {
        const itemTitle = item.title || item.h1Title || `${isMabhath ? 'المبحث' : 'المطلب'} ${idx + 1}`;
        planLines.push(itemTitle);
        if (item.branches && item.branches.length > 0) {
          item.branches.forEach((b) => {
            const bTitle = b.title || b;
            planLines.push(bTitle);
          });
        }
        planLines.push(''); // blank line separation
      });
    } else {
      planLines.push(`المطلب الأول: مدخل ومفاهيم أساسية في ${researchTitle}`);
      planLines.push('الفرع الأول: المعنى اللغوي');
      planLines.push('الفرع الثاني: المعنى الاصطلاحي');
      planLines.push('');
      planLines.push(`المطلب الثاني: الأحكام والضوابط الشرعية المتعلقة بـ ${researchTitle}`);
      planLines.push('الفرع الأول: الشروط والأركان');
      planLines.push('الفرع الثاني: المسائل والمستجدات المعاصرة');
      planLines.push('');
      planLines.push(`المطلب الثالث: المقاصد والآثار التربوية لـ ${researchTitle}`);
      planLines.push('');
    }

    planLines.push('الخاتمة');

    const formattedPlan = planLines.join('\n').trim();
    const fullText = `${opening}\n\n${p1}\n\n${p2}\n\n${p3}\n\n${formattedPlan}`;

    return {
      title: 'المقدمة وخطة البحث',
      opening,
      fullText,
      plan: formattedPlan
    };
  }

  _heuristicIntroductionAnalysis(text) {
    const parsedTree = parsePlanTextToSemanticTree(text);
    const tree = parsedTree || [];

    const normalizedTree = normalizeToSemanticTree(tree);

    const mataleebFormatted = normalizedTree.map((m, idx) => {
      const ordinal = getArabicOrdinal(m.order || idx + 1);
      const isMabhath = m.type === ACADEMIC_LEVELS.MABHATH;
      const prefix = isMabhath ? `المبحث ${ordinal}: ` : `المطلب ${ordinal}: `;
      const fullTitle = m.title.includes(prefix) ? m.title : `${prefix}${m.title}`;
      return {
        ...m,
        title: fullTitle,
        branches: (m.children || []).map((b, bIdx) => {
          const bOrdinal = getArabicOrdinal(b.order || bIdx + 1);
          const bPrefix = `الفرع ${bOrdinal}: `;
          return {
            ...b,
            title: b.title.includes(bPrefix) ? b.title : `${bPrefix}${b.title}`
          };
        })
      };
    });

    return {
      title: 'خطة البحث المقترحة',
      summary: 'تم استخراج هيكلية البحث من نص الخطة والمقدمة بنجاح.',
      tree: normalizedTree,
      mataleeb: mataleebFormatted
    };
  }

  _heuristicTopicStructuring(title, content) {
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    const blocks = [];
    const extractedFootnotes = [];

    // Always begin with H1 topic header
    blocks.push({ type: 'h1', text: title });

    lines.forEach((line) => {
      // Check for Branch (الفرع)
      if (line.match(/^الفرع\s+(الأول|الثاني|الثالث|الرابع|الخامس|\d+)/)) {
        blocks.push({ type: 'h2', text: line });
      } else if (line.match(/^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|تمهيد|تنبيه)[:\-]?/)) {
        blocks.push({ type: 'h3', text: line });
      } else if (line.match(/^(\(|\（)\d+(\)|\）)/) || line.match(/^\[\d+\]/)) {
        // Line resembles a footnote definition
        extractedFootnotes.push({
          number: extractedFootnotes.length + 1,
          text: line.replace(/^[\(\（\[]\d+[\)\Reference\]\:\-\s]*/, '')
        });
      } else {
        blocks.push({ type: 'paragraph', text: line });
      }
    });

    if (blocks.length === 1) {
      blocks.push({ type: 'paragraph', text: content });
    }

    return {
      h1Title: title,
      blocks,
      extractedFootnotes
    };
  }

  _heuristicReferenceExtraction(footnotes) {
    const references = [];

    (footnotes || []).forEach((f, idx) => {
      const rawText = (typeof f === 'string' ? f : f.text || f.rawText || '').trim();
      if (!rawText) return;

      // Clean footnote from leading numbers: (1), [1], 1., etc.
      let cleaned = rawText.replace(/^\s*(?:\(\d+\)|\[\d+\]|\d+[\.\-\)]\s*)/, '').trim();

      // Project rule: Strip volume (ج / جزء / مجلد) and page (ص / صفحة / صـ) numbers
      // Preserve user-written text verbatim including repeated words
      const cleanText = stripVolumeAndPage(cleaned);
      if (!cleanText) return;

      references.push({
        order: idx + 1,
        book: cleanText,
        displayText: cleanText,
        author: '',
        publisher: '',
        city: '',
        edition: '',
        year: '',
        rawFootnote: rawText
      });
    });

    return { references };
  }

  _heuristicFullDocumentAnalysis(fullText) {
    if (!fullText || typeof fullText !== 'string') {
      return {
        title: null,
        cover: {},
        introduction: {},
        mataleeb: [],
        conclusion: { title: 'الخاتمة', points: [] },
        references: []
      };
    }

    const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);

    // 1. Extract Cover info
    const cover = {
      country: null,
      university: null,
      college: null,
      subject: null,
      title: null,
      studentName: null,
      level: null,
      supervisor: null,
      academicYear: null,
      gregorianYear: null,
      badgeColor: '#38761d'
    };

    lines.forEach((l) => {
      if (l.includes('جمهورية')) cover.country = l;
      else if (l.includes('جامعة')) cover.university = l;
      else if (l.includes('كلية')) cover.college = l;
      else if (l.match(/^(المادة|المقرر)[:\-]/)) cover.subject = l.replace(/^(المادة|المقرر)[:\-]\s*/, '');
      else if (l.match(/^(عنوان البحث|العنوان)[:\-]/)) cover.title = l.replace(/^(عنوان البحث|العنوان)[:\-]\s*/, '');
      else if (l.match(/^(إعداد الطالب|الباحث|إعداد)[:\-]/)) cover.studentName = l.replace(/^(إعداد الطالب|الباحث|إعداد)[:\-]\s*/, '');
      else if (l.match(/^(المستوى)[:\-]/)) cover.level = l.replace(/^(المستوى)[:\-]\s*/, '');
      else if (l.match(/^(المشرف|إشراف|إشراف الدكتور)[:\-]/)) cover.supervisor = l.replace(/^(المشرف|إشراف|إشراف الدكتور)[:\-]\s*/, '');
      else if (l.match(/\d{4}\s*هـ/)) cover.academicYear = l;
      else if (l.match(/\d{4}\s*م/)) cover.gregorianYear = l;
    });

    // 2. Extract Sections (Introduction, Topics, Conclusion, References)
    const introLines = [];
    const topicSections = [];
    const conclusionLines = [];
    const referenceLines = [];

    let currentSection = 'intro';
    let currentTopic = null;

    const matlabHeaderRegex = /^(المطلب\s+(الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|\d+)[^:\n]*[:\-]?\s*([^\n]+)?)/;
    const conclusionHeaderRegex = /^(الخاتمة|خاتمة البحث|النتائج والتوصيات)/;
    const refHeaderRegex = /^(المصادر والمراجع|قائمة المصادر والمراجع|المراجع)/;

    lines.forEach((line) => {
      if (refHeaderRegex.test(line)) {
        currentSection = 'references';
        return;
      }
      if (conclusionHeaderRegex.test(line)) {
        currentSection = 'conclusion';
        return;
      }
      const matlabMatch = line.match(matlabHeaderRegex);
      if (matlabMatch) {
        currentSection = 'topics';
        currentTopic = {
          title: line.replace(/^[•\-\*\d\.]+\s*/, ''),
          order: topicSections.length + 1,
          rawLines: []
        };
        topicSections.push(currentTopic);
        return;
      }

      if (currentSection === 'intro') {
        introLines.push(line);
      } else if (currentSection === 'topics' && currentTopic) {
        currentTopic.rawLines.push(line);
      } else if (currentSection === 'conclusion') {
        conclusionLines.push(line);
      } else if (currentSection === 'references') {
        referenceLines.push(line);
      }
    });

    // 3. Process Introduction
    const introOpening = introLines.find((l) => l.includes('الحمد لله')) || 'الحمد لله رب العالمين، والصلاة والسلام على رسول الله، أما بعد:';
    const introTextLines = introLines.filter((l) => !l.includes('الحمد لله') && !l.includes('جامعة') && !l.includes('كلية') && !l.includes('إعداد'));
    const introduction = {
      opening: introOpening,
      text: introTextLines.join('\n'),
      planSummary: ''
    };

    // 4. Process Topics
    const mataleeb = topicSections.map((t, idx) => {
      const structured = this._heuristicTopicStructuring(t.title, t.rawLines.join('\n'));
      return {
        title: t.title,
        order: idx + 1,
        branches: structured.blocks
          .filter((b) => b.type === 'h2')
          .map((b, bIdx) => ({ title: b.text, order: bIdx + 1 })),
        rawContent: t.rawLines.join('\n'),
        blocks: structured.blocks,
        footnotes: structured.extractedFootnotes.map((fn, fIdx) => ({
          number: fIdx + 1,
          marker: `(${fIdx + 1})`,
          text: fn.text
        }))
      };
    });

    // If no topics detected in the provided text, do not fabricate fake content (EMPTY = EMPTY)

    // 5. Process Conclusion
    const conclusionPoints = conclusionLines
      .filter((l) => l.match(/^[•\-\*\d\.]/) || l.length < 150)
      .map((l) => l.replace(/^[•\-\*\d\.]+\s*/, ''));

    const conclusion = {
      title: 'الخاتمة',
      text: conclusionLines.filter((l) => !conclusionPoints.includes(l)).join('\n') || null,
      points: conclusionPoints.length > 0 ? conclusionPoints : ['تم بحمد الله تحقيق الأهداف المرجوة من البحث.']
    };

    // 6. Process References
    const refFootnotes = referenceLines.map((l, idx) => ({ number: idx + 1, text: l }));
    const refExtraction = this._heuristicReferenceExtraction(refFootnotes);

    return {
      title: cover.title || mataleeb[0]?.title || 'بحث أكاديمي مستخرج بالذكاء الاصطناعي',
      cover,
      introduction,
      mataleeb,
      conclusion,
      references: refExtraction.references || []
    };
  }
}

module.exports = OpenRouterAdapter;
