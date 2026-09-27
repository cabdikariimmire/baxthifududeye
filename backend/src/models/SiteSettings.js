const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    websiteName: {
      type: String,
      default: 'مساعد البحث الأكاديمي',
      trim: true
    },
    websiteSubtitle: {
      type: String,
      default: 'من الفكرة إلى البحث المتكامل',
      trim: true
    },
    logo: {
      type: String,
      default: ''
    },
    favicon: {
      type: String,
      default: ''
    },
    defaultLanguage: {
      type: String,
      default: 'ar'
    },
    timezone: {
      type: String,
      default: 'Asia/Riyadh'
    },
    brand: {
      primaryColor: { type: String, default: '#0F8F83' },
      secondaryColor: { type: String, default: '#0F2747' },
      accentColor: { type: String, default: '#14b8a6' }
    },
    contact: {
      email: { type: String, default: 'info@baxthi.com' },
      phone: { type: String, default: '+966 50 000 0000' },
      address: { type: String, default: 'المملكة العربية السعودية' },
      socialLinks: {
        twitter: { type: String, default: 'https://twitter.com' },
        linkedin: { type: String, default: 'https://linkedin.com' },
        github: { type: String, default: 'https://github.com' },
        facebook: { type: String, default: '' },
        youtube: { type: String, default: '' }
      }
    },
    system: {
      maintenanceMode: { type: Boolean, default: false },
      registrationEnabled: { type: Boolean, default: true },
      publicWebsiteEnabled: { type: Boolean, default: true },
      maintenanceTitle: { type: String, default: 'الموقع قيد الصيانة حالياً' },
      maintenanceMessage: { type: String, default: 'نعمل حالياً على إجراء بعض التحسينات والإصلاحات لنقدم لكم تجربة بحث أكاديمي أفضل. يرجى الانتظار حتى انتهاء أعمال الصيانة.' },
      maintenanceLastUpdatedByName: { type: String, default: '' },
      maintenanceLastUpdatedAt: { type: Date, default: null }
    }
  },
  {
    timestamps: true
  }
);

siteSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
