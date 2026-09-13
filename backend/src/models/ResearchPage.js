const mongoose = require('mongoose');

const researchPageSchema = new mongoose.Schema(
  {
    researchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Research',
      required: true,
      index: true
    },
    pageNumber: {
      type: Number,
      required: true
    },
    pageType: {
      type: String,
      enum: ['cover', 'introduction', 'topic', 'conclusion', 'references', 'toc'],
      required: true
    },
    title: {
      type: String,
      default: ''
    },
    contentHtml: {
      type: String,
      default: ''
    },
    blocks: [
      {
        type: { type: String, enum: ['mabhath', 'matlab', 'branch', 'h1', 'h2', 'h3', 'paragraph', 'quote'] },
        text: String
      }
    ],
    footnotes: [
      {
        number: Number,
        text: String
      }
    ]
  },
  {
    timestamps: true
  }
);

researchPageSchema.index({ researchId: 1, pageNumber: 1 }, { unique: true });

module.exports = mongoose.model('ResearchPage', researchPageSchema);
