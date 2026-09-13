const OpenRouterAdapter = require('./OpenRouterAdapter');
const AISettings = require('../../models/AISettings');
const AILog = require('../../models/AILog');
const env = require('../../config/env');
const aiConfig = require('../../config/ai');

class AIService {
  /**
   * Get active configured AI Adapter instance
   */
  static async getAdapter() {
    let settings = null;
    try {
      settings = await AISettings.findOne({ active: true }).select('+customApiKey');
    } catch (e) {
      // ignore if DB is initializing
    }

    const provider = settings?.provider || env.ai.provider || aiConfig.defaultProvider;
    const model = settings?.model || env.ai.model || aiConfig.defaultModel;
    const apiKey = settings?.customApiKey || env.ai.apiKey;
    const temperature = settings?.temperature !== undefined ? settings.temperature : aiConfig.temperature;

    return new OpenRouterAdapter({
      provider,
      model,
      apiKey,
      temperature
    });
  }

  /**
   * Generate academic introduction tailored to actual research title & structure
   */
  static async generateIntroduction({ userId, researchId, title, structure, mataleeb, topics }) {
    const startTime = Date.now();
    const adapter = await this.getAdapter();
    let status = 'success';
    let errorMessage = null;
    let result = null;

    try {
      result = await adapter.generateIntroduction({ title, structure, mataleeb, topics });
      return result;
    } catch (err) {
      status = 'error';
      errorMessage = err.message;
      throw err;
    } finally {
      const durationMs = Date.now() - startTime;
      try {
        await AILog.create({
          userId,
          researchId,
          provider: adapter.config?.provider || 'openrouter',
          model: adapter.model,
          task: 'introduction_generation',
          promptSummary: `Title: ${title} | Structure: ${(mataleeb || []).length} items`,
          durationMs,
          status,
          errorMessage
        });
      } catch (logErr) {
        console.warn('[AIService] Failed to write AILog:', logErr.message);
      }
    }
  }

  /**
   * Analyze introduction and log execution
   */
  static async analyzeIntroduction({ userId, researchId, text }) {
    const startTime = Date.now();
    const adapter = await this.getAdapter();
    let status = 'success';
    let errorMessage = null;
    let result = null;

    try {
      result = await adapter.analyzeIntroduction(text);
      return result;
    } catch (err) {
      status = 'error';
      errorMessage = err.message;
      throw err;
    } finally {
      const durationMs = Date.now() - startTime;
      try {
        await AILog.create({
          userId,
          researchId,
          provider: adapter.config.provider || 'openrouter',
          model: adapter.model,
          task: 'introduction_analysis',
          promptSummary: text.substring(0, 150) + '...',
          durationMs,
          status,
          errorMessage
        });
      } catch (logErr) {
        console.warn('[AIService] Failed to write AILog:', logErr.message);
      }
    }
  }

  /**
   * Structure topic content and log execution
   */
  static async structureTopicContent({ userId, researchId, title, content }) {
    const startTime = Date.now();
    const adapter = await this.getAdapter();
    let status = 'success';
    let errorMessage = null;

    try {
      const result = await adapter.structureTopicContent(title, content);
      return result;
    } catch (err) {
      status = 'error';
      errorMessage = err.message;
      throw err;
    } finally {
      const durationMs = Date.now() - startTime;
      try {
        await AILog.create({
          userId,
          researchId,
          provider: adapter.config.provider || 'openrouter',
          model: adapter.model,
          task: 'topic_structuring',
          promptSummary: `${title}: ${content.substring(0, 100)}...`,
          durationMs,
          status,
          errorMessage
        });
      } catch (logErr) {
        console.warn('[AIService] Failed to write AILog:', logErr.message);
      }
    }
  }

  /**
   * Extract bibliography from footnotes and log execution
   */
  static async extractBibliography({ userId, researchId, footnotes }) {
    const startTime = Date.now();
    const adapter = await this.getAdapter();
    let status = 'success';
    let errorMessage = null;

    try {
      const result = await adapter.extractBibliography(footnotes);
      return result;
    } catch (err) {
      status = 'error';
      errorMessage = err.message;
      throw err;
    } finally {
      const durationMs = Date.now() - startTime;
      try {
        await AILog.create({
          userId,
          researchId,
          provider: adapter.config.provider || 'openrouter',
          model: adapter.model,
          task: 'reference_extraction',
          promptSummary: `Count: ${footnotes.length} footnotes`,
          durationMs,
          status,
          errorMessage
        });
      } catch (logErr) {
        console.warn('[AIService] Failed to write AILog:', logErr.message);
      }
    }
  }

  /**
   * Analyze complete full research document and log execution
   */
  static async analyzeFullDocument({ userId, researchId, text }) {
    const startTime = Date.now();
    const adapter = await this.getAdapter();
    let status = 'success';
    let errorMessage = null;

    try {
      const result = await adapter.analyzeFullDocument(text);
      return result;
    } catch (err) {
      status = 'error';
      errorMessage = err.message;
      throw err;
    } finally {
      const durationMs = Date.now() - startTime;
      try {
        await AILog.create({
          userId,
          researchId,
          provider: adapter.config.provider || 'openrouter',
          model: adapter.model,
          task: 'full_document_analysis',
          promptSummary: text.substring(0, 150) + '...',
          durationMs,
          status,
          errorMessage
        });
      } catch (logErr) {
        console.warn('[AIService] Failed to write AILog:', logErr.message);
      }
    }
  }
}

module.exports = AIService;
