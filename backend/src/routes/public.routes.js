const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Research = require('../models/Research');
const ActivityLog = require('../models/ActivityLog');

const cmsController = require('../controllers/cmsController');

// Contact rate limiter to prevent spam
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'تم تجاوز الحد المسموح به من الرسائل. يرجى المحاولة بعد قليل.'
  }
});

/**
 * Public CMS Content & Site Settings Endpoints
 */
router.get('/cms/:slug', cmsController.getPublicContent);
router.get('/settings', cmsController.getPublicSettings);


/**
 * GET /api/public/stats
 * Returns real dynamic statistics from the database.
 * No hard-coded fake numbers.
 */
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalResearches, completedResearches, distinctUniversities] = await Promise.all([
      User.countDocuments({ status: 'active' }),
      Research.countDocuments(),
      Research.countDocuments({ status: { $in: ['ready', 'exported'] } }),
      Research.distinct('cover.university', { 'cover.university': { $nin: ['', null] } })
    ]);

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalResearches,
        completedResearches,
        universitiesCount: distinctUniversities.length,
        hasActivity: totalUsers > 0 || totalResearches > 0
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/public/contact
 * Handles contact form inquiries securely with validation and rate limiting.
 */
router.post('/contact', contactLimiter, async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'يرجى كتابة الاسم الكريم'
      });
    }

    if (!email || typeof email !== 'string' || !/\S+@\S+\.\S+/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'يرجى إدخال بريد إلكتروني صالح'
      });
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'يرجى تحديد موضوع الرسالة'
      });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'يرجى كتابة تفاصيل الرسالة (١٠ أحرف على الأقل)'
      });
    }

    // Log contact event in ActivityLog for admin review
    ActivityLog.record({
      userName: name.trim(),
      userEmail: email.trim().toLowerCase(),
      action: 'contact_inquiry_submitted',
      details: `استفسار جديد من: ${name.trim()} [${subject.trim()}]: ${message.trim().substring(0, 100)}...`
    });

    return res.status(200).json({
      success: true,
      message: 'شكراً لتواصلك معنا. تم استلام رسالتك وسيقوم فريق الدعم بالرد عليك قريباً.'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
