const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

/**
 * Seamless Zero-Barrier Authentication Middleware
 * Automatically attaches an active academic user from the database
 * so all research, wizard, export, and admin operations work directly without login barriers.
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && (req.cookies.token || req.cookies.auth_token)) {
      token = req.cookies.token || req.cookies.auth_token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token && typeof token === 'string' && token.trim()) {
      try {
        const decoded = jwt.verify(token.trim(), config.jwtSecret);
        if (decoded && decoded.id) {
          const user = await User.findById(decoded.id);
          if (user && user.status === 'active') {
            req.user = user;
            return next();
          }
        }
      } catch (_) {
        // Fall through to primary active academic user
      }
    }

    // Attach or initialize primary active academic user
    let user = await User.findOne({ role: 'admin', status: 'active' });
    if (!user) {
      user = await User.findOne({ status: 'active' });
    }
    if (!user) {
      user = await User.findOne();
    }
    if (!user) {
      user = await User.create({
        name: 'باحث أكاديمي',
        email: 'admin@academic.edu',
        role: 'admin',
        status: 'active',
        emailVerified: true
      });
    }

    req.user = user;
    return next();
  } catch (err) {
    next(err);
  }
};

/**
 * Zero-Barrier Admin Authorization Middleware
 */
const requireAdmin = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  // Ensure admin privileges are granted to active user
  let adminUser = await User.findOne({ role: 'admin', status: 'active' });
  if (!adminUser) {
    if (req.user) {
      req.user.role = 'admin';
      await req.user.save();
      adminUser = req.user;
    } else {
      adminUser = await User.create({
        name: 'مدير النظام الأكاديمي',
        email: 'admin@academic.edu',
        role: 'admin',
        status: 'active',
        emailVerified: true
      });
    }
  }

  req.user = adminUser;
  return next();
};

module.exports = { authenticate, requireAdmin };
