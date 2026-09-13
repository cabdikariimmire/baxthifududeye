const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]:', err);

  const isProd = process.env.NODE_ENV === 'production';

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_ID',
      message: 'معرف غير صالح'
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {

    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: messages.join(', '),
      ...(isProd ? {} : { errors: err.errors })
    });
  }

  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      code: 'DUPLICATE_KEY',
      message: `الحقل (${field}) مستخدم مسبقاً`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'رمز المصادقة غير صالح أو منتهي الصلاحية'
    });
  }

  // Default internal server error
  const statusCode = err.statusCode || 500;
  const safeMessage = statusCode >= 500
    ? (isProd ? 'حدث خطأ غير متوقع في الخادم. حاول مرة أخرى.' : (err.message || 'حدث خطأ داخلي في الخادم'))
    : (err.message || 'طلب غير صالح');

  return res.status(statusCode).json({
    success: false,
    code: err.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST'),
    message: safeMessage
  });

};

module.exports = errorHandler;
