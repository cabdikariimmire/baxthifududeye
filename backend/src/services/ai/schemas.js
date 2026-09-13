const { z } = require('zod');

// Semantic Node Schemas for Canonical Hierarchy
const branchSchema = z.object({
  id: z.string().optional(),
  type: z.string().default('branch'),
  title: z.string().min(1),
  order: z.number().default(1),
  parentId: z.string().nullable().optional()
});

const matlabSchema = z.object({
  id: z.string().optional(),
  type: z.string().default('matlab'),
  title: z.string().min(1),
  order: z.number().default(1),
  parentId: z.string().nullable().optional(),
  children: z.array(branchSchema).default([]),
  branches: z.array(branchSchema).default([])
});

const mabhathSchema = z.object({
  id: z.string().optional(),
  type: z.string().default('mabhath'),
  title: z.string().min(1),
  order: z.number().default(1),
  parentId: z.string().nullable().optional(),
  children: z.array(matlabSchema).default([]),
  mataleeb: z.array(matlabSchema).default([])
});

const semanticNodeSchema = z.union([mabhathSchema, matlabSchema]);

const introductionAnalysisSchema = z.object({
  title: z.string().default(''),
  summary: z.string().default(''),
  tree: z.array(semanticNodeSchema).optional(),
  mataleeb: z.array(z.any()).optional()
});

// Schema for Introduction Generation
const introductionGenerationSchema = z.object({
  title: z.string().default('المقدمة وخطة البحث'),
  opening: z.string().default(''),
  fullText: z.string().min(20, 'يجب أن يحتوي نص المقدمة على محتوى أكاديمي'),
  plan: z.string().optional().default('')
});

// Schema for Topic Content Structuring
const contentBlockSchema = z.object({
  type: z.enum(['mabhath', 'matlab', 'branch', 'h1', 'h2', 'h3', 'paragraph', 'quote']),
  text: z.string().min(1)
});

const topicFootnoteSchema = z.object({
  number: z.number().optional(),
  text: z.string().min(1)
});

const topicStructureSchema = z.object({
  h1Title: z.string().min(1),
  blocks: z.array(contentBlockSchema).min(1),
  extractedFootnotes: z.array(topicFootnoteSchema).default([])
});

// Schema for References Extraction
const referenceItemSchema = z.object({
  book: z.string().min(1),
  author: z.string().nullable().optional().default(''),
  publisher: z.string().nullable().optional().default(''),
  city: z.string().nullable().optional().default(''),
  edition: z.string().nullable().optional().default(''),
  year: z.string().nullable().optional().default(''),
  rawFootnote: z.string().default('')
});

const bibliographySchema = z.object({
  references: z.array(referenceItemSchema)
});

// Schema for Full Document Analysis
const fullDocumentAnalysisSchema = z.object({
  title: z.string().nullable().optional().default(null),
  cover: z.object({
    country: z.string().nullable().optional().default(null),
    university: z.string().nullable().optional().default(null),
    college: z.string().nullable().optional().default(null),
    subject: z.string().nullable().optional().default(null),
    title: z.string().nullable().optional().default(null),
    studentName: z.string().nullable().optional().default(null),
    level: z.string().nullable().optional().default(null),
    supervisor: z.string().nullable().optional().default(null),
    academicYear: z.string().nullable().optional().default(null),
    gregorianYear: z.string().nullable().optional().default(null),
    badgeColor: z.string().nullable().optional().default(null)
  }).default({}),
  introduction: z.object({
    opening: z.string().nullable().optional().default(null),
    text: z.string().nullable().optional().default(null),
    planSummary: z.string().nullable().optional().default(null)
  }).default({}),
  tree: z.array(semanticNodeSchema).optional(),
  mataleeb: z.array(z.object({
    title: z.string().min(1),
    order: z.number().default(1),
    branches: z.array(branchSchema).default([]),
    rawContent: z.string().default(''),
    blocks: z.array(contentBlockSchema).default([]),
    footnotes: z.array(z.object({
      number: z.number().optional(),
      marker: z.string().optional(),
      text: z.string().min(1)
    })).default([])
  })).min(1, 'يجب استخراج مطلب واحد على الأقل'),
  conclusion: z.object({
    title: z.string().default('الخاتمة'),
    text: z.string().nullable().optional().default(null),
    points: z.array(z.string()).default([])
  }).default({}),
  references: z.array(referenceItemSchema).default([])
});

module.exports = {
  branchSchema,
  matlabSchema,
  mabhathSchema,
  contentBlockSchema,
  introductionAnalysisSchema,
  introductionGenerationSchema,
  topicStructureSchema,
  bibliographySchema,
  fullDocumentAnalysisSchema
};
