const { getAuth } = require('@clerk/express');
const jwt = require('jsonwebtoken');
const SiteSettings = require('../models/SiteSettings');
const User = require('../models/User');
const config = require('../config/env');
const { getOrCreateMongoUserForClerk } = require('./auth');

/**
 * Server-Side Maintenance Mode Enforcement Middleware
 * 
 * When Maintenance Mode is active:
 * - Public visitors and normal users are blocked with HTTP 503.
 * - Essential auth endpoints and public settings metadata remain open.
 * - Authorized administrators (Super Admin & Admin) are permitted normal access.
 */
const maintenanceMiddleware = async (req, res, next) => {
  try {
    // 1. Check if route is strictly exempt from maintenance checks
    const path = req.path;
    const isExempt = 
      path.startsWith('/api/health') ||
      path.startsWith('/api/public/settings') ||
      path.startsWith('/api/auth') ||
      path.startsWith('/uploads');

    if (isExempt) {
      return next();
    }

    // 2. Fetch current site maintenance state
    let settings = await SiteSettings.findOne();
    const isMaintenanceOn = settings?.system?.maintenanceMode === true;

    if (!isMaintenanceOn) {
      return next();
    }

    // 3. Maintenance is ON: Check if incoming request is from an authorized administrator
    let authorizedUser = null;

    // A. Check Clerk Authentication
    let clerkAuth = null;
    try {
      clerkAuth = getAuth(req);
    } catch (_) {}

    if (clerkAuth && clerkAuth.userId) {
      const user = await getOrCreateMongoUserForClerk(clerkAuth.userId);
      if (user && ['admin', 'super_admin'].includes(user.role) && user.status === 'active') {
        authorizedUser = user;
      }
    }

    // B. Check Legacy / Bearer JWT token if Clerk not present
    if (!authorizedUser) {
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
            if (user && ['admin', 'super_admin'].includes(user.role) && user.status === 'active') {
              authorizedUser = user;
            }
          }
        } catch (_) {}
      }
    }

    // 4. If authorized admin: attach user and allow through
    if (authorizedUser) {
      req.user = authorizedUser;
      return next();
    }

    // 5. If path is an admin route, let the admin route handler's authenticate middleware handle 401/403
    if (path.startsWith('/api/admin')) {
      return next();
    }

    // 6. Block public access with HTTP 503 Service Unavailable
    return res.status(503).json({
      success: false,
      code: 'MAINTENANCE_MODE',
      message: settings.system?.maintenanceMessage || 'الموقع قيد الصيانة حالياً. يرجى الانتظار حتى انتهاء أعمال الصيانة.',
      data: {
        maintenanceMode: true,
        title: settings.system?.maintenanceTitle || 'الموقع قيد الصيانة حالياً',
        message: settings.system?.maintenanceMessage || 'نعمل حالياً على إجراء بعض التحسينات والإصلاحات لنقدم لكم تجربة بحث أكاديمي أفضل. يرجى الانتظار حتى انتهاء أعمال الصيانة.'
      }
    });
  } catch (err) {
    console.error('[MaintenanceMiddleware] Error checking maintenance state:', err.message);
    next();
  }
};

module.exports = maintenanceMiddleware;
