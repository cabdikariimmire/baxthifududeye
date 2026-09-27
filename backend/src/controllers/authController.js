const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const config = require('../config/env');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email/emailService');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

const getCookieOptions = () => {
  const isProduction = config.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  };
};

const setAuthCookie = (res, token) => {
  res.cookie('token', token, getCookieOptions());
};

const clearAuthCookie = (res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    path: '/'
  });
};

/**
 * 1. User Registration
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'البريد الإلكتروني مسجل بالفعل'
      });
    }

    const passwordHash = await User.hashPassword(password);

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
      emailVerified: false
    });

    const verificationToken = user.createEmailVerificationToken();
    await user.save();

    // Send email verification link
    await sendVerificationEmail(user, verificationToken);

    ActivityLog.record({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'user_register',
      details: 'تسجيل حساب جديد - بانتظار تفعيل البريد الإلكتروني'
    });

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح. يرجى مراجعة بريدك الإلكتروني لتفعيل الحساب.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Email Verification
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        code: 'TOKEN_REQUIRED',
        message: 'رمز التفعيل مطلوب'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'رمز التفعيل غير صالح أو منتهي الصلاحية'
      });
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    const authToken = generateToken(user);
    setAuthCookie(res, authToken);

    ActivityLog.record({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'email_verified',
      details: 'تفعيل البريد الإلكتروني بنجاح'
    });

    return res.json({
      success: true,
      message: 'تم تفعيل البريد الإلكتروني بنجاح. تم تسجيل دخولك تلقائياً.',
      data: {
        token: authToken, // Provided for API test convenience while cookie is set for browser
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: true
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. Resend Email Verification
 */
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (user && !user.emailVerified) {
      const verificationToken = user.createEmailVerificationToken();
      await user.save();
      await sendVerificationEmail(user, verificationToken);
    }

    // Always return safe generic confirmation
    return res.json({
      success: true,
      message: 'إذا كان البريد الإلكتروني مسجلاً وغير مفعّل، فقد تم إرسال رابط التفعيل الجديد.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. User Login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: 'تم تجميد هذا الحساب، يرجى التواصل مع الإدارة'
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'يرجى تفعيل بريدك الإلكتروني أولاً لتتمكن من تسجيل الدخول',
        data: {
          email: user.email,
          unverified: true
        }
      });
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    ActivityLog.record({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'user_login',
      details: 'تسجيل دخول ناجح للمستخدم'
    });

    return res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        token, // Included for API test clients
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. Logout
 */
const logout = async (req, res) => {
  clearAuthCookie(res);
  return res.json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح'
  });
};

/**
 * 6. Get Current Authenticated User Profile
 */
const getMe = async (req, res) => {
  return res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        emailVerified: req.user.emailVerified,
        createdAt: req.user.createdAt
      }
    }
  });
};

/**
 * 7. Forgot Password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
      const resetToken = user.createPasswordResetToken();
      await user.save();
      await sendPasswordResetEmail(user, resetToken);
    }

    // Always return safe generic confirmation to prevent user enumeration
    return res.json({
      success: true,
      message: 'إذا كان البريد الإلكتروني مسجلاً، فسيتم إرسال رابط إعادة تعيين كلمة المرور.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. Reset Password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        code: 'TOKEN_REQUIRED',
        message: 'رمز إعادة التعيين مطلوب'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية'
      });
    }

    user.passwordHash = await User.hashPassword(password);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    ActivityLog.record({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'password_reset_completed',
      details: 'إعادة تعيين كلمة المرور بنجاح'
    });

    return res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 9. Change Password (Authenticated User)
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'يرجى إدخال كلمة المرور الحالية وكلمة المرور الجديدة'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        code: 'PASSWORD_TOO_SHORT',
        message: 'يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف'
      });
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'المستخدم غير موجود'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_CURRENT_PASSWORD',
        message: 'كلمة المرور الحالية غير صحيحة'
      });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    ActivityLog.record({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'password_changed',
      details: 'قام المستخدم بتغيير كلمة المرور من صفحة الحساب'
    });

    return res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword
};
