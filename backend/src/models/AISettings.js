const mongoose = require('mongoose');

const aiSettingsSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['openrouter', 'nvidia', 'custom'],
      default: 'openrouter'
    },
    model: {
      type: String,
      default: 'nvidia/llama-3.1-nemotron-70b-instruct:free'
    },
    customApiKey: {
      type: String,
      default: '',
      select: false // never expose in general queries
    },
    temperature: {
      type: Number,
      default: 0.1,
      min: 0,
      max: 1
    },
    maxTokens: {
      type: Number,
      default: 4096
    },
    systemInstructions: {
      type: String,
      default: 'أنت خبير أكاديمي في هيكلة وتنظيم البحوث العلمية وفق المعايير والتقاليد الجامعية العربية.'
    },
    featuresEnabled: {
      introductionAnalysis: { type: Boolean, default: true },
      topicStructuring: { type: Boolean, default: true },
      referenceExtraction: { type: Boolean, default: true }
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AISettings', aiSettingsSchema);
