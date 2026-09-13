const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema(
  {
    blockId: { type: String, default: () => `blk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` },
    type: {
      type: String,
      enum: ['mabhath', 'matlab', 'branch', 'h1', 'h2', 'h3', 'paragraph', 'quote'],
      default: 'paragraph'
    },
    text: {
      type: String,
      required: true
    },
    footnoteRefs: [{ type: String }] // List of unique footnoteId strings
  },
  { _id: true }
);

const footnoteSourceSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    author: { type: String, default: '' },
    publisher: { type: String, default: '' },
    city: { type: String, default: '' },
    edition: { type: String, default: '' },
    year: { type: String, default: '' },
    url: { type: String, default: '' }
  },
  { _id: false }
);

const footnoteSchema = new mongoose.Schema(
  {
    footnoteId: {
      type: String,
      required: true,
      default: () => `fn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    },
    number: {
      type: Number,
      required: true
    },
    marker: {
      type: String,
      default: '(1)'
    },
    text: {
      type: String,
      required: true
    },
    sectionId: { type: String, default: '' },
    paragraphId: { type: String, default: '' },
    source: {
      type: footnoteSourceSchema,
      default: () => ({})
    },
    rawText: {
      type: String,
      default: ''
    }
  },
  { _id: true }
);

const topicBranchSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => `branch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` },
    type: {
      type: String,
      enum: ['mabhath', 'matlab', 'branch'],
      default: 'branch'
    },
    title: { type: String, required: true },
    order: { type: Number, default: 1 },
    parentId: { type: String, default: null }
  },
  { _id: true }
);

const topicSchema = new mongoose.Schema(
  {
    topicId: { type: String, required: true },
    structureNodeId: { type: String, default: null },
    nodeType: {
      type: String,
      enum: ['mabhath', 'matlab', 'branch'],
      default: 'matlab'
    },
    order: { type: Number, required: true },
    h1Title: { type: String, required: true },
    mabhathId: { type: String, default: null },
    mabhathTitle: { type: String, default: null },
    mabhathOrder: { type: Number, default: null },
    matlabOrder: { type: Number, default: null },
    status: {
      type: String,
      enum: ['incomplete', 'in_progress', 'complete'],
      default: 'incomplete'
    },
    branches: [topicBranchSchema],
    rawContent: { type: String, default: '' },
    blocks: [blockSchema],
    footnotes: [footnoteSchema]
  },
  { _id: true }
);

const referenceSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    letterGroup: { type: String, default: '' }, // e.g. 'أ', 'ب', 'ك'
    sortKey: { type: String, default: '' },
    normalizedKey: { type: String, default: '' },
    book: { type: String, required: true },
    author: { type: String, default: '' },
    publisher: { type: String, default: '' },
    city: { type: String, default: '' },
    edition: { type: String, default: '' },
    year: { type: String, default: '' },
    rawFootnote: { type: String, default: '' }
  },
  { _id: true }
);

const tocEntrySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    level: { type: Number, default: 1 }, // 1 for H1, 2 for H2, 3 for H3
    pageNumber: { type: Number, required: true },
    targetId: { type: String, required: true },
    anchorId: { type: String, default: '' }
  },
  { _id: true }
);

const researchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['draft', 'structure_review', 'in_progress', 'ready', 'exported'],
      default: 'draft',
      index: true
    },
    currentStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    templateId: {
      type: String,
      default: 'template-default-a4'
    },
    borderId: {
      type: String,
      default: 'none'
    },
    cover: {
      country: { type: String, default: '' },
      university: { type: String, default: '' },
      college: { type: String, default: '' },
      subject: { type: String, default: '' },
      title: { type: String, default: '' },
      studentName: { type: String, default: '' },
      level: { type: String, default: '' },
      supervisor: { type: String, default: '' },
      academicYear: { type: String, default: '' },
      gregorianYear: { type: String, default: '' },
      logoUrl: { type: String, default: '' },
      badgeColor: { type: String, default: '#38761d' },
      coverLayout: { type: mongoose.Schema.Types.Mixed, default: null }
    },
    introduction: {
      opening: { type: String, default: '' },
      text: { type: String, default: '' },
      planSummary: { type: String, default: '' }
    },
    structure: {
      confirmed: { type: Boolean, default: false },
      tree: { type: mongoose.Schema.Types.Mixed, default: [] },
      detectedMataleeb: [
        {
          id: { type: String },
          type: { type: String },
          title: { type: String, required: true },
          order: { type: Number, default: 1 },
          parentId: { type: String, default: null },
          branches: [
            {
              id: { type: String },
              type: { type: String },
              title: { type: String },
              order: { type: Number }
            }
          ]
        }
      ]
    },
    topics: [topicSchema],
    conclusion: {
      title: { type: String, default: 'الخاتمة' },
      text: { type: String, default: '' },
      points: [{ type: String }]
    },
    references: [referenceSchema],
    toc: [tocEntrySchema],
    documentMetadata: {
      totalPages: { type: Number, default: 1 },
      version: { type: Number, default: 1 },
      lastExportedAt: { type: Date, default: null }
    }
  },
  {
    timestamps: true
  }
);

researchSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Research', researchSchema);
