const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const isTestEnv = config.nodeEnv === 'test';

/**
 * Standard Auth Limiter (Login, Register)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTestEnv ? 1000 : 30, // 30 requests per 15 mins in normal usage
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'تم تجاوز الحد المسموح من محاولات المصادقة، يرجى المحاولة بعد 15 دقيقة'
  }
});

/**
 * Strict Password Recovery Limiter (Forgot & Reset Password)
 */
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 1000 : 10, // 10 attempts per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'تم تجاوز الحد المسموح لطلبات استعادة كلمة المرور، يرجى المحاولة لاحقاً'
  }
});

/**
 * Email Verification Resend Limiter
 */
const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 1000 : 10, // 10 resend requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'تم تجاوز عدد طلبات إعادة إرسال رابط التفعيل، يرجى الانتظار قليلاً'
  }
});

module.exports = {
  authLimiter,
  passwordResetLimiter,
  verificationLimiter
};
