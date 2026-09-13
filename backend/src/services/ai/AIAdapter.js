/**
 * Abstract AI Adapter Class
 * Defines the contract for all AI model integrations.
 */
class AIAdapter {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Generate academic introduction and research plan tailored to actual research title and structure
   * @param {Object} context - { title, structure, mataleeb, topics }
   * @returns {Promise<{title: string, opening: string, fullText: string, plan: string}>}
   */
  async generateIntroduction(context) {
    throw new Error('Method generateIntroduction() must be implemented by subclass.');
  }

  /**
   * Analyze introduction and research plan to detect research structure (مطالب / فروع)
   * @param {string} text 
   * @returns {Promise<{title: string, summary: string, mataleeb: Array}>}
   */
  async analyzeIntroduction(text) {
    throw new Error('Method analyzeIntroduction() must be implemented by subclass.');
  }

  /**
   * Structure a topic's raw content into semantic H1, H2, H3, paragraph blocks
   * @param {string} title 
   * @param {string} content 
   * @returns {Promise<{h1Title: string, blocks: Array, extractedFootnotes: Array}>}
   */
  async structureTopicContent(title, content) {
    throw new Error('Method structureTopicContent() must be implemented by subclass.');
  }

  /**
   * Extract bibliographic sources from footnotes (stripping volume and page numbers)
   * @param {Array<{number: number, text: string}>} footnotes 
   * @returns {Promise<{references: Array}>}
   */
  async extractBibliography(footnotes) {
    throw new Error('Method extractBibliography() must be implemented by subclass.');
  }
}

module.exports = AIAdapter;
