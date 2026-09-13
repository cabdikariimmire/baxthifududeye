/**
 * Academic Heading Hierarchy Resolver (Backend)
 *
 * Core Dynamic Academic Hierarchy & Semantic Parent-Child Tree:
 *
 * CASE 1 — المبحث EXISTS:
 * Level 1: المبحث (Main Topic) -> 18pt Bold Centered (المبحث الأول / الثاني / ...)
 * Level 2: المطلب (Child under المبحث) -> 17pt Bold Right-Aligned (المطلب الأول / الثاني / ...)
 * Level 3: الفرع (Child under المطلب) -> 17pt Bold Right-Aligned (الفرع الأول / الثاني / ...)
 *
 * CASE 2 — NO المبحث:
 * Level 1: المطلب (Main Topic) -> 18pt Bold Centered (المطلب الأول / الثاني / ...)
 * Level 2: الفرع (Child under المطلب) -> 17pt Bold Right-Aligned (الفرع الأول / الثاني / ...)
 */

const ACADEMIC_LEVELS = {
  MABHATH: 'mabhath',
  MATALAB: 'matlab',
  BRANCH: 'branch',
  BODY: 'paragraph'
};

const ARABIC_ORDINALS = [
  'الأول',
  'الثاني',
  'الثالث',
  'الرابع',
  'الخامس',
  'السادس',
  'السابع',
  'الثامن',
  'التاسع',
  'العاشر',
  'الحادي عشر',
  'الثاني عشر',
  'الثالث عشر',
  'الرابع عشر',
  'الخامس عشر',
  'السادس عشر',
  'السابع عشر',
  'الثامن عشر',
  'التاسع عشر',
  'العشرون'
];

function getArabicOrdinal(num) {
  if (num >= 1 && num <= ARABIC_ORDINALS.length) {
    return ARABIC_ORDINALS[num - 1];
  }
  return String(num || 1);
}

/**
 * Strips any existing academic ordinal prefix (e.g., "المطلب الأول: ", "المبحث الثاني: ", "الفرع الأول: ")
 * to allow dynamic recalculation of numberings while preserving the exact title string.
 */
function stripAcademicPrefix(text = '') {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(
      /^(المبحث|مبحث|المطلب|مطلب|الفرع|فرع|المسألة|مسألة|الفصل|فصل)\s+(الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|الحادي\s+عشر|الثاني\s+عشر|الثالث\s+عشر|الرابع\s+عشر|الخامس\s+عشر|\d+)\s*[:：\-–—.]\s*/i,
      ''
    )
    .replace(/^(المبحث|مبحث|المطلب|مطلب|الفرع|فرع|المسألة|مسألة|الفصل|فصل)\s*[:：\-–—.]\s*/i, '')
    .trim();
}

/**
 * Detect the academic semantic level of a node, block, or raw title string
 */
function detectAcademicLevel(blockOrText) {
  if (!blockOrText) return ACADEMIC_LEVELS.BODY;

  let type = '';
  let text = '';

  if (typeof blockOrText === 'string') {
    text = blockOrText.trim();
  } else if (typeof blockOrText === 'object') {
    type = (blockOrText.type || blockOrText.nodeType || blockOrText.level || '').toLowerCase();
    text = (blockOrText.text || blockOrText.title || blockOrText.h1Title || '').trim();
  }

  // Check explicit semantic types first (strictly non-string detection when type is set)
  if (type === 'mabhath' || type === 'h1_mabhath' || type === 'level_1') {
    return ACADEMIC_LEVELS.MABHATH;
  }
  if (type === 'matlab' || type === 'matalab' || type === 'level_2') {
    return ACADEMIC_LEVELS.MATALAB;
  }
  if (type === 'branch' || type === 'h2' || type === 'h3' || type === 'subheading' || type === 'level_3') {
    return ACADEMIC_LEVELS.BRANCH;
  }

  // Text-based fallback when parsing raw text lines
  if (/^(المبحث|مبحث)(\s+|[:：\-–—.]\s*)/i.test(text)) {
    return ACADEMIC_LEVELS.MABHATH;
  }
  if (/^(المطلب|مطلب)(\s+|[:：\-–—.]\s*)/i.test(text)) {
    return ACADEMIC_LEVELS.MATALAB;
  }
  if (/^(الفرع|المسألة|فرع|مسألة|الفصل|فصل)(\s+|[:：\-–—.]\s*)/i.test(text)) {
    return ACADEMIC_LEVELS.BRANCH;
  }

  if (type === 'h1') {
    return /^(المبحث|مبحث)/i.test(text) ? ACADEMIC_LEVELS.MABHATH : ACADEMIC_LEVELS.MATALAB;
  }

  return ACADEMIC_LEVELS.BODY;
}

/**
 * Parses raw introduction/plan text directly into a canonical semantic tree
 * with exact parent-child hierarchy (Mabhath -> Matlab -> Branch, or Matlab -> Branch).
 */
