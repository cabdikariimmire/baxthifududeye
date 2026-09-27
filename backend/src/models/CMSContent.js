const mongoose = require('mongoose');

const cmsContentSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    title: {
      type: mongoose.Schema.Types.Mixed,
      default: ''
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    draftContent: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published'
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

cmsContentSchema.statics.getPublishedBySlug = async function (slug) {
  const record = await this.findOne({ slug });
  if (!record || record.status !== 'published') {
    return null;
  }
  return record.content;
};

module.exports = mongoose.model('CMSContent', cmsContentSchema);
