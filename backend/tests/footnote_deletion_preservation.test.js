const { test, describe } = require('node:test');
const assert = require('node:assert');

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toArabicIndicDigits = (num) => {
  if (num === null || num === undefined) return '';
  return String(num).replace(/\d/g, (d) => ARABIC_INDIC_DIGITS[parseInt(d, 10)]);
};

const removeFootnoteMarker = (text, marker) => {
  if (!text || !marker) return text;
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:[ \\t]+${escaped}(?=[.،,؛;:!؟?)]|[ \\t]|\\r?\\n|$))|(?:${escaped}[ \\t]+)|(?:${escaped})`, 'g');
  return text.replace(regex, '');
};

const renumberFootnoteMarkers = (text, mapping) => {
  if (!text || !mapping || mapping.length === 0) return text;
  const map = new Map();
  mapping.forEach(({ oldMarker, newMarker }) => {
    if (oldMarker && newMarker && oldMarker !== newMarker) {
      map.set(oldMarker, newMarker);
    }
  });
  if (map.size === 0) return text;

  const escapedKeys = Array.from(map.keys()).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(escapedKeys.join('|'), 'g');
  return text.replace(regex, (matched) => map.get(matched) || matched);
};

const processFootnoteDeletion = ({ footnotes, rawContent, blocks, targetIdOrIndex }) => {
  let targetIndex = -1;
  let fnToDelete = null;

  if (typeof targetIdOrIndex === 'number') {
    targetIndex = targetIdOrIndex;
    fnToDelete = footnotes[targetIdOrIndex];
  } else if (typeof targetIdOrIndex === 'string') {
    targetIndex = footnotes.findIndex((f) => f.footnoteId === targetIdOrIndex || f.id === targetIdOrIndex);
    if (targetIndex !== -1) {
      fnToDelete = footnotes[targetIndex];
    }
  }

  if (!fnToDelete || targetIndex === -1) {
    return { footnotes, rawContent, blocks };
  }

  const oldNum = fnToDelete.number || targetIndex + 1;
  const markersToRemove = new Set();
  if (fnToDelete.marker) markersToRemove.add(fnToDelete.marker);
  markersToRemove.add(`(${oldNum})`);
  markersToRemove.add(`(${toArabicIndicDigits(oldNum)})`);

  const remaining = footnotes.filter((_, i) => i !== targetIndex);

  const renumbered = remaining.map((fn, idx) => ({
    ...fn,
    number: idx + 1,
    marker: `(${idx + 1})`
  }));

  const renumberMapping = [];
  remaining.forEach((oldFn, idx) => {
    const fromNum = oldFn.number;
    const toNum = idx + 1;
    if (fromNum !== toNum) {
      if (oldFn.marker && oldFn.marker !== `(${toNum})`) {
        renumberMapping.push({ oldMarker: oldFn.marker, newMarker: `(${toNum})` });
      }
      renumberMapping.push({ oldMarker: `(${fromNum})`, newMarker: `(${toNum})` });
      renumberMapping.push({
        oldMarker: `(${toArabicIndicDigits(fromNum)})`,
        newMarker: `(${toArabicIndicDigits(toNum)})`
      });
    }
  });

  let updatedRawContent = rawContent;
  markersToRemove.forEach((m) => {
    updatedRawContent = removeFootnoteMarker(updatedRawContent, m);
  });
  if (renumberMapping.length > 0) {
    updatedRawContent = renumberFootnoteMarkers(updatedRawContent, renumberMapping);
  }

  const updatedBlocks = (blocks || []).map((block) => {
    if (!block || !block.text) return block;
    let newText = block.text;
    let changed = false;

    markersToRemove.forEach((m) => {
      const after = removeFootnoteMarker(newText, m);
      if (after !== newText) {
        newText = after;
        changed = true;
      }
    });

    if (renumberMapping.length > 0) {
      const after = renumberFootnoteMarkers(newText, renumberMapping);
      if (after !== newText) {
        newText = after;
        changed = true;
      }
    }

    if (!changed) return block;

    return {
      ...block,
      text: newText
    };
  });

  return {
    footnotes: renumbered,
    rawContent: updatedRawContent,
    blocks: updatedBlocks
  };
};

describe('Footnote Deletion Layout & Content Preservation Strict Acceptance Tests', () => {
  const sampleParagraphText = `الفرع الأول : المعنى اللغوي
