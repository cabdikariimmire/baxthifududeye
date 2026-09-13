const mongoose = require('mongoose');

const borderSchema = new mongoose.Schema(
  {
    borderId: {
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
    category: {
      type: String,
      enum: ['academic', 'islamic', 'classic', 'traditional', 'minimal', 'decorative'],
      default: 'academic'
    },
    accentColor: {
      type: String,
      default: '#8B0000'
    },
    svgPattern: {
      type: String,
      required: true
    },
    previewSvg: {
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
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Border', borderSchema);