function parsePlanTextToSemanticTree(text = '') {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const mabhathRegex = /^(المبحث|مبحث)\s*(الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|الحادي\s+عشر|الثاني\s+عشر|\d+)?\s*[:：\-–—.]?\s*(.*)$/i;
  const matlabRegex = /^(المطلب|مطلب)\s*(الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|الحادي\s+عشر|الثاني\s+عشر|\d+)?\s*[:：\-–—.]?\s*(.*)$/i;
  const branchRegex = /^(الفرع|المسألة|فرع|مسألة)\s*(الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|الحادي\s+عشر|الثاني\s+عشر|\d+)?\s*[:：\-–—.]?\s*(.*)$/i;

  const hasMabhathInText = lines.some((l) => mabhathRegex.test(l));

  if (hasMabhathInText) {
    const mabhathNodes = [];
    let currentMabhath = null;
    let currentMatlab = null;

    lines.forEach((line) => {
      // Ignore general intro text
      if (line.includes('الحمد لله') || line.includes('أما بعد') || line.startsWith('إن ') || line.startsWith('وتبرز ') || line.startsWith('ويسعى ') || line.startsWith('وقد انتظمت') || line.startsWith('ويتكون ') || line === 'الخاتمة') {
        return;
      }

      if (mabhathRegex.test(line)) {
        const clean = stripAcademicPrefix(line) || line;
        const mbOrder = mabhathNodes.length + 1;
        currentMabhath = {
          id: `mabhath-${mbOrder}`,
          type: ACADEMIC_LEVELS.MABHATH,
          title: clean,
          parentId: null,
          order: mbOrder,
          children: []
        };
        mabhathNodes.push(currentMabhath);
        currentMatlab = null;
        return;
      }

      if (matlabRegex.test(line)) {
        if (!currentMabhath) {
          currentMabhath = {
            id: `mabhath-${mabhathNodes.length + 1}`,
            type: ACADEMIC_LEVELS.MABHATH,
            title: 'المبحث الأول',
            parentId: null,
            order: mabhathNodes.length + 1,
            children: []
          };
          mabhathNodes.push(currentMabhath);
        }

        const clean = stripAcademicPrefix(line) || line;
        const mOrder = currentMabhath.children.length + 1;
        currentMatlab = {
          id: `matlab-${currentMabhath.id}-${mOrder}`,
          type: ACADEMIC_LEVELS.MATALAB,
          title: clean,
          parentId: currentMabhath.id,
          order: mOrder,
          children: []
        };
        currentMabhath.children.push(currentMatlab);
        return;
      }

      if (branchRegex.test(line)) {
        if (!currentMabhath) {
          currentMabhath = {
            id: `mabhath-${mabhathNodes.length + 1}`,
            type: ACADEMIC_LEVELS.MABHATH,
            title: 'المبحث الأول',
            parentId: null,
            order: mabhathNodes.length + 1,
            children: []
          };
          mabhathNodes.push(currentMabhath);
        }
        if (!currentMatlab) {
          const mOrder = currentMabhath.children.length + 1;
          currentMatlab = {
            id: `matlab-${currentMabhath.id}-${mOrder}`,
            type: ACADEMIC_LEVELS.MATALAB,
            title: 'المطلب الأول',
            parentId: currentMabhath.id,
            order: mOrder,
            children: []
          };
          currentMabhath.children.push(currentMatlab);
        }

        const clean = stripAcademicPrefix(line) || line;
        const bOrder = currentMatlab.children.length + 1;
        const branchNode = {
          id: `branch-${currentMatlab.id}-${bOrder}`,
          type: ACADEMIC_LEVELS.BRANCH,
          title: clean,
          parentId: currentMatlab.id,
          order: bOrder
        };
        currentMatlab.children.push(branchNode);
      }
    });

    return mabhathNodes;
  }

  // Case B: No Mabhath
  const matlabNodes = [];
  let currentMatlab = null;

  lines.forEach((line) => {
    if (line.includes('الحمد لله') || line.includes('أما بعد') || line.startsWith('إن ') || line.startsWith('وتبرز ') || line.startsWith('ويسعى ') || line.startsWith('وقد انتظمت') || line.startsWith('ويتكون ') || line === 'الخاتمة') {
      return;
    }

    if (matlabRegex.test(line)) {
      const clean = stripAcademicPrefix(line) || line;
      const mOrder = matlabNodes.length + 1;
      currentMatlab = {
        id: `matlab-${mOrder}`,
        type: ACADEMIC_LEVELS.MATALAB,
        title: clean,
        parentId: null,
        order: mOrder,
        children: []
      };
      matlabNodes.push(currentMatlab);
      return;
    }

    if (branchRegex.test(line)) {
      if (!currentMatlab) {
        const mOrder = matlabNodes.length + 1;
        currentMatlab = {
          id: `matlab-${mOrder}`,
          type: ACADEMIC_LEVELS.MATALAB,
          title: 'المطلب الأول',
          parentId: null,
          order: mOrder,
          children: []
        };
        matlabNodes.push(currentMatlab);
      }

      const clean = stripAcademicPrefix(line) || line;
      const bOrder = currentMatlab.children.length + 1;
      const branchNode = {
        id: `branch-${currentMatlab.id}-${bOrder}`,
        type: ACADEMIC_LEVELS.BRANCH,
        title: clean,
        parentId: currentMatlab.id,
        order: bOrder
      };
      currentMatlab.children.push(branchNode);
    }
  });

  return matlabNodes;
}

/**
 * Normalizes any research structure representation into the canonical semantic parent-child tree.
 * Strictly preserves IDs, types, parentId relationships, and exact titles.
 */
