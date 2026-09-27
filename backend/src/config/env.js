const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

// In production, ensure critical secrets are explicitly provided and not default development values
if (isProduction) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('dev') || process.env.JWT_SECRET.length < 32) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET must be explicitly set with high entropy in production environment.');
  }
  if (!process.env.COOKIE_SECRET || process.env.COOKIE_SECRET.includes('dev') || process.env.COOKIE_SECRET.length < 16) {
    throw new Error('FATAL SECURITY ERROR: COOKIE_SECRET must be explicitly set with high entropy in production environment.');
  }
}

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_research_assistant',
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  clerkSecretKey: process.env.CLERK_SECRET_KEY || '',
  jwtSecret: process.env.JWT_SECRET || (isProduction ? '' : 'academic_research_jwt_secret_dev_2026'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieSecret: process.env.COOKIE_SECRET || (isProduction ? '' : 'academic_cookie_secret_dev_2026'),
  frontendUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
  maxUploadMb: parseInt(process.env.MAX_UPLOAD_MB || '20', 10),
  
  // SMTP Email Configuration
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'منصة بحوثي الأكاديمية <noreply@academic.edu>'
  },

  ai: {
    provider: process.env.AI_PROVIDER || 'openrouter',
    model: process.env.AI_MODEL || 'nvidia/llama-3.1-nemotron-70b-instruct:free',
    apiKey: process.env.AI_API_KEY || ''
  },

  // Designated Super Admin emails
  superAdminEmails: (process.env.SUPER_ADMIN_EMAILS || 'abdikrimmireahmd@gmail.com')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
};


module.exports = config;
