const nodemailer = require('nodemailer');
const config = require('../../config/env');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (config.smtp.host && config.smtp.user && config.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      }
    });
  } else {
    // If SMTP is not configured, transporter is null and emails will be handled in dev fallback
    transporter = null;
  }
  return transporter;
};

/**
 * Common HTML email wrapper with academic Arabic RTL styling
 */
const renderEmailTemplate = ({ title, preheader, bodyHtml, actionUrl, actionText }) => {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      direction: rtl;
      text-align: right;
      background-color: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 40px 20px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0 0 6px 0;
      font-size: 22px;
      font-weight: 800;
    }
    .header p {
      margin: 0;
      font-size: 13px;
      color: #ccfbf1;
    }
    .content {
      padding: 32px 28px;
      line-height: 1.8;
      font-size: 15px;
      color: #334155;
    }
    .action-box {
      text-align: center;
      margin: 30px 0;
    }
    .btn {
      display: inline-block;
      background-color: #0f766e;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-weight: bold;
      font-size: 15px;
      box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25);
    }
    .alt-link {
      background-color: #f1f5f9;
      padding: 14px;
      border-radius: 8px;
      word-break: break-all;
      font-size: 12px;
      direction: ltr;
      text-align: left;
      color: #475569;
      margin-top: 20px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>منصة مساعد البحث الأكاديمي</h1>
        <p>المنظومة الذكية لتوليد وتنسيق المستندات والبحوث الجامعية</p>
      </div>
      <div class="content">
        ${bodyHtml}
        
        ${actionUrl && actionText ? `
          <div class="action-box">
            <a href="${actionUrl}" class="btn" target="_blank">${actionText}</a>
          </div>
          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
            إذا لم يعمل الزر أعلاه، يمكنك نسخ الرابط التالي ولصقه في متصفحك:
          </p>
          <div class="alt-link">${actionUrl}</div>
        ` : ''}
      </div>
      <div class="footer">
        <p>هذه الرسالة تم إنشاؤها آلياً، يرجى عدم الرد على هذا البريد.</p>
        <p>جميع الحقوق محفوظة © ${new Date().getFullYear()} مساعد البحث الأكاديمي</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Send Email Verification link
 */
const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
  
  const html = renderEmailTemplate({
    title: 'تفعيل حسابك في منصة مساعد البحث الأكاديمي',
    bodyHtml: `
      <p style="font-size: 17px; font-weight: bold; color: #0f172a; margin-top: 0;">
        أهلاً بك، أستاذ/ة ${user.name} 👋
      </p>
      <p>
        شكراً لانضمامك إلى منصة مساعد البحث الأكاديمي. لتفعيل حسابك والبدء في إنشاء أبحاثك الجامعية وفق المعايير القياسية بدقة A4، يرجى النقر على زر التفعيل أدناه:
      </p>
    `,
    actionUrl: verificationUrl,
    actionText: 'تفعيل حسابي الآن'
  });

  const mailOptions = {
    from: config.smtp.from,
    to: user.email,
    subject: 'تفعيل حسابك - مساعد البحث الأكاديمي',
    html
  };

  const mailTransporter = getTransporter();
  if (mailTransporter) {
    try {
      await mailTransporter.sendMail(mailOptions);
    } catch (err) {
      if (config.nodeEnv === 'development' || config.nodeEnv === 'test') {
        console.warn('[EmailService] SMTP delivery warning:', err.message);
      }
    }
  }

  // Development/Test Console output: Only allowed when NODE_ENV is development or test
  if (config.nodeEnv === 'development' || config.nodeEnv === 'test') {
    console.log('\n======================================================');
    console.log(' [DEV EMAIL] Email Verification Generated');
    console.log(` To: ${user.email}`);
    console.log(` URL: ${verificationUrl}`);
    console.log(` Token: ${token}`);
    console.log('======================================================\n');
  }

  return { success: true, verificationUrl };
};

/**
 * Send Password Reset link
 */
const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const html = renderEmailTemplate({
    title: 'إعادة تعيين كلمة المرور',
    bodyHtml: `
      <p style="font-size: 17px; font-weight: bold; color: #0f172a; margin-top: 0;">
        مرحباً ${user.name}،
      </p>
      <p>
        لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. يمكنك تعيين كلمة مرور جديدة من خلال النقر على الزر التالي (الرابط صالح لمدة ساعة واحدة فقط):
      </p>
    `,
    actionUrl: resetUrl,
    actionText: 'إعادة تعيين كلمة المرور'
  });

  const mailOptions = {
    from: config.smtp.from,
    to: user.email,
    subject: 'إعادة تعيين كلمة المرور - مساعد البحث الأكاديمي',
    html
  };

  const mailTransporter = getTransporter();
  if (mailTransporter) {
    try {
      await mailTransporter.sendMail(mailOptions);
    } catch (err) {
      if (config.nodeEnv === 'development' || config.nodeEnv === 'test') {
        console.warn('[EmailService] SMTP delivery warning:', err.message);
      }
    }
  }

  // Development/Test Console output: Only allowed when NODE_ENV is development or test
  if (config.nodeEnv === 'development' || config.nodeEnv === 'test') {
    console.log('\n======================================================');
    console.log(' [DEV EMAIL] Password Reset Link Generated');
    console.log(` To: ${user.email}`);
    console.log(` URL: ${resetUrl}`);
    console.log(` Token: ${token}`);
    console.log('======================================================\n');
  }

  return { success: true, resetUrl };
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};
