const { ZodError } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const errorDetails = err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message
      }));

      console.error('[VALIDATION_FAILED]', errorDetails);

      return res.status(400).json({
        success: false,
        code: 'VALIDATION_FAILED',
        message: errorDetails[0]?.message || 'بيانات الإدخال غير صالحة',
        errors: errorDetails
      });
    }
    next(err);
  }
};

module.exports = { validate };