function normalizeToSemanticTree(rawStructure) {
  if (!rawStructure) return [];

  let items = [];
  if (Array.isArray(rawStructure)) {
    items = rawStructure;
  } else if (rawStructure.tree && Array.isArray(rawStructure.tree) && rawStructure.tree.length > 0) {
    items = rawStructure.tree;
  } else if (rawStructure.detectedMataleeb && Array.isArray(rawStructure.detectedMataleeb) && rawStructure.detectedMataleeb.length > 0) {
    items = rawStructure.detectedMataleeb;
  } else if (rawStructure.topics && Array.isArray(rawStructure.topics) && rawStructure.topics.length > 0) {
    items = rawStructure.topics;
  }

  if (items.length === 0) return [];

  // If already a valid normalized tree where root items have explicit 'type' and proper parent-child
  const isAlreadyTree = items.every((it) => it && it.type && Array.isArray(it.children));
  if (isAlreadyTree) {
    const hasMb = items.some((it) => it.type === ACADEMIC_LEVELS.MABHATH);
    if (hasMb) {
      return items.map((mb, mbIdx) => {
        const mbId = mb.id || `mabhath-${mbIdx + 1}`;
        const cleanMbTitle = stripAcademicPrefix(mb.title) || mb.title;
        return {
          id: mbId,
          type: ACADEMIC_LEVELS.MABHATH,
          title: cleanMbTitle,
          parentId: null,
          order: mbIdx + 1,
          children: (mb.children || []).map((m, mIdx) => {
            const mId = m.id || `matlab-${mbId}-${mIdx + 1}`;
            const cleanMTitle = stripAcademicPrefix(m.title) || m.title;
            return {
              id: mId,
              type: ACADEMIC_LEVELS.MATALAB,
              title: cleanMTitle,
              parentId: mbId,
              order: mIdx + 1,
              children: (m.children || m.branches || []).map((b, bIdx) => ({
                id: (typeof b === 'object' && b.id) ? b.id : `branch-${mId}-${bIdx + 1}`,
                type: ACADEMIC_LEVELS.BRANCH,
                title: stripAcademicPrefix(typeof b === 'string' ? b : b.title || '') || (typeof b === 'string' ? b : b.title || ''),
                parentId: mId,
                order: bIdx + 1
              }))
            };
          })
        };
      });
    }

    // No Mabhath tree
    return items.map((m, mIdx) => {
      const mId = m.id || `matlab-${mIdx + 1}`;
      const cleanMTitle = stripAcademicPrefix(m.title) || m.title;
      return {
        id: mId,
        type: ACADEMIC_LEVELS.MATALAB,
        title: cleanMTitle,
        parentId: null,
        order: mIdx + 1,
        children: (m.children || m.branches || []).map((b, bIdx) => ({
          id: (typeof b === 'object' && b.id) ? b.id : `branch-${mId}-${bIdx + 1}`,
          type: ACADEMIC_LEVELS.BRANCH,
          title: stripAcademicPrefix(typeof b === 'string' ? b : b.title || '') || (typeof b === 'string' ? b : b.title || ''),
          parentId: mId,
          order: bIdx + 1
        }))
      };
    });
  }

  // If raw flat items or partially structured
  const hasAnyMabhath = items.some((item) => {
    const lvl = detectAcademicLevel(item);
    return lvl === ACADEMIC_LEVELS.MABHATH || item.mabhathId || item.mabhathTitle;
  });

  if (hasAnyMabhath) {
    const mabhathMap = new Map();
    const mabhathList = [];

    items.forEach((item, idx) => {
      const lvl = detectAcademicLevel(item);
      const rawTitle = item.title || item.h1Title || item.text || '';
      const cleanTitle = stripAcademicPrefix(rawTitle) || rawTitle;

      if (lvl === ACADEMIC_LEVELS.MABHATH) {
        const mbId = item.id || item.mabhathId || `mabhath-${mabhathList.length + 1}`;
        let mbNode = mabhathMap.get(mbId);
        if (!mbNode) {
          mbNode = {
            id: mbId,
            type: ACADEMIC_LEVELS.MABHATH,
            title: cleanTitle,
            parentId: null,
            order: mabhathList.length + 1,
            children: []
          };
          mabhathMap.set(mbId, mbNode);
          mabhathList.push(mbNode);
        }

        const childItems = item.children || item.mataleeb || [];
        childItems.forEach((cItem, cIdx) => {
          const cTitle = stripAcademicPrefix(cItem.title || cItem.text || '') || (cItem.title || cItem.text || '');
          const mId = cItem.id || `matlab-${mbNode.id}-${cIdx + 1}`;
          const matlabNode = {
            id: mId,
            type: ACADEMIC_LEVELS.MATALAB,
            title: cTitle,
            parentId: mbNode.id,
            order: cIdx + 1,
            children: (cItem.children || cItem.branches || []).map((b, bIdx) => ({
              id: (typeof b === 'object' && b.id) ? b.id : `branch-${mId}-${bIdx + 1}`,
              type: ACADEMIC_LEVELS.BRANCH,
              title: stripAcademicPrefix(typeof b === 'string' ? b : b.title || '') || (typeof b === 'string' ? b : b.title || ''),
              parentId: mId,
              order: bIdx + 1
            }))
          };
          mbNode.children.push(matlabNode);
        });
      } else {
        // A Matlab node with optional mabhath parent reference
        const parentMbId = item.mabhathId || (mabhathList.length > 0 ? mabhathList[mabhathList.length - 1].id : null);
        let targetMb = parentMbId ? mabhathMap.get(parentMbId) : null;

        if (!targetMb) {
          const mbId = parentMbId || `mabhath-${mabhathList.length + 1}`;
          const mbTitle = item.mabhathTitle ? stripAcademicPrefix(item.mabhathTitle) : 'المبحث الأول';
          targetMb = {
            id: mbId,
            type: ACADEMIC_LEVELS.MABHATH,
            title: mbTitle,
            parentId: null,
            order: mabhathList.length + 1,
            children: []
          };
          mabhathMap.set(mbId, targetMb);
          mabhathList.push(targetMb);
        }

        const mId = item.id || item.topicId || `matlab-${targetMb.id}-${targetMb.children.length + 1}`;
        const matlabNode = {
          id: mId,
          type: ACADEMIC_LEVELS.MATALAB,
          title: cleanTitle,
          parentId: targetMb.id,
          order: targetMb.children.length + 1,
          children: (item.children || item.branches || []).map((b, bIdx) => ({
            id: (typeof b === 'object' && b.id) ? b.id : `branch-${mId}-${bIdx + 1}`,
            type: ACADEMIC_LEVELS.BRANCH,
            title: stripAcademicPrefix(typeof b === 'string' ? b : b.title || '') || (typeof b === 'string' ? b : b.title || ''),
            parentId: mId,
            order: bIdx + 1
          }))
        };
        targetMb.children.push(matlabNode);
      }
    });

    return mabhathList;
  }

  // Case B: No Mabhath
  return items.map((item, idx) => {
    const rawTitle = item.title || item.h1Title || item.text || '';
    const cleanTitle = stripAcademicPrefix(rawTitle) || rawTitle;
    const matlabId = item.id || item.topicId || `matlab-${idx + 1}`;

    const branches = (item.children || item.branches || []).map((b, bIdx) => {
      const bTitle = stripAcademicPrefix(typeof b === 'string' ? b : b.title || '') || (typeof b === 'string' ? b : b.title || '');
      return {
        id: (typeof b === 'object' && b.id) ? b.id : `branch-${matlabId}-${bIdx + 1}`,
        type: ACADEMIC_LEVELS.BRANCH,
        title: bTitle,
        parentId: matlabId,
        order: bIdx + 1
      };
    });

    return {
      id: matlabId,
      type: ACADEMIC_LEVELS.MATALAB,
      title: cleanTitle,
      parentId: null,
      order: idx + 1,
      children: branches
    };
  });
}

