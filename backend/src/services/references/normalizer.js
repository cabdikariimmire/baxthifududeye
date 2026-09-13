/**
 * Reference Normalizer
 * Rule: Strip volume (ج / جزء) and page (ص / صفحة) numbers while retaining 
 * the bibliographic identity (book, author, publisher, city, edition, year).
 */

function normalizeReference(rawRef) {
  if (!rawRef) return null;

  let book = (rawRef.book || '').trim();
  let author = (rawRef.author || '').trim();
  let publisher = (rawRef.publisher || '').trim();
  let city = (rawRef.city || '').trim();
  let edition = (rawRef.edition || '').trim();
  let year = (rawRef.year || '').trim();

  // Strip (ج / جزء) and (ص / صفحة) from book or fields
  const stripRegex = /،?\s*(ج|جزء)\s*\d+.*|،?\s*(ص|صـ|صفحة)\s*[\d\-–\s]+.*/gi;
  book = book.replace(stripRegex, '').trim();
  author = author.replace(stripRegex, '').trim();
  publisher = publisher.replace(stripRegex, '').trim();

  // Create a clean bibliographic key for deduplication
  const normalizedKey = `${book.toLowerCase()}_${author.toLowerCase()}`
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\w\u0600-\u06FF]/g, '');

  return {
    book,
    author,
    publisher,
    city,
    edition,
    year,
    normalizedKey,
    rawFootnote: rawRef.rawFootnote || ''
  };
}

/**
 * Format reference item for bibliography rendering:
 * Example: إحياء علوم الدين، أبو حامد الغزالي، دار المعرفة، بيروت
 */
function formatReferenceForDisplay(ref) {
  const parts = [
    ref.book,
    ref.author,
    ref.publisher,
    ref.city,
    ref.edition,
    ref.year
  ].filter(Boolean);

  return parts.join('، ');
}

module.exports = {
  normalizeReference,
  formatReferenceForDisplay
};
