/**
 * Reference Deduplicator
 * Removes duplicate books based on normalized title and author.
 */

function deduplicateReferences(references) {
  const seenKeys = new Set();
  const uniqueReferences = [];

  references.forEach((ref) => {
    if (!ref || !ref.book) return;

    const key = ref.normalizedKey || ref.book.trim().toLowerCase();
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueReferences.push({
        ...ref,
        order: uniqueReferences.length + 1
      });
    }
  });

  return uniqueReferences;
}

module.exports = { deduplicateReferences };