افتعال من العكوف، افتعل أي دخل في العكوف، مأخوذ من عكف على شيء أي لزمه وداوم عليه (1). ومنه قول إبراهيم -عليه السلام:- {مَا هَذِهِ التَّمَاثِيلُ الَّتِي أَنْتُمْ لَهَا عَاكِفُونَ} أي لها ملازمون، وقول الله تعالى: {يَعْكُفُونَ عَلَى أَصْنَامٍ لَهُمْ} أي يلازمونها ويداومون عليها (2).

الفرع الثاني : المعنى الإصطلاحي
فهو لزوم المسلم المسجد لطاعة الله تعالى مدةً مخصوصة مع نية التعبد والتقرب إليه سبحانه. ويقصد المعتكف من ذلك التفرغ للعبادة من صلاة وذكر وقراءة قرآن ودعاء وتأمل.`;

  const sampleFootnotes = [
    {
      footnoteId: 'fn-topic-1-1',
      number: 1,
      marker: '(1)',
      text: 'المصباح المنير في غريب الشرح الكبير، الفيومي، ج1، ص 424'
    },
    {
      footnoteId: 'fn-topic-1-2',
      number: 2,
      marker: '(2)',
      text: 'الفقه على المذاهب الأربعة، عبد الرحمن الجزيري، ج1، ص 566'
    }
  ];

  const sampleBlocks = [
    { blockId: 'b-0', type: 'h1', text: 'المطلب الأول: تعريف الاعتكاف ومشروعيته' },
    { blockId: 'b-1', type: 'branch', text: 'الفرع الأول : المعنى اللغوي' },
    {
      blockId: 'b-2',
      type: 'paragraph',
      text: 'افتعال من العكوف، افتعل أي دخل في العكوف، مأخوذ من عكف على شيء أي لزمه وداوم عليه (1). ومنه قول إبراهيم -عليه السلام:- {مَا هَذِهِ التَّمَاثِيلُ الَّتِي أَنْتُمْ لَهَا عَاكِفُونَ} أي لها ملازمون، وقول الله تعالى: {يَعْكُفُونَ عَلَى أَصْنَامٍ لَهُمْ} أي يلازمونها ويداومون عليها (2).'
    },
    { blockId: 'b-3', type: 'branch', text: 'الفرع الثاني : المعنى الإصطلاحي' },
    {
      blockId: 'b-4',
      type: 'paragraph',
      text: 'فهو لزوم المسلم المسجد لطاعة الله تعالى مدةً مخصوصة مع نية التعبد والتقرب إليه سبحانه. ويقصد المعتكف من ذلك التفرغ للعبادة من صلاة وذكر وقراءة قرآن ودعاء وتأمل.'
    }
  ];

  test('1. Deleting FIRST footnote removes only marker (1), renumbers (2) to (1), and preserves paragraph layout strictly', () => {
    const result = processFootnoteDeletion({
      footnotes: sampleFootnotes,
      rawContent: sampleParagraphText,
      blocks: sampleBlocks,
      targetIdOrIndex: 0
    });

    // Footnote assertions
    assert.strictEqual(result.footnotes.length, 1);
    assert.strictEqual(result.footnotes[0].footnoteId, 'fn-topic-1-2');
    assert.strictEqual(result.footnotes[0].number, 1);
    assert.strictEqual(result.footnotes[0].marker, '(1)');
    assert.strictEqual(result.footnotes[0].text, sampleFootnotes[1].text);

    // Raw content assertions: newlines preserved, no whitespace collapse
    const origLines = sampleParagraphText.split('\n');
    const resultLines = result.rawContent.split('\n');
    assert.strictEqual(resultLines.length, origLines.length, 'Line count and paragraph breaks must be strictly preserved');
    assert.ok(!result.rawContent.includes('وداوم عليه (1).'));
    assert.ok(result.rawContent.includes('وداوم عليه. ومنه قول إبراهيم'));
    assert.ok(result.rawContent.includes('يلازمونها ويداومون عليها (1).'));
    assert.ok(result.rawContent.includes('الفرع الثاني : المعنى الإصطلاحي'));

    // Semantic blocks assertions: blocks structure preserved, unaffected blocks untouched by reference
    assert.strictEqual(result.blocks.length, sampleBlocks.length);
    assert.strictEqual(result.blocks[0], sampleBlocks[0], 'H1 block preserved by reference');
    assert.strictEqual(result.blocks[1], sampleBlocks[1], 'Branch 1 block preserved by reference');
    assert.strictEqual(result.blocks[3], sampleBlocks[3], 'Branch 2 block preserved by reference');
    assert.strictEqual(result.blocks[4], sampleBlocks[4], 'Paragraph 2 block preserved by reference');

    // Affected block assertion: block ID and type preserved, only marker removed and remaining marker renumbered
    assert.strictEqual(result.blocks[2].blockId, 'b-2');
    assert.strictEqual(result.blocks[2].type, 'paragraph');
    assert.ok(!result.blocks[2].text.includes('وداوم عليه (1).'));
    assert.ok(result.blocks[2].text.includes('وداوم عليه. ومنه قول إبراهيم'));
    assert.ok(result.blocks[2].text.includes('يلازمونها ويداومون عليها (1).'));
  });

  test('2. Deleting MIDDLE footnote by stable ID removes only targeted marker and renumbers remaining', () => {
    const threeFootnotes = [
      { footnoteId: 'fn-1', number: 1, marker: '(1)', text: 'Ref 1' },
      { footnoteId: 'fn-2', number: 2, marker: '(2)', text: 'Ref 2' },
      { footnoteId: 'fn-3', number: 3, marker: '(3)', text: 'Ref 3' }
    ];
    const threeText = 'نص الفقرة الأولى (1) ثم يستمر النص (2) ثم المرجع الأخير (3).';

    const result = processFootnoteDeletion({
      footnotes: threeFootnotes,
      rawContent: threeText,
      blocks: [],
      targetIdOrIndex: 'fn-2'
    });

    assert.strictEqual(result.footnotes.length, 2);
    assert.strictEqual(result.footnotes[0].footnoteId, 'fn-1');
    assert.strictEqual(result.footnotes[0].number, 1);
    assert.strictEqual(result.footnotes[1].footnoteId, 'fn-3');
    assert.strictEqual(result.footnotes[1].number, 2);
    assert.strictEqual(result.footnotes[1].marker, '(2)');

    // Text: marker (2) is cleanly removed, marker (3) is renumbered to (2), marker (1) is untouched
    assert.strictEqual(result.rawContent, 'نص الفقرة الأولى (1) ثم يستمر النص ثم المرجع الأخير (2).');
  });

  test('3. Deleting LAST footnote leaves earlier markers and paragraphs completely intact', () => {
    const threeFootnotes = [
      { footnoteId: 'fn-1', number: 1, marker: '(1)', text: 'Ref 1' },
      { footnoteId: 'fn-2', number: 2, marker: '(2)', text: 'Ref 2' },
      { footnoteId: 'fn-3', number: 3, marker: '(3)', text: 'Ref 3' }
    ];
    const threeText = 'نص الفقرة الأولى (1) ثم يستمر النص (2) ثم المرجع الأخير (3).';

    const result = processFootnoteDeletion({
      footnotes: threeFootnotes,
      rawContent: threeText,
      blocks: [],
      targetIdOrIndex: 2
    });

    assert.strictEqual(result.footnotes.length, 2);
    assert.strictEqual(result.footnotes[0].number, 1);
    assert.strictEqual(result.footnotes[1].number, 2);
    assert.strictEqual(result.rawContent, 'نص الفقرة الأولى (1) ثم يستمر النص (2) ثم المرجع الأخير.');
  });

  test('4. Deleting all footnotes one by one leaves completely clean paragraph text without markers or broken whitespace', () => {
    const threeFootnotes = [
      { footnoteId: 'fn-1', number: 1, marker: '(1)', text: 'Ref 1' },
      { footnoteId: 'fn-2', number: 2, marker: '(2)', text: 'Ref 2' },
      { footnoteId: 'fn-3', number: 3, marker: '(3)', text: 'Ref 3' }
    ];
    const threeText = 'نص الفقرة الأولى (1) ثم يستمر النص (2) ثم المرجع الأخير (3).';

    let state = { footnotes: threeFootnotes, rawContent: threeText, blocks: [] };

    // Delete 1st (fn-1)
    state = processFootnoteDeletion({ ...state, targetIdOrIndex: 0 });
    assert.strictEqual(state.footnotes.length, 2);
    assert.strictEqual(state.rawContent, 'نص الفقرة الأولى ثم يستمر النص (1) ثم المرجع الأخير (2).');

    // Delete 1st again (was fn-2, now number 1)
    state = processFootnoteDeletion({ ...state, targetIdOrIndex: 0 });
    assert.strictEqual(state.footnotes.length, 1);
    assert.strictEqual(state.rawContent, 'نص الفقرة الأولى ثم يستمر النص ثم المرجع الأخير (1).');

    // Delete last remaining (was fn-3, now number 1)
    state = processFootnoteDeletion({ ...state, targetIdOrIndex: 0 });
    assert.strictEqual(state.footnotes.length, 0);
    assert.strictEqual(state.rawContent, 'نص الفقرة الأولى ثم يستمر النص ثم المرجع الأخير.');
  });
});