function hasMabhathLevel(elements = [], researchContext = null) {
  if (researchContext?.structure) {
    const tree = normalizeToSemanticTree(researchContext.structure);
    if (tree.some((node) => node.type === ACADEMIC_LEVELS.MABHATH)) return true;
  }

  if (Array.isArray(elements) && elements.length > 0) {
    // Check if elements is an array of pages with blocks
    const hasMbInPages = elements.some((item) => {
      if (item?.blocks && Array.isArray(item.blocks)) {
        return item.blocks.some((b) => detectAcademicLevel(b) === ACADEMIC_LEVELS.MABHATH);
      }
      return false;
    });
    if (hasMbInPages) return true;

    const tree = normalizeToSemanticTree(elements);
    return tree.some((node) => node.type === ACADEMIC_LEVELS.MABHATH);
  }

  return false;
}

function getHighestAcademicLevel(elements = [], researchContext = null) {
  if (hasMabhathLevel(elements, researchContext)) {
    return ACADEMIC_LEVELS.MABHATH;
  }
  return ACADEMIC_LEVELS.MATALAB;
}

/**
 * Centralized Academic Hierarchy Resolver
 * All steps and document generators call this single resolver.
 */
function resolveAcademicHierarchy(structure) {
  const tree = normalizeToSemanticTree(structure);
  const hasMabhath = tree.some((node) => node.type === ACADEMIC_LEVELS.MABHATH);

  return {
    hasMabhath,
    mainLevel: hasMabhath ? ACADEMIC_LEVELS.MABHATH : ACADEMIC_LEVELS.MATALAB,
    subordinateLevels: hasMabhath
      ? [ACADEMIC_LEVELS.MATALAB, ACADEMIC_LEVELS.BRANCH]
      : [ACADEMIC_LEVELS.BRANCH],
    tree
  };
}

function formatAcademicHeadingTitle(rawTitle = '', level = ACADEMIC_LEVELS.MATALAB, options = {}) {
  const clean = stripAcademicPrefix(rawTitle) || rawTitle;
  const index = options.index !== undefined ? options.index : 0;
  const branchIndex = options.branchIndex !== undefined ? options.branchIndex : 0;
  const ordinal = getArabicOrdinal(index + 1);

  if (level === ACADEMIC_LEVELS.MABHATH) {
    return `المبحث ${ordinal}: ${clean}`;
  }

  if (level === ACADEMIC_LEVELS.MATALAB) {
    return `المطلب ${ordinal}: ${clean}`;
  }

  if (level === ACADEMIC_LEVELS.BRANCH) {
    const bOrdinal = getArabicOrdinal(branchIndex + 1);
    return `الفرع ${bOrdinal}: ${clean}`;
  }

  return rawTitle;
}

