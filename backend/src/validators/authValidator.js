const { z } = require('zod');

const registerSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2, 'الاسم يجب أن يحتوي على حرفين على الأقل').max(100, 'الاسم طويل جداً'),
      email: z.string().trim().toLowerCase().email('يرجى إدخال بريد إلكتروني صالح'),
      password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف'),
      confirmPassword: z.string().min(1, 'يرجى تأكيد كلمة المرور')
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'كلمتا المرور غير متطابقتين',
      path: ['confirmPassword']
    })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('يرجى إدخال بريد إلكتروني صالح'),
    password: z.string().min(1, 'كلمة المرور مطلوبة')
  })
});

const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().trim().min(10, 'رمز التفعيل غير صالح')
  })
});

const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('يرجى إدخال بريد إلكتروني صالح')
  })
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('يرجى إدخال بريد إلكتروني صالح')
  })
});

const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z.string().trim().min(10, 'رمز إعادة التعيين غير صالح'),
      password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف'),
      confirmPassword: z.string().min(1, 'يرجى تأكيد كلمة المرور')
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'كلمتا المرور غير متطابقتين',
      path: ['confirmPassword']
    })
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
