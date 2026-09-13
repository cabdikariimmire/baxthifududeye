const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    templateId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    nameAr: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    version: {
      type: Number,
      default: 1
    },
    originalPdfPath: {
      type: String,
      default: null
    },
    rules: {
      pageSize: {
        type: String,
        default: 'A4'
      },
      direction: {
        type: String,
        default: 'rtl'
      },
      fontFamily: {
        type: String,
        default: "'Amiri', 'Traditional Arabic', serif"
      },
      margins: {
        topMm: { type: Number, default: 25 },
        bottomMm: { type: Number, default: 25 },
        rightMm: { type: Number, default: 30 },
        leftMm: { type: Number, default: 25 }
      },
      typography: {
        titlePt: { type: Number, default: 22 },
        h1Pt: { type: Number, default: 18 },
        h2Pt: { type: Number, default: 16 },
        h3Pt: { type: Number, default: 14 },
        bodyPt: { type: Number, default: 14 },
        footnotePt: { type: Number, default: 10 },
        lineHeight: { type: Number, default: 1.6 }
      },
      defaultBorderId: {
        type: String,
        default: 'border-academic-red'
      },
      footnoteRules: {
        numberingStyle: { type: String, default: 'arabic' }, // 1, 2, 3 or arabic-indic ١, ٢, ٣
        separatorLine: { type: Boolean, default: true },
        stripVolumeAndPageFromBibliography: { type: Boolean, default: true }
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Template', templateSchema);