function resolveAcademicHeadingStyle(blockOrText, highestLevel = ACADEMIC_LEVELS.MATALAB, context = null) {
  const level = detectAcademicLevel(blockOrText);
  const hasMabhath = highestLevel === ACADEMIC_LEVELS.MABHATH || hasMabhathLevel([], context);

  if (level === ACADEMIC_LEVELS.BODY) {
    return {
      isMainHeading: false,
      isSubHeading: false,
      isBody: true,
      level: ACADEMIC_LEVELS.BODY,
      hasMabhath,
      fontSizePt: 16,
      fontSize: '16pt',
      fontWeight: 'normal',
      textAlign: 'justify',
      lineHeight: '1.55',
      fontFamily: 'Amiri, serif',
      direction: 'rtl'
    };
  }

  if (level === highestLevel) {
    return {
      isMainHeading: true,
      isSubHeading: false,
      isBody: false,
      level,
      hasMabhath,
      fontSizePt: 18,
      fontSize: '18pt',
      fontWeight: 'bold',
      textAlign: 'center',
      lineHeight: '1.4',
      fontFamily: 'Amiri, serif',
      direction: 'rtl'
    };
  }

  return {
    isMainHeading: false,
    isSubHeading: true,
    isBody: false,
    level,
    hasMabhath,
    fontSizePt: 17,
    fontSize: '17pt',
    fontWeight: 'bold',
    textAlign: 'right',
    lineHeight: '1.45',
    fontFamily: 'Amiri, serif',
    direction: 'rtl'
  };
}

/**
 * Converts canonical semantic tree into research.topics array, preserving stable IDs.
 */
function flattenSemanticTreeToTopics(tree = []) {
  const topics = [];
  const normalizedTree = normalizeToSemanticTree(tree);
  const hasMabhath = normalizedTree.some((n) => n.type === ACADEMIC_LEVELS.MABHATH);

  if (hasMabhath) {
    let globalTopicIndex = 0;
    normalizedTree.forEach((mabhath, mbIdx) => {
      const mbOrdinal = getArabicOrdinal(mbIdx + 1);
      const mabhathFormatted = `المبحث ${mbOrdinal}: ${mabhath.title}`;

      if (!mabhath.children || mabhath.children.length === 0) {
        globalTopicIndex++;
        topics.push({
          topicId: mabhath.id || `mabhath-${mbIdx + 1}`,
          structureNodeId: mabhath.id || `mabhath-${mbIdx + 1}`,
          nodeType: ACADEMIC_LEVELS.MABHATH,
          order: globalTopicIndex,
          h1Title: mabhathFormatted,
          mabhathId: mabhath.id,
          mabhathTitle: mabhathFormatted,
          mabhathOrder: mbIdx + 1,
          matlabOrder: null,
          branches: []
        });
        return;
      }

      (mabhath.children || []).forEach((matlab, mIdx) => {
        globalTopicIndex++;
        const matlabOrdinal = getArabicOrdinal(mIdx + 1);
        const matlabFormatted = `المطلب ${matlabOrdinal}: ${matlab.title}`;

        const branchesFormatted = (matlab.children || []).map((b, bIdx) => {
          const bOrdinal = getArabicOrdinal(bIdx + 1);
          return {
            id: b.id || `branch-${matlab.id || globalTopicIndex}-${bIdx + 1}`,
            type: ACADEMIC_LEVELS.BRANCH,
            title: `الفرع ${bOrdinal}: ${b.title}`,
            order: b.order || bIdx + 1,
            parentId: matlab.id || `topic-${globalTopicIndex}`
          };
        });

        topics.push({
          topicId: matlab.id || `topic-${globalTopicIndex}`,
          structureNodeId: matlab.id || `topic-${globalTopicIndex}`,
          nodeType: ACADEMIC_LEVELS.MATALAB,
          order: globalTopicIndex,
          h1Title: matlabFormatted,
          mabhathId: mabhath.id,
          mabhathTitle: mabhathFormatted,
          mabhathOrder: mbIdx + 1,
          matlabOrder: mIdx + 1,
          branches: branchesFormatted
        });
      });
    });
  } else {
    normalizedTree.forEach((matlab, mIdx) => {
      const matlabOrdinal = getArabicOrdinal(mIdx + 1);
      const matlabFormatted = `المطلب ${matlabOrdinal}: ${matlab.title}`;

      const branchesFormatted = (matlab.children || []).map((b, bIdx) => {
        const bOrdinal = getArabicOrdinal(bIdx + 1);
        return {
          id: b.id || `branch-${matlab.id || mIdx + 1}-${bIdx + 1}`,
          type: ACADEMIC_LEVELS.BRANCH,
          title: `الفرع ${bOrdinal}: ${b.title}`,
          order: b.order || bIdx + 1,
          parentId: matlab.id || `topic-${mIdx + 1}`
        };
      });

      topics.push({
        topicId: matlab.id || `topic-${mIdx + 1}`,
        structureNodeId: matlab.id || `topic-${mIdx + 1}`,
        nodeType: ACADEMIC_LEVELS.MATALAB,
        order: mIdx + 1,
        h1Title: matlabFormatted,
        mabhathId: null,
        mabhathTitle: null,
        mabhathOrder: null,
        matlabOrder: mIdx + 1,
        branches: branchesFormatted
      });
    });
  }

  return topics;
}

