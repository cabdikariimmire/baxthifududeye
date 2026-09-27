/**
 * Reference Deduplicator
 * Preserves user-written text verbatim and prevents duplicate entries for the same source,
 * without inventing, merging, or synthesizing metadata across footnotes (per Requirement 7).
 */
const { generateNormalizedKey } = require('./normalizer');

function deduplicateReferences(references) {
  if (!Array.isArray(references)) return [];

  const keyMap = new Map(); // key -> reference item

  references.forEach((ref) => {
    if (!ref) return;
    const text = (ref.displayText || ref.book || '').trim();
    if (!text) return;

    const key = ref.normalizedKey || generateNormalizedKey(text);
    if (!key) return;

    // Requirement 7:
    // If the same source/reference is used in multiple footnotes, do not invent or merge
    // additional metadata from those footnotes. Keep the first occurrence as-is.
    if (!keyMap.has(key)) {
      keyMap.set(key, { ...ref });
    }
  });

  const uniqueReferences = Array.from(keyMap.values()).map((ref, idx) => ({
    ...ref,
    order: idx + 1
  }));

  return uniqueReferences;
}

module.exports = { deduplicateReferences };
