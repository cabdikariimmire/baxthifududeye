const AIService = require('../ai/aiService');
const { normalizeReference } = require('./normalizer');
const { deduplicateReferences } = require('./deduplicator');
const { sortReferencesArabic, groupReferencesByArabicLetter } = require('./arabicSort');

/**
 * Scan all footnotes in research and generate final normalized, deduplicated,
 * Arabic-alphabetically sorted bibliography grouped by letter.
 */
async function extractReferencesFromResearch(research, userId) {
  // 1. Collect all footnotes across all topics
  const allFootnotes = [];

  if (research.topics && Array.isArray(research.topics)) {
    research.topics.forEach((topic) => {
      if (topic.footnotes && Array.isArray(topic.footnotes)) {
        topic.footnotes.forEach((f) => {
          if (f.text && f.text.trim()) {
            allFootnotes.push({
              footnoteId: f.footnoteId || `fn-${f.number}`,
              number: f.number,
              marker: f.marker || `(${f.number})`,
              text: f.text.trim(),
              source: f.source || {},
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

  // 2. Use AI service / adapter for structured extraction
  const aiResult = await AIService.extractBibliography({
    userId,
    researchId: research._id,
    footnotes: allFootnotes
  });

  const rawReferences = aiResult.references || [];

  // 3. Normalize (stripping volume and page information per academic rules)
  const normalized = rawReferences
    .map(normalizeReference)
    .filter(Boolean);

  // 4. Deduplicate repeated citations of the same book
  const deduplicated = deduplicateReferences(normalized);

  // 5. Arabic Alphabetical Sorting (ignoring leading 'ال' for sorting, keeping in display)
  const sorted = sortReferencesArabic(deduplicated, { ignoreAl: true });

  // 6. Group by Arabic Letter
  const grouped = groupReferencesByArabicLetter(sorted, { ignoreAl: true });

  // Flatten back with letterGroup metadata
  const finalReferences = [];
  let currentOrder = 1;

  Object.keys(grouped).forEach((letter) => {
    grouped[letter].forEach((ref) => {
      finalReferences.push({
        ...ref,
        order: currentOrder++,
        letterGroup: letter
      });
    });
  });

  return finalReferences;
}

module.exports = { extractReferencesFromResearch };