/**
 * Canonical Topic View Model Builder (Single Source of Truth Adapter)
 * Reads canonical research.structure.tree, merges with existing research.topics by stable structureNodeId,
 * and produces unified topic view models for Step 3 editor, headings, and A4 preview.
 */
function buildTopicViewModels(research) {
  if (!research) return [];

  const rawStructure = research.structure?.tree?.length
    ? research.structure.tree
    : research.structure?.detectedMataleeb?.length
    ? research.structure.detectedMataleeb
    : research.topics;

  const normalizedTree = normalizeToSemanticTree(rawStructure);
  if (!normalizedTree || normalizedTree.length === 0) return [];

  const existingTopics = Array.isArray(research.topics) ? research.topics : [];
  const existingMap = new Map();

  existingTopics.forEach((t) => {
    if (!t) return;
    if (t.structureNodeId) existingMap.set(String(t.structureNodeId), t);
    if (t.topicId) existingMap.set(String(t.topicId), t);
    if (t.id) existingMap.set(String(t.id), t);
    if (t._id) existingMap.set(String(t._id), t);
  });

  const hasMabhath = normalizedTree.some((n) => n.type === ACADEMIC_LEVELS.MABHATH);
  const result = [];
  let globalTopicIndex = 0;

  if (hasMabhath) {
    normalizedTree.forEach((mabhath, mbIdx) => {
      const mbOrdinal = getArabicOrdinal(mabhath.order || mbIdx + 1);
      const cleanMbTitle = stripAcademicPrefix(mabhath.title) || mabhath.title;
      const mabhathFormatted = `المبحث ${mbOrdinal}: ${cleanMbTitle}`;

      if (!mabhath.children || mabhath.children.length === 0) {
        globalTopicIndex++;
        const structureNodeId = String(mabhath.id || `mabhath-${mbIdx + 1}`);
        const existing =
          existingMap.get(structureNodeId) ||
          existingTopics.find(
            (t) =>
              t.structureNodeId === structureNodeId ||
              t.topicId === structureNodeId ||
              t.order === globalTopicIndex
          ) ||
          existingTopics[globalTopicIndex - 1];

        const rawContent = existing?.rawContent || '';
        const footnotes = (existing?.footnotes || []).map((fn, idx) => ({
          footnoteId: fn.footnoteId || fn.id || `fn-${structureNodeId}-${idx + 1}`,
          number: fn.number || idx + 1,
          marker: fn.marker || `(${fn.number || idx + 1})`,
          text: fn.text || ''
        }));

        const status = existing?.status || (rawContent.trim().length > 30 ? 'complete' : 'incomplete');
        const mabhathBlock = { type: ACADEMIC_LEVELS.MABHATH, text: mabhathFormatted };

        let blocks = [];
        if (existing?.blocks && existing.blocks.length > 0) {
          const contentBlocks = existing.blocks.filter(
            (blk) => detectAcademicLevel(blk) !== ACADEMIC_LEVELS.MABHATH && blk.type !== 'h1'
          );
          blocks = [mabhathBlock, ...contentBlocks];
        } else {
          blocks = [
            mabhathBlock,
            ...(rawContent.trim() ? [{ type: 'paragraph', text: rawContent }] : [])
          ];
        }

        result.push({
          topicId: existing?.topicId || structureNodeId,
          structureNodeId: existing?.structureNodeId || structureNodeId,
          nodeType: ACADEMIC_LEVELS.MABHATH,
          order: globalTopicIndex,
          title: cleanMbTitle,
          h1Title: mabhathFormatted,
          mabhathId: String(mabhath.id || `mabhath-${mbIdx + 1}`),
          mabhathTitle: mabhathFormatted,
          mabhathOrder: mabhath.order || mbIdx + 1,
          matlabOrder: null,
          isFirstInMabhath: true,
          branches: [],
          rawContent,
          blocks,
          footnotes,
          status
        });
        return;
      }

      (mabhath.children || []).forEach((matlab, mIdx) => {
        globalTopicIndex++;
        const matlabOrdinal = getArabicOrdinal(matlab.order || mIdx + 1);
        const cleanMatlabTitle = stripAcademicPrefix(matlab.title) || matlab.title;
        const matlabFormatted = `المطلب ${matlabOrdinal}: ${cleanMatlabTitle}`;
        const structureNodeId = String(matlab.id || `matlab-${mabhath.id || mbIdx + 1}-${mIdx + 1}`);

        const canonicalBranches = (matlab.children || []).map((b, bIdx) => {
          const bOrdinal = getArabicOrdinal(b.order || bIdx + 1);
          const cleanBTitle = stripAcademicPrefix(b.title) || b.title;
          return {
            id: String(b.id || `branch-${structureNodeId}-${bIdx + 1}`),
            type: ACADEMIC_LEVELS.BRANCH,
            title: `الفرع ${bOrdinal}: ${cleanBTitle}`,
            rawTitle: cleanBTitle,
            order: b.order || bIdx + 1,
            parentId: structureNodeId
          };
        });

        const existing =
          existingMap.get(structureNodeId) ||
          existingTopics.find(
            (t) =>
              t.structureNodeId === structureNodeId ||
              t.topicId === structureNodeId ||
              t.order === globalTopicIndex
          ) ||
          existingTopics[globalTopicIndex - 1];

        const rawContent = existing?.rawContent || '';
        const footnotes = (existing?.footnotes || []).map((fn, idx) => ({
          footnoteId: fn.footnoteId || fn.id || `fn-${structureNodeId}-${idx + 1}`,
          number: fn.number || idx + 1,
          marker: fn.marker || `(${fn.number || idx + 1})`,
          text: fn.text || ''
        }));

        const status = existing?.status || (rawContent.trim().length > 30 ? 'complete' : 'incomplete');
        const isFirstInMabhath = mIdx === 0;
        const mabhathBlock = { type: ACADEMIC_LEVELS.MABHATH, text: mabhathFormatted };
        const matlabBlock = { type: ACADEMIC_LEVELS.MATALAB, text: matlabFormatted };

        let blocks = [];
        if (existing?.blocks && existing.blocks.length > 0) {
          const contentBlocks = existing.blocks.filter((blk) => {
            const lvl = detectAcademicLevel(blk);
            return lvl !== ACADEMIC_LEVELS.MABHATH && lvl !== ACADEMIC_LEVELS.MATALAB && blk.type !== 'h1';
          });
          blocks = isFirstInMabhath
            ? [mabhathBlock, matlabBlock, ...contentBlocks]
            : [matlabBlock, ...contentBlocks];
        } else {
          blocks = isFirstInMabhath
            ? [
                mabhathBlock,
                matlabBlock,
                ...(rawContent.trim() ? [{ type: 'paragraph', text: rawContent }] : [])
              ]
            : [
                matlabBlock,
                ...(rawContent.trim() ? [{ type: 'paragraph', text: rawContent }] : [])
              ];
        }

        result.push({
          topicId: existing?.topicId || structureNodeId,
          structureNodeId: existing?.structureNodeId || structureNodeId,
          nodeType: ACADEMIC_LEVELS.MATALAB,
          order: globalTopicIndex,
          title: cleanMatlabTitle,
          h1Title: matlabFormatted,
          mabhathId: String(mabhath.id || `mabhath-${mbIdx + 1}`),
          mabhathTitle: mabhathFormatted,
          mabhathOrder: mabhath.order || mbIdx + 1,
          matlabOrder: matlab.order || mIdx + 1,
          isFirstInMabhath,
          branches: canonicalBranches,
          rawContent,
          blocks,
          footnotes,
          status
        });
      });
    });
  } else {
    normalizedTree.forEach((matlab, mIdx) => {
      globalTopicIndex++;
      const matlabOrdinal = getArabicOrdinal(matlab.order || mIdx + 1);
      const cleanMatlabTitle = stripAcademicPrefix(matlab.title) || matlab.title;
      const matlabFormatted = `المطلب ${matlabOrdinal}: ${cleanMatlabTitle}`;
      const structureNodeId = String(matlab.id || `matlab-${mIdx + 1}`);

      const canonicalBranches = (matlab.children || []).map((b, bIdx) => {
        const bOrdinal = getArabicOrdinal(b.order || bIdx + 1);
        const cleanBTitle = stripAcademicPrefix(b.title) || b.title;
        return {
          id: String(b.id || `branch-${structureNodeId}-${bIdx + 1}`),
          type: ACADEMIC_LEVELS.BRANCH,
          title: `الفرع ${bOrdinal}: ${cleanBTitle}`,
          rawTitle: cleanBTitle,
          order: b.order || bIdx + 1,
          parentId: structureNodeId
        };
      });

      const existing =
        existingMap.get(structureNodeId) ||
        existingTopics.find(
          (t) =>
            t.structureNodeId === structureNodeId ||
            t.topicId === structureNodeId ||
            t.order === (matlab.order || globalTopicIndex)
        ) ||
        existingTopics[globalTopicIndex - 1];

      const rawContent = existing?.rawContent || '';
      const footnotes = (existing?.footnotes || []).map((fn, idx) => ({
        footnoteId: fn.footnoteId || fn.id || `fn-${structureNodeId}-${idx + 1}`,
        number: fn.number || idx + 1,
        marker: fn.marker || `(${fn.number || idx + 1})`,
        text: fn.text || ''
      }));

      const status = existing?.status || (rawContent.trim().length > 30 ? 'complete' : 'incomplete');

      const matlabBlock = { type: ACADEMIC_LEVELS.MATALAB, text: matlabFormatted };

      let blocks = [];
      if (existing?.blocks && existing.blocks.length > 0) {
        const contentBlocks = existing.blocks.filter((blk) => {
          const lvl = detectAcademicLevel(blk);
          return lvl !== ACADEMIC_LEVELS.MABHATH && lvl !== ACADEMIC_LEVELS.MATALAB && blk.type !== 'h1';
        });
        blocks = [matlabBlock, ...contentBlocks];
      } else {
        blocks = [
          matlabBlock,
          ...(rawContent.trim() ? [{ type: 'paragraph', text: rawContent }] : [])
        ];
      }

      result.push({
        topicId: existing?.topicId || structureNodeId,
        structureNodeId: existing?.structureNodeId || structureNodeId,
        nodeType: ACADEMIC_LEVELS.MATALAB,
        order: globalTopicIndex,
        title: cleanMatlabTitle,
        h1Title: matlabFormatted,
        mabhathId: null,
        mabhathTitle: null,
        mabhathOrder: null,
        matlabOrder: matlab.order || mIdx + 1,
        branches: canonicalBranches,
        rawContent,
        blocks,
        footnotes,
        status
      });
    });
  }

  return result;
}

