const assert = require('assert');

const arabicIndicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toArabicIndicDigits = (num) => {
  if (num === null || num === undefined) return '';
  return String(num).replace(/\d/g, (d) => arabicIndicDigits[parseInt(d, 10)]);
};

function removeFootnoteMarker(text, marker) {
  if (!text || !marker) return text;
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match marker with:
  // 1. Preceding horizontal whitespace [ \t]+ if followed by punctuation [.،,؛;:!؟?)] or [ \t] or end-of-line/string
  // 2. Trailing horizontal whitespace [ \t]+
  // 3. Just the marker alone
  // NEVER match \r or \n so paragraph structure and line breaks are strictly preserved!
  const regex = new RegExp(`(?:[ \\t]+${escaped}(?=[.،,؛;:!؟?)]|[ \\t]|\\r?\\n|$))|(?:${escaped}[ \\t]+)|(?:${escaped})`, 'g');
  return text.replace(regex, '');
}

function renumberFootnoteMarkers(text, mapping) {
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
}

function processFootnoteDeletion({ footnotes, rawContent, blocks, targetIdOrIndex }) {
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

  // 1. Determine all markers for deleted footnote
  const oldNum = fnToDelete.number || targetIndex + 1;
  const markersToRemove = new Set();
  if (fnToDelete.marker) markersToRemove.add(fnToDelete.marker);
  markersToRemove.add(`(${oldNum})`);
  markersToRemove.add(`(${toArabicIndicDigits(oldNum)})`);

  // 2. Filter out deleted footnote
  const remaining = footnotes.filter((_, i) => i !== targetIndex);

  // 3. Renumber remaining footnotes
  const renumbered = remaining.map((fn, idx) => ({
    ...fn,
    number: idx + 1,
    marker: `(${idx + 1})`
  }));

  // 4. Build mapping for remaining markers
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

  // 5. Update rawContent safely
  let updatedRawContent = rawContent;
  markersToRemove.forEach((m) => {
    updatedRawContent = removeFootnoteMarker(updatedRawContent, m);
  });
  if (renumberMapping.length > 0) {
    updatedRawContent = renumberFootnoteMarkers(updatedRawContent, renumberMapping);
  }

  // 6. Update semantic blocks safely without rebuilding the block tree
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
}

console.log('--- RUNNING FOOTNOTE DELETION TESTS ---');

// Test 1: Deleting first footnote in sample text
const sampleText = `الفرع الأول : المعنى اللغوي
افتعال من العكوف، افتعل أي دخل في العكوف، مأخوذ من عكف على شيء أي لزمه وداوم عليه (1). ومنه قول إبراهيم -عليه السلام:- {مَا هَذِهِ التَّمَاثِيلُ الَّتِي أَنْتُمْ لَهَا عَاكِفُونَ} أي لها ملازمون، وقول الله تعالى: {يَعْكُفُونَ عَلَى أَصْنَامٍ لَهُمْ} أي يلازمونها ويداومون عليها (2).

الفرع الثاني : المعنى الإصطلاحي
فهو لزوم المسلم المسجد لطاعة الله تعالى مدةً مخصوصة مع نية التعبد والتقرب إليه سبحانه. ويقصد المعتكف من ذلك التفرغ للعبادة من صلاة وذكر وقراءة قرآن ودعاء وتأمل.`;

const sampleFootnotes = [
  { footnoteId: 'fn-1', number: 1, marker: '(1)', text: 'مرجع 1' },
  { footnoteId: 'fn-2', number: 2, marker: '(2)', text: 'مرجع 2' }
];

const sampleBlocks = [
  { blockId: 'b-h1', type: 'h1', text: 'المطلب الأول' },
  { blockId: 'b-branch-1', type: 'branch', text: 'الفرع الأول : المعنى اللغوي' },
  { blockId: 'b-p-1', type: 'paragraph', text: 'افتعال من العكوف، افتعل أي دخل في العكوف، مأخوذ من عكف على شيء أي لزمه وداوم عليه (1). ومنه قول إبراهيم -عليه السلام:- {مَا هَذِهِ التَّمَاثِيلُ الَّتِي أَنْتُمْ لَهَا عَاكِفُونَ} أي لها ملازمون، وقول الله تعالى: {يَعْكُفُونَ عَلَى أَصْنَامٍ لَهُمْ} أي يلازمونها ويداومون عليها (2).' },
  { blockId: 'b-branch-2', type: 'branch', text: 'الفرع الثاني : المعنى الإصطلاحي' },
  { blockId: 'b-p-2', type: 'paragraph', text: 'فهو لزوم المسلم المسجد لطاعة الله تعالى مدةً مخصوصة مع نية التعبد والتقرب إليه سبحانه. ويقصد المعتكف من ذلك التفرغ للعبادة من صلاة وذكر وقراءة قرآن ودعاء وتأمل.' }
];

