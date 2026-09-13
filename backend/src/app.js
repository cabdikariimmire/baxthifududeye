const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const researchRoutes = require('./routes/research.routes');
const adminRoutes = require('./routes/admin.routes');
const defaultBorders = require('./services/document/defaultBorders');

const app = express();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // allow font & svg rendering for previews
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const isProduction = config.nodeEnv === 'production';
const allowedOrigins = [config.frontendUrl].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // In development mode, support all local dev hosts (localhost, 127.0.0.1, LAN dev IPs)
    if (!isProduction) {
      return callback(null, true);
    }
    // In production mode, enforce explicit configured frontendUrl
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin', 'Cache-Control', 'Pragma'],
  credentials: true
}));

// Cookie Parser Middleware
app.use(cookieParser(config.cookieSecret));

// Rate Limiter for general API traffic
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً'
  }
});
app.use('/api', apiLimiter);

// Logging & Parsing
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads
app.use('/uploads', express.static(config.uploadDir));

// Public Borders Endpoint for frontend selector
app.get('/api/borders/public', (req, res) => {
  return res.json({
    success: true,
    data: { borders: defaultBorders }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/researches', researchRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'AI Research Assistant API',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 'ENDPOINT_NOT_FOUND',
    message: 'المسار المطلوب غير موجود'
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
