const mongoose = require('mongoose');

const aiLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    researchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Research',
      index: true
    },
    provider: {
      type: String,
      default: 'openrouter'
    },
    model: {
      type: String,
      required: true
    },
    task: {
      type: String,
      enum: ['introduction_analysis', 'topic_structuring', 'reference_extraction', 'full_document_analysis', 'test_connection'],
      required: true
    },
    promptSummary: {
      type: String,
      default: ''
    },
    tokensUsed: {
      type: Number,
      default: 0
    },
    durationMs: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['success', 'error', 'fallback_used'],
      default: 'success'
    },
    errorMessage: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

aiLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AILog', aiLogSchema);