function getTopicByStructureNodeId(research, structureNodeId) {
  const topics = buildTopicViewModels(research);
  if (!structureNodeId) return topics[0] || null;
  return topics.find((t) => t.structureNodeId === String(structureNodeId) || t.topicId === String(structureNodeId)) || topics[0] || null;
}

/**
 * Pure Semantic Hierarchy Tree Mutator for Drag & Drop
 * Reorders and moves nodes while enforcing academic integrity:
 * - Mabhath reorders at root level
 * - Matlab reorders within Mabhath or moves to another Mabhath
 * - Branch reorders within Matlab or moves to another Matlab
 * - Prevents cycles and invalid hierarchy promotions
 */
function moveSemanticNode(tree, { draggedNodeId, targetNodeId, dropType = 'after' }) {
  if (!tree || !draggedNodeId || !targetNodeId || draggedNodeId === targetNodeId) {
    return tree;
  }

  const treeClone = JSON.parse(JSON.stringify(tree));

  function findNode(nodes, id, parent = null) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.id === id) {
        return { node, parent, index: i, siblings: nodes };
      }
      if (node.children && node.children.length > 0) {
        const found = findNode(node.children, id, node);
        if (found) return found;
      }
    }
    return null;
  }

  const dragged = findNode(treeClone, draggedNodeId);
  const target = findNode(treeClone, targetNodeId);

  if (!dragged || !target) return tree;

  // Cycle prevention
  function isDescendant(parent, targetId) {
    if (!parent || !parent.children) return false;
    for (const child of parent.children) {
      if (child.id === targetId) return true;
      if (isDescendant(child, targetId)) return true;
    }
    return false;
  }

  if (isDescendant(dragged.node, targetNodeId)) {
    return tree;
  }

  const draggedType = dragged.node.type;
  const targetType = target.node.type;

  // 1. Mabhath Move
  if (draggedType === ACADEMIC_LEVELS.MABHATH) {
    if (targetType !== ACADEMIC_LEVELS.MABHATH) {
      return tree;
    }
    dragged.siblings.splice(dragged.index, 1);
    const targetIdx = treeClone.findIndex((n) => n.id === targetNodeId);
    const insertIdx = dropType === 'after' ? targetIdx + 1 : targetIdx;
    treeClone.splice(insertIdx, 0, dragged.node);
    dragged.node.parentId = null;
  }

  // 2. Matlab Move
  else if (draggedType === ACADEMIC_LEVELS.MATALAB) {
    if (targetType === ACADEMIC_LEVELS.BRANCH) {
      return tree;
    }

    dragged.siblings.splice(dragged.index, 1);

    if (targetType === ACADEMIC_LEVELS.MABHATH) {
      target.node.children = target.node.children || [];
      if (dropType === 'before') {
        target.node.children.unshift(dragged.node);
      } else {
        target.node.children.push(dragged.node);
      }
      dragged.node.parentId = target.node.id;
    } else if (targetType === ACADEMIC_LEVELS.MATALAB) {
      const targetParent = target.parent;
      const targetSiblings = target.siblings;
      const targetIdx = targetSiblings.findIndex((n) => n.id === targetNodeId);
      const insertIdx = dropType === 'after' ? targetIdx + 1 : targetIdx;
      targetSiblings.splice(insertIdx, 0, dragged.node);
      dragged.node.parentId = targetParent ? targetParent.id : null;
    }
  }

  // 3. Branch Move
  else if (draggedType === ACADEMIC_LEVELS.BRANCH) {
    if (targetType === ACADEMIC_LEVELS.MABHATH) {
      return tree;
    }

    dragged.siblings.splice(dragged.index, 1);

    if (targetType === ACADEMIC_LEVELS.MATALAB) {
      target.node.children = target.node.children || [];
      if (dropType === 'before') {
        target.node.children.unshift(dragged.node);
      } else {
        target.node.children.push(dragged.node);
      }
      dragged.node.parentId = target.node.id;
    } else if (targetType === ACADEMIC_LEVELS.BRANCH) {
      const targetParent = target.parent;
      const targetSiblings = target.siblings;
      const targetIdx = targetSiblings.findIndex((n) => n.id === targetNodeId);
      const insertIdx = dropType === 'after' ? targetIdx + 1 : targetIdx;
      targetSiblings.splice(insertIdx, 0, dragged.node);
      dragged.node.parentId = targetParent ? targetParent.id : null;
    }
  }

  return normalizeToSemanticTree(treeClone);
}

module.exports = {
  ACADEMIC_LEVELS,
  ARABIC_ORDINALS,
  getArabicOrdinal,
  stripAcademicPrefix,
  detectAcademicLevel,
  parsePlanTextToSemanticTree,
  normalizeToSemanticTree,
  hasMabhathLevel,
  getHighestAcademicLevel,
  resolveAcademicHierarchy,
  formatAcademicHeadingTitle,
  resolveAcademicHeadingStyle,
  flattenSemanticTreeToTopics,
  buildTopicViewModels,
  getTopicByStructureNodeId,
  moveSemanticNode
};
