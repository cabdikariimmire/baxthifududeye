const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null
    },
    userName: {
      type: String,
      default: ''
    },
    userEmail: {
      type: String,
      default: ''
    },
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        'user_login',
        'user_register',
        'email_verified',
        'password_reset_requested',
        'password_reset_completed',
        'research_created',
        'research_updated',
        'pdf_exported',
        'docx_exported',
        'role_changed',
        'user_status_changed',
        'ai_action',
        'settings_updated'
      ]
    },
    targetId: {
      type: String,
      default: null
    },
    details: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['success', 'warning', 'error'],
      default: 'success'
    },
    ip: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

activityLogSchema.index({ createdAt: -1 });

/**
 * Safely record an activity event without blocking execution
 */
activityLogSchema.statics.record = async function ({
  userId = null,
  userName = '',
  userEmail = '',
  action,
  targetId = null,
  details = '',
  status = 'success',
  ip = null
}) {
  try {
    return await this.create({
      userId,
      userName,
      userEmail,
      action,
      targetId,
      details,
      status,
      ip
    });
  } catch (err) {
    console.warn('[ActivityLog] Could not record activity:', err.message);
    return null;
  }
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);
