/**
 * AI Academic Research Assistant - Super Admin Creation Script
 * Usage:
 *   npm run create-super-admin -- user@example.com
 *   or: node scripts/createSuperAdmin.js user@example.com
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const ActivityLog = require('../src/models/ActivityLog');

const emailArg = process.argv[2] ? process.argv[2].trim().toLowerCase() : null;

if (!emailArg) {
  console.error('\n❌ خطأ: يرجى تحديد البريد الإلكتروني للمسؤول.');
  console.error('الاستخدام: npm run create-super-admin -- admin@example.com\n');
  process.exit(1);
}

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-research-assistant';

(async () => {
  try {
    console.log('Connecting to MongoDB at:', mongoUri.replace(/\/\/.*@/, '//<credentials>@'));
    await mongoose.connect(mongoUri);

    let user = await User.findOne({ email: emailArg });

    if (user) {
      const prevRole = user.role;
      user.role = 'super_admin';
      user.status = 'active';
      user.emailVerified = true;
      await user.save();

      console.log(`\n✅ تم ترقية المستخدم بنجاح إلى Super Admin!`);
      console.log(`- الاسم: ${user.name}`);
      console.log(`- البريد الإلكتروني: ${user.email}`);
      console.log(`- الدور السابق: ${prevRole}`);
      console.log(`- الدور الحالي: ${user.role}`);
      console.log(`- الحالة: ${user.status}\n`);

      await ActivityLog.record({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'role_changed',
        details: `CLI: تم ترقية المستخدم (${user.email}) إلى Super Admin بنجاح.`
      });
    } else {
      user = await User.create({
        name: 'مدير النظام الرئيسي',
        email: emailArg,
        role: 'super_admin',
        status: 'active',
        emailVerified: true
      });

      console.log(`\n✅ تم إنشاء حساب Super Admin جديد مسبقاً!`);
      console.log(`- الاسم: ${user.name}`);
      console.log(`- البريد الإلكتروني: ${user.email}`);
      console.log(`- الدور: ${user.role}`);
      console.log(`- معرف MongoDB: ${user._id}`);
      console.log(`\n💡 بمجرد تسجيل الدخول عبر Clerk باستخدام هذا البريد، سيتم ربط الحساب تلقائياً ومنحه كامل صلاحيات الإدارة.\n`);

      await ActivityLog.record({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'role_changed',
        details: `CLI: تم إنشاء حساب Super Admin جديد للمستخدم (${user.email}).`
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ فشلت العملية:', err.message);
    process.exit(1);
  }
})();
