const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const {
  authLimiter,
  passwordResetLimiter,
  verificationLimiter
} = require('../middleware/rateLimiter');
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../validators/authValidator');

// 1. Registration
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register
);

// 2. Email Verification
router.post(
  '/verify-email',
  authLimiter,
  validate(verifyEmailSchema),
  authController.verifyEmail
);

// 3. Resend Email Verification
router.post(
  '/resend-verification',
  verificationLimiter,
  validate(resendVerificationSchema),
  authController.resendVerification
);

// 4. Login
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

// 5. Logout
router.post('/logout', authController.logout);

// 6. Current Authenticated User Profile
router.get('/me', authenticate, authController.getMe);

// 7. Forgot Password
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

// 8. Reset Password
router.post(
  '/reset-password',
  passwordResetLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

module.exports = router;
