const { normalizeReference } = require('./normalizer');
const { deduplicateReferences } = require('./deduplicator');
const {
  sortReferencesArabic,
  getArabicFirstLetter,
  getReferenceSortTarget
} = require('./arabicSort');

/**
 * Scan all footnotes in research and generate final references section ONLY from actual
 * user footnote data, strictly stripping volume and page information, without hallucinating,
 * inferring, completing, or modifying user wording.
 */
async function extractReferencesFromResearch(research, userId) {
  // 1. Collect all footnotes across all topics written by the user
  const allFootnotes = [];

  if (research.topics && Array.isArray(research.topics)) {
    research.topics.forEach((topic) => {
      if (topic.footnotes && Array.isArray(topic.footnotes)) {
        topic.footnotes.forEach((f) => {
          const txt = (f.text || f.rawText || '').trim();
          if (txt) {
            allFootnotes.push({
              footnoteId: f.footnoteId || `fn-${f.number}`,
              number: f.number,
              marker: f.marker || `(${f.number})`,
              text: txt,
              topicId: topic.topicId
            });
          }
        });
      }
    });
  }

  if (allFootnotes.length === 0) {
    return [];
  }

  // 2. Generate reference entries ONLY from user-written footnote text:
  // Strip ONLY volume & page information, preserve all wording and internal repetitions verbatim.
  const normalized = allFootnotes
    .map((f) => normalizeReference(f.text))
    .filter(Boolean);

  // 3. Deduplicate references for identical sources without merging metadata
  const deduplicated = deduplicateReferences(normalized);

  // 4. Arabic Alphabetical Sorting (ignoring leading 'ال' for sorting, keeping in display)
  const sorted = sortReferencesArabic(deduplicated, { ignoreAl: true });

  // 5. Assign sequential order and letterGroup
  const finalReferences = sorted.map((ref, idx) => {
    const sortTarget = getReferenceSortTarget(ref, { ignoreAl: true });
    const letter = getArabicFirstLetter(sortTarget, { ignoreAl: true });
    return {
      ...ref,
      order: idx + 1,
      letterGroup: letter
    };
  });

  return finalReferences;
}

module.exports = { extractReferencesFromResearch };
