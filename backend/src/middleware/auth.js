const { getAuth, clerkClient } = require('@clerk/express');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

const DESIGNATED_SUPER_ADMIN_EMAIL = 'abdikrimmireahmd@gmail.com';

function isDesignatedSuperAdmin(email) {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  const configuredEmails = (config.superAdminEmails && config.superAdminEmails.length > 0)
    ? config.superAdminEmails
    : [DESIGNATED_SUPER_ADMIN_EMAIL];
  return normalized === DESIGNATED_SUPER_ADMIN_EMAIL || configuredEmails.includes(normalized);
}

/**
 * Helper to safely sync or link a Clerk user with a MongoDB User document.
 * Guarantees:
 * - Existing MongoDB users with research projects keep their original _id.
 * - clerkId is attached to matched user by verified email or created as a new user.
 * - Designated Super Admin email automatically receives role: 'super_admin'.
 * - req.user is always a valid Mongoose User document.
 */
async function getOrCreateMongoUserForClerk(clerkUserId) {
  if (!clerkUserId) return null;

  // 1. First, attempt to find user by existing clerkId
  let user = await User.findOne({ clerkId: clerkUserId });
  if (user) {
    if (isDesignatedSuperAdmin(user.email) && user.role !== 'super_admin') {
      user.role = 'super_admin';
      await user.save();
    }
    return user;
  }

  // 2. If not found by clerkId, fetch user profile from Clerk API to safely match by email
  let clerkUser = null;
  try {
    clerkUser = await clerkClient.users.getUser(clerkUserId);
  } catch (err) {
    console.error('Failed to fetch Clerk user details for ID:', clerkUserId, err.message);
  }

  if (clerkUser) {
    // Extract primary or verified email
    const primaryEmailObj = (clerkUser.emailAddresses || []).find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    ) || (clerkUser.emailAddresses || [])[0];

    const email = primaryEmailObj?.emailAddress ? primaryEmailObj.emailAddress.trim().toLowerCase() : null;
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
      (email ? email.split('@')[0] : 'باحث أكاديمي');

    const isSuperAdminEmail = isDesignatedSuperAdmin(email);

    if (email) {
      // 3. Search for existing MongoDB user by email to preserve legacy data & research
      user = await User.findOne({ email });
      if (user) {
        user.clerkId = clerkUserId;
        if (!user.name || user.name === 'مستخدم') {
          user.name = name;
        }
        user.emailVerified = true;
        if (isSuperAdminEmail && user.role !== 'super_admin') {
          user.role = 'super_admin';
        }
        await user.save();
        return user;
      }
    }

    // 4. No existing user found: create a new MongoDB User linked to this clerkId
    user = await User.create({
      clerkId: clerkUserId,
      email: email || `${clerkUserId}@clerk.user`,
      name: name || 'باحث أكاديمي',
      emailVerified: true,
      status: 'active',
      role: isSuperAdminEmail ? 'super_admin' : 'user'
    });

    return user;
  }

  // 5. Fallback if Clerk API call failed: create placeholder user by clerkId
  user = await User.create({
    clerkId: clerkUserId,
    email: `${clerkUserId}@clerk.user`,
    name: 'باحث أكاديمي',
    emailVerified: true,
    status: 'active',
    role: 'user'
  });

  return user;
}


/**
 * Authentication Middleware
 * 1. Checks Clerk authentication state via getAuth(req).
 * 2. If Clerk token present: resolves/syncs MongoDB user and attaches to req.user.
 * 3. Fallback: Checks legacy JWT token from cookie or Authorization header (for backward compatibility).
 */
const authenticate = async (req, res, next) => {
  try {
    // A. Check Clerk Authentication
    let clerkAuth = null;
    try {
      clerkAuth = getAuth(req);
    } catch (_) {
      // getAuth may throw if clerkMiddleware wasn't run on route, ignore and check token
    }

    if (clerkAuth && clerkAuth.userId) {
      const user = await getOrCreateMongoUserForClerk(clerkAuth.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'المستخدم غير مسجل في قاعدة البيانات'
        });
      }

      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: 'تم تجميد هذا الحساب'
        });
      }

      if (isDesignatedSuperAdmin(user.email) && user.role !== 'super_admin') {
        user.role = 'super_admin';
        await user.save();
      }

      req.user = user;
      req.clerkAuth = clerkAuth;
      return next();
    }

    // B. Fallback to legacy JWT token for backward compatibility / existing tests
    let token = null;
    if (req.cookies && (req.cookies.token || req.cookies.auth_token)) {
      token = req.cookies.token || req.cookies.auth_token;
    } else if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token && typeof token === 'string' && token.trim()) {
      try {
        const decoded = jwt.verify(token.trim(), config.jwtSecret);
        if (decoded && decoded.id) {
          const user = await User.findById(decoded.id);
          if (user) {
            if (user.status !== 'active') {
              return res.status(401).json({
                success: false,
                code: 'UNAUTHORIZED',
                message: 'تم تجميد هذا الحساب'
              });
            }
            if (isDesignatedSuperAdmin(user.email) && user.role !== 'super_admin') {
              user.role = 'super_admin';
              await user.save();
            }
            req.user = user;
            return next();
          }
        }
      } catch (_) {
        // Token was invalid, proceed to 401 response below
      }
    }

    // No valid Clerk session or JWT found
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'يرجى تسجيل الدخول للوصول إلى هذا المحتوى'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Strict Role Authorization Middleware: Super Admin & Admin Allowed
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'يرجى تسجيل الدخول أولاً'
    });
  }

  const role = req.user.role;
  if (role !== 'admin' && role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'غير مصرح لك بالوصول إلى لوحة الإدارة'
    });
  }

  return next();
};

/**
 * Strict Role Authorization Middleware: Super Admin Exclusively
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'يرجى تسجيل الدخول أولاً'
    });
  }

  const role = req.user.role;
  if (role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'يتطلب هذا الإجراء صلاحيات مدير النظام الكاملة (Super Admin)'
    });
  }

  return next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireSuperAdmin,
  getOrCreateMongoUserForClerk,
  isDesignatedSuperAdmin,
  DESIGNATED_SUPER_ADMIN_EMAIL
};


