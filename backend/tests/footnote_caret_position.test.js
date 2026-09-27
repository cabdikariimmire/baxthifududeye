const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('Footnote Caret/Selection-Position Logic & Arabic Text Parity', () => {
  // Pure implementation of the caret-based footnote insertion function matching Step4TopicContent.jsx
  function insertFootnoteAtCaret({ rawContent, selectionStart, selectionEnd, cursorFallback, footnotes = [] }) {
    let start = null;
    let end = null;

    if (typeof selectionStart === 'number') {
      start = selectionStart;
      end = typeof selectionEnd === 'number' ? selectionEnd : selectionStart;
    } else if (cursorFallback !== null && typeof cursorFallback === 'number') {
      start = cursorFallback;
      end = cursorFallback;
    } else {
      start = rawContent.length;
      end = rawContent.length;
    }

    // Safety bounds
    start = Math.max(0, Math.min(start, rawContent.length));
    end = Math.max(start, Math.min(end, rawContent.length));

    const nextNumber = footnotes.length + 1;
    const marker = `(${nextNumber})`;

    // Check surrounding whitespace and punctuation
    const needsLeadingSpace = start > 0 && !/\s$/.test(rawContent.slice(0, start));
    const needsTrailingSpace = end < rawContent.length && !/[\s.,،؛:!؟?)]/.test(rawContent.charAt(end));
    const insertText = `${needsLeadingSpace ? ' ' : ''}${marker}${needsTrailingSpace ? ' ' : ''}`;

    const textBefore = rawContent.slice(0, start);
    const textAfter = rawContent.slice(end);
    const updatedContent = textBefore + insertText + textAfter;

    const newFootnote = {
      footnoteId: `fn-test-${Date.now()}`,
      number: nextNumber,
      marker,
      text: ''
    };

    const newCaretPos = start + insertText.length;

    return {
      updatedContent,
      newFootnote,
      updatedFootnotes: [...footnotes, newFootnote],
      newCaretPos
    };
  }

  test('1. Inserts footnote marker exactly at caret position between Arabic words', () => {
    const rawContent = 'الاعتكاف لغة لزوم الشيء وحبس النفس عليه';
    // User places caret right after 'لغة' (which is at index 12)
    const caretPos = rawContent.indexOf('لغة') + 'لغة'.length; // index 12
    assert.strictEqual(caretPos, 12);
    assert.strictEqual(rawContent.slice(0, caretPos), 'الاعتكاف لغة');
    assert.strictEqual(rawContent.slice(caretPos), ' لزوم الشيء وحبس النفس عليه');

    const result = insertFootnoteAtCaret({
      rawContent,
      selectionStart: caretPos,
      selectionEnd: caretPos,
      footnotes: []
    });

    // The marker (1) must appear immediately after 'الاعتكاف لغة' and before ' لزوم'
    assert.strictEqual(result.updatedContent, 'الاعتكاف لغة (1) لزوم الشيء وحبس النفس عليه');
    assert.strictEqual(result.newFootnote.marker, '(1)');
    assert.strictEqual(result.newCaretPos, 12 + ' (1)'.length); // caret placed right after (1)
  });

  test('2. Inserts footnote marker at exact caret position when caret is after space', () => {
    const rawContent = 'الاعتكاف لغة لزوم الشيء وحبس النفس عليه';
    // Caret is placed at index 13 (after 'الاعتكاف لغة ')
    const caretPos = 13;
    assert.strictEqual(rawContent.slice(0, caretPos), 'الاعتكاف لغة ');

    const result = insertFootnoteAtCaret({
      rawContent,
      selectionStart: caretPos,
      selectionEnd: caretPos,
      footnotes: []
    });

    assert.strictEqual(result.updatedContent, 'الاعتكاف لغة (1) لزوم الشيء وحبس النفس عليه');
  });

  test('3. Inserts footnote marker at beginning of Arabic text (index 0)', () => {
    const rawContent = 'مقدمة البحث الفقهي وأهدافه';
    const result = insertFootnoteAtCaret({
      rawContent,
      selectionStart: 0,
      selectionEnd: 0,
      footnotes: []
    });

    assert.strictEqual(result.updatedContent, '(1) مقدمة البحث الفقهي وأهدافه');
    assert.strictEqual(result.newFootnote.number, 1);
  });

  test('4. Inserts footnote marker at very end of Arabic text without trailing space', () => {
    const rawContent = 'ابن قدامة، المغني، دار إحياء التراث';
    const result = insertFootnoteAtCaret({
      rawContent,
      selectionStart: rawContent.length,
      selectionEnd: rawContent.length,
      footnotes: []
    });

    assert.strictEqual(result.updatedContent, 'ابن قدامة، المغني، دار إحياء التراث (1)');
    assert.strictEqual(result.newCaretPos, result.updatedContent.length);
  });

  test('5. Replaces an Arabic text selection range [start, end] with footnote marker', () => {
    const rawContent = 'ذهب جمهور العلماء إلى مشروعية الاعتكاف في المساجد';
    const targetWord = 'العلماء';
    const start = rawContent.indexOf(targetWord);
    const end = start + targetWord.length;

    const result = insertFootnoteAtCaret({
      rawContent,
      selectionStart: start,
      selectionEnd: end,
      footnotes: [{ number: 1, marker: '(1)', text: 'مرجع سابق' }]
    });

    // Replaced 'العلماء' with '(2)'
    assert.strictEqual(result.updatedContent, 'ذهب جمهور (2) إلى مشروعية الاعتكاف في المساجد');
    assert.strictEqual(result.newFootnote.number, 2);
    assert.strictEqual(result.newFootnote.marker, '(2)');
  });

  test('6. Preserves fallback cursorPositionRef when selection is blurred', () => {
    const rawContent = 'المسألة الأولى في بيان حكم الصلاة';
    const caretPos = 14;

    const result = insertFootnoteAtCaret({
      rawContent,
      selectionStart: null, // blurred from textarea
      selectionEnd: null,
      cursorFallback: caretPos,
      footnotes: []
    });

    assert.strictEqual(result.updatedContent.indexOf('(1)'), caretPos + 1);
  });

  test('7. Sequential footnote numbering and renumbering on delete', () => {
    let content = 'النص الأول والنص الثاني والنص الثالث';
    let fns = [];

    // Insert 1st footnote after النص الأول
    const pos1 = content.indexOf('النص الأول') + 'النص الأول'.length;
    const r1 = insertFootnoteAtCaret({ rawContent: content, selectionStart: pos1, selectionEnd: pos1, footnotes: fns });
    content = r1.updatedContent;
    fns = r1.updatedFootnotes;

    // Insert 2nd footnote after النص الثاني
    const pos2 = content.indexOf('والنص الثاني') + 'والنص الثاني'.length;
    const r2 = insertFootnoteAtCaret({ rawContent: content, selectionStart: pos2, selectionEnd: pos2, footnotes: fns });
    content = r2.updatedContent;
    fns = r2.updatedFootnotes;

    assert.strictEqual(fns.length, 2);
    assert.strictEqual(fns[0].marker, '(1)');
    assert.strictEqual(fns[1].marker, '(2)');
    assert.ok(content.includes('(1)'));
    assert.ok(content.includes('(2)'));

    // Now delete footnote 1 and renumber
    const remaining = fns.filter((_, i) => i !== 0).map((fn, idx) => ({
      ...fn,
      number: idx + 1,
      marker: `(${idx + 1})`
    }));

    let updatedContent = content.replace('(1)', '').replace(/\s{2,}/g, ' ');
    // Renumber remaining (2) -> (1)
    updatedContent = updatedContent.replace('(2)', '(1)');

    assert.strictEqual(remaining.length, 1);
    assert.strictEqual(remaining[0].number, 1);
    assert.strictEqual(remaining[0].marker, '(1)');
    assert.ok(updatedContent.includes('(1)'));
    assert.ok(!updatedContent.includes('(2)'));
  });
});