const res1 = processFootnoteDeletion({
  footnotes: sampleFootnotes,
  rawContent: sampleText,
  blocks: sampleBlocks,
  targetIdOrIndex: 0
});

console.log('1. First footnote deleted:');
assert.strictEqual(res1.footnotes.length, 1);
assert.strictEqual(res1.footnotes[0].footnoteId, 'fn-2');
assert.strictEqual(res1.footnotes[0].number, 1);
assert.strictEqual(res1.footnotes[0].marker, '(1)');

// Raw content assertions
assert.ok(!res1.rawContent.includes('وداوم عليه (1).'));
assert.ok(res1.rawContent.includes('وداوم عليه. ومنه قول إبراهيم'));
assert.ok(res1.rawContent.includes('يلازمونها ويداومون عليها (1).'));
assert.strictEqual(res1.rawContent.split('\n').length, sampleText.split('\n').length);
assert.ok(res1.rawContent.includes('الفرع الثاني : المعنى الإصطلاحي'));

// Blocks assertions
assert.strictEqual(res1.blocks.length, sampleBlocks.length);
assert.strictEqual(res1.blocks[0], sampleBlocks[0], 'Unrelated block preserved by reference');
assert.strictEqual(res1.blocks[1], sampleBlocks[1], 'Branch 1 block preserved by reference');
assert.strictEqual(res1.blocks[3], sampleBlocks[3], 'Branch 2 block preserved by reference');
assert.strictEqual(res1.blocks[4], sampleBlocks[4], 'Paragraph 2 block preserved by reference');
assert.strictEqual(res1.blocks[2].blockId, 'b-p-1');
assert.ok(res1.blocks[2].text.includes('وداوم عليه. ومنه قول إبراهيم'));
assert.ok(res1.blocks[2].text.includes('يلازمونها ويداومون عليها (1).'));
console.log('-> Test 1 PASSED!');

// Test 2: Delete middle footnote with 3 footnotes
const fns3 = [
  { footnoteId: 'fn-1', number: 1, marker: '(1)', text: 'F1' },
  { footnoteId: 'fn-2', number: 2, marker: '(2)', text: 'F2' },
  { footnoteId: 'fn-3', number: 3, marker: '(3)', text: 'F3' }
];
const text3 = 'نص أول (1) نص ثان (2) نص ثالث (3)';
const res2 = processFootnoteDeletion({
  footnotes: fns3,
  rawContent: text3,
  blocks: [],
  targetIdOrIndex: 'fn-2'
});
console.log('2. Middle footnote deleted by ID:');
assert.strictEqual(res2.footnotes.length, 2);
assert.strictEqual(res2.footnotes[0].footnoteId, 'fn-1');
assert.strictEqual(res2.footnotes[0].number, 1);
assert.strictEqual(res2.footnotes[1].footnoteId, 'fn-3');
assert.strictEqual(res2.footnotes[1].number, 2);
assert.strictEqual(res2.footnotes[1].marker, '(2)');
assert.strictEqual(res2.rawContent, 'نص أول (1) نص ثان نص ثالث (2)');
console.log('-> Test 2 PASSED!');

// Test 3: Delete last footnote
const res3 = processFootnoteDeletion({
  footnotes: fns3,
  rawContent: text3,
  blocks: [],
  targetIdOrIndex: 2
});
console.log('3. Last footnote deleted:');
assert.strictEqual(res3.footnotes.length, 2);
assert.strictEqual(res3.footnotes[0].number, 1);
assert.strictEqual(res3.footnotes[1].number, 2);
assert.strictEqual(res3.rawContent, 'نص أول (1) نص ثان (2) نص ثالث');
console.log('-> Test 3 PASSED!');

// Test 4: Delete all footnotes one by one
let state = { footnotes: fns3, rawContent: text3, blocks: [] };
state = processFootnoteDeletion({ ...state, targetIdOrIndex: 0 });
assert.strictEqual(state.footnotes.length, 2);
assert.strictEqual(state.rawContent, 'نص أول نص ثان (1) نص ثالث (2)');
state = processFootnoteDeletion({ ...state, targetIdOrIndex: 0 });
assert.strictEqual(state.footnotes.length, 1);
assert.strictEqual(state.rawContent, 'نص أول نص ثان نص ثالث (1)');
state = processFootnoteDeletion({ ...state, targetIdOrIndex: 0 });
assert.strictEqual(state.footnotes.length, 0);
assert.strictEqual(state.rawContent, 'نص أول نص ثان نص ثالث');
console.log('-> Test 4 PASSED (All footnotes deleted one by one)!');

console.log('ALL TESTS PASSED SUCCESSFULLY!');
