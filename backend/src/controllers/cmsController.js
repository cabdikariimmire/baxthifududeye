const CMSContent = require('../models/CMSContent');
const SiteSettings = require('../models/SiteSettings');
const Media = require('../models/Media');
const ActivityLog = require('../models/ActivityLog');
const defaultCMS = require('../services/cms/defaultCMS');
const { deleteFileFromDisk } = require('../services/media/mediaService');
const path = require('path');

// Seed default CMS content if missing
const seedDefaultCMSIfEmpty = async () => {
  try {
    const slugs = Object.keys(defaultCMS);
    for (const slug of slugs) {
      const existing = await CMSContent.findOne({ slug });
      if (!existing) {
        await CMSContent.create({
          slug,
          title: defaultCMS[slug].title || slug,
          content: defaultCMS[slug],
          status: 'published',
          publishedAt: new Date()
        });
      }
    }

    const settingsCount = await SiteSettings.countDocuments();
    if (settingsCount === 0) {
      await SiteSettings.create({});
    }
  } catch (err) {
    console.warn('[CMSController] Seed CMS defaults warning:', err.message);
  }
};

/**
 * GET /api/admin/content/:slug
 * Retrieve page content for admin editor (includes draftContent if available)
 */
const getAdminContent = async (req, res, next) => {
  try {
    const { slug } = req.params;
    let record = await CMSContent.findOne({ slug });

    if (!record) {
      // Create from defaults if not found
      const initialContent = defaultCMS[slug] || {};
      record = await CMSContent.create({
        slug,
        title: initialContent.title || slug,
        content: initialContent,
        draftContent: null,
        status: 'published',
        publishedAt: new Date()
      });
    }

    return res.json({
      success: true,
      data: {
        slug: record.slug,
        title: record.title,
        content: record.draftContent || record.content || defaultCMS[slug] || {},
        publishedContent: record.content || defaultCMS[slug] || {},
        hasDraft: Boolean(record.draftContent),
        status: record.status,
        publishedAt: record.publishedAt,
        updatedAt: record.updatedAt
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/content/:slug
 * Save draft or publish directly
 */
const updateAdminContent = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { content, title, publishNow = false } = req.body;

    if (!content || typeof content !== 'object') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'محتوى الصفحة غير صالح'
      });
    }

    let record = await CMSContent.findOne({ slug });
    if (!record) {
      record = new CMSContent({ slug });
    }

    if (title) record.title = title;
    record.lastEditedBy = req.user._id;

    if (publishNow) {
      record.content = content;
      record.draftContent = null;
      record.status = 'published';
      record.publishedAt = new Date();
      record.publishedBy = req.user._id;
    } else {
      record.draftContent = content;
      // If never published, keep status as draft, else keep current published status while holding draft
      if (!record.content || Object.keys(record.content).length === 0) {
        record.status = 'draft';
      }
    }

    await record.save();

    await ActivityLog.record({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: publishNow ? 'content_published' : 'content_updated',
      targetId: slug,
      details: publishNow
        ? `تم نشر محتوى الصفحة (${slug}) بنجاح`
        : `تم حفظ مسودة محتوى الصفحة (${slug})`
    });

    return res.json({
      success: true,
      message: publishNow ? 'تم نشر المحتوى بنجاح' : 'تم حفظ المسودة بنجاح',
      data: {
        slug: record.slug,
        status: record.status,
        hasDraft: Boolean(record.draftContent),
        publishedAt: record.publishedAt
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/content/:slug/publish
 * Publish draft content
 */
const publishContent = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const record = await CMSContent.findOne({ slug });

    if (!record) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'الصفحة غير موجودة'
      });
    }

    if (record.draftContent) {
      record.content = record.draftContent;
      record.draftContent = null;
    }
    record.status = 'published';
    record.publishedAt = new Date();
    record.publishedBy = req.user._id;
    await record.save();

    await ActivityLog.record({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'content_published',
      targetId: slug,
      details: `تم نشر المحتوى الجديد للصفحة (${slug})`
    });

    return res.json({
      success: true,
      message: 'تم نشر محتوى الصفحة بنجاح',
      data: {
        slug: record.slug,
        status: record.status,
        publishedAt: record.publishedAt
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/content/:slug/unpublish
 * Unpublish content (revert to draft)
 */
const unpublishContent = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const record = await CMSContent.findOne({ slug });

    if (!record) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'الصفحة غير موجودة'
      });
    }

    record.status = 'draft';
    await record.save();

    await ActivityLog.record({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'content_unpublished',
      targetId: slug,
      details: `تم إلغاء نشر الصفحة (${slug}) وتحويلها إلى مسودة`
    });

    return res.json({
      success: true,
      message: 'تم تحويل الصفحة إلى مسودة',
      data: { slug: record.slug, status: record.status }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/public/cms/:slug
 * Public endpoint that returns ONLY published content with robust fallbacks
 */
const getPublicContent = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const fallback = defaultCMS[slug] || {};

    const record = await CMSContent.findOne({ slug, status: 'published' });
    if (!record || !record.content) {
      return res.json({
        success: true,
        data: {
          slug,
          content: fallback,
          isDefaultFallback: true
        }
      });
    }

    return res.json({
      success: true,
      data: {
        slug,
        content: record.content,
        publishedAt: record.publishedAt
      }
    });
  } catch (err) {
    // Fail gracefully with fallback
    const { slug } = req.params;
    return res.json({
      success: true,
      data: {
        slug,
        content: defaultCMS[slug] || {},
        isDefaultFallback: true
      }
    });
  }
};

/**
 * GET /api/public/settings
 * Public endpoint for site settings & branding
 */
const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.getSettings();
    return res.json({
      success: true,
      data: {
        websiteName: settings.websiteName,
        websiteSubtitle: settings.websiteSubtitle,
        logo: settings.logo,
        favicon: settings.favicon,
        brand: settings.brand,
        contact: settings.contact,
        system: {
          maintenanceMode: settings.system?.maintenanceMode || false,
          registrationEnabled: settings.system?.registrationEnabled ?? true,
          maintenanceTitle: settings.system?.maintenanceTitle || 'الموقع قيد الصيانة حالياً',
          maintenanceMessage: settings.system?.maintenanceMessage || 'نعمل حالياً على إجراء بعض التحسينات والإصلاحات لنقدم لكم تجربة بحث أكاديمي أفضل. يرجى الانتظار حتى انتهاء أعمال الصيانة.'
        }
      }
    });
  } catch (err) {
    return res.json({
      success: true,
      data: {
        websiteName: 'مساعد البحث الأكاديمي',
        websiteSubtitle: 'من الفكرة إلى البحث المتكامل',
        brand: { primaryColor: '#0F8F83', secondaryColor: '#0F2747', accentColor: '#14b8a6' },
        system: {
          maintenanceMode: false,
          registrationEnabled: true,
          maintenanceTitle: 'الموقع قيد الصيانة حالياً',
          maintenanceMessage: 'نعمل حالياً على إجراء بعض التحسينات والإصلاحات لنقدم لكم تجربة بحث أكاديمي أفضل. يرجى الانتظار حتى انتهاء أعمال الصيانة.'
        }
      }
    });
  }
};

/**
 * GET /api/admin/settings & PUT /api/admin/settings
 */
const getAdminSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.getSettings();
    return res.json({
      success: true,
      data: { settings }
    });
  } catch (err) {
    next(err);
  }
};

const updateAdminSettings = async (req, res, next) => {
  try {
    const updates = req.body;
    let settings = await SiteSettings.findOne();
    if (!settings) settings = new SiteSettings();

    if (updates.websiteName) settings.websiteName = updates.websiteName.trim();
    if (updates.websiteSubtitle) settings.websiteSubtitle = updates.websiteSubtitle.trim();
    if (updates.logo !== undefined) settings.logo = updates.logo;
    if (updates.favicon !== undefined) settings.favicon = updates.favicon;
    if (updates.defaultLanguage) settings.defaultLanguage = updates.defaultLanguage;
    if (updates.timezone) settings.timezone = updates.timezone;

    if (updates.brand) {
      settings.brand = {
        ...settings.brand,
        ...updates.brand
      };
    }

    if (updates.contact) {
      settings.contact = {
        ...settings.contact,
        ...updates.contact
      };
    }

    if (updates.system) {
      const prevMaintenance = settings.system?.maintenanceMode;
      settings.system = {
        ...settings.system,
        ...updates.system
      };
      if (updates.system.maintenanceMode !== undefined && updates.system.maintenanceMode !== prevMaintenance) {
        settings.system.maintenanceLastUpdatedByName = req.user.name || 'مدير النظام';
        settings.system.maintenanceLastUpdatedAt = new Date();
      }
    }

    await settings.save();

    await ActivityLog.record({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'settings_updated',
      details: 'تم تحديث إعدادات الموقع والهوية البصرية'
    });

    return res.json({
      success: true,
      message: 'تم حفظ إعدادات الموقع بنجاح',
      data: { settings }
    });
  } catch (err) {
    next(err);
  }
};

const toggleMaintenanceMode = async (req, res, next) => {
  try {
    const { enabled, title, message } = req.body;
    let settings = await SiteSettings.getSettings();
    const previousState = settings.system?.maintenanceMode || false;
    const newState = enabled !== undefined ? Boolean(enabled) : !previousState;

    settings.system.maintenanceMode = newState;
    if (title) settings.system.maintenanceTitle = title.trim();
    if (message) settings.system.maintenanceMessage = message.trim();
    settings.system.maintenanceLastUpdatedByName = req.user.name || 'مدير النظام';
    settings.system.maintenanceLastUpdatedAt = new Date();

    await settings.save();

    await ActivityLog.record({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'maintenance_mode_toggled',
      details: newState ? 'تم تفعيل وضع الصيانة للموقع العام' : 'تم تعطيل وضع الصيانة واستعادة العمل الطبيعي للموقع'
    });

    return res.json({
      success: true,
      message: newState ? 'تم تفعيل وضع الصيانة بنجاح' : 'تم تعطيل وضع الصيانة بنجاح',
      data: {
        maintenanceMode: newState,
        settings
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/seo & PUT /api/admin/seo
 */
const getAdminSEO = async (req, res, next) => {
  try {
    let seoRecord = await CMSContent.findOne({ slug: 'seo' });
    if (!seoRecord) {
      seoRecord = await CMSContent.create({
        slug: 'seo',
        title: 'SEO Settings',
        content: defaultCMS.seo,
        status: 'published'
      });
    }

    return res.json({
      success: true,
      data: {
        seo: seoRecord.content || defaultCMS.seo
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateAdminSEO = async (req, res, next) => {
  try {
    const { seo } = req.body;
    if (!seo || typeof seo !== 'object') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'بيانات SEO غير صالحة'
      });
    }

    let seoRecord = await CMSContent.findOne({ slug: 'seo' });
    if (!seoRecord) {
      seoRecord = new CMSContent({ slug: 'seo', title: 'SEO Settings' });
    }

    seoRecord.content = seo;
    seoRecord.status = 'published';
    seoRecord.publishedAt = new Date();
    seoRecord.lastEditedBy = req.user._id;
    await seoRecord.save();

    await ActivityLog.record({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'seo_updated',
      details: 'تم تحديث إعدادات تحسين محركات البحث (SEO)'
    });

    return res.json({
      success: true,
      message: 'تم تحديث إعدادات SEO بنجاح',
      data: { seo: seoRecord.content }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Media Library APIs:
 * GET /api/admin/media
 * POST /api/admin/media (file upload)
 * DELETE /api/admin/media/:id
 */
const listMedia = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const type = req.query.type; // image, video, document
    const search = (req.query.q || '').trim();

    const query = {};
    if (type && ['image', 'video', 'document'].includes(type)) {
      query.type = type;
    }
    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }

    const total = await Media.countDocuments(query);
    const media = await Media.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: {
        media,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    next(err);
  }
};

const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        code: 'FILE_REQUIRED',
        message: 'يرجى اختيار ملف لرفعه'
      });
    }

    const mime = (req.file.mimetype || '').toLowerCase();
    let type = 'document';
    if (mime.startsWith('image/')) type = 'image';
    else if (mime.startsWith('video/')) type = 'video';

    const mediaUrl = `/uploads/${req.file.filename}`;

    const mediaDoc = await Media.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: mediaUrl,
      path: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      type,
      uploadedBy: req.user ? req.user._id : null
    });

    if (req.user) {
      await ActivityLog.record({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        action: 'media_uploaded',
        targetId: String(mediaDoc._id),
        details: `تم رفع ملف وسائط جديد: ${mediaDoc.originalName} (${type})`
      });
    }

    return res.status(201).json({
      success: true,
      message: 'تم رفع الملف بنجاح',
      data: { media: mediaDoc }
    });
  } catch (err) {
    next(err);
  }
};

const deleteMedia = async (req, res, next) => {
  try {
    const mediaDoc = await Media.findById(req.params.id);
    if (!mediaDoc) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'الملف غير موجود'
      });
    }

    // Delete file from disk safely
    deleteFileFromDisk(mediaDoc.filename);

    await Media.findByIdAndDelete(req.params.id);

    await ActivityLog.record({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'media_deleted',
      targetId: String(mediaDoc._id),
      details: `تم حذف ملف الوسائط: ${mediaDoc.originalName}`
    });

    return res.json({
      success: true,
      message: 'تم حذف ملف الوسائط بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  seedDefaultCMSIfEmpty,
  getAdminContent,
  updateAdminContent,
  publishContent,
  unpublishContent,
  getPublicContent,
  getPublicSettings,
  getAdminSettings,
  updateAdminSettings,
  toggleMaintenanceMode,
  getAdminSEO,
  updateAdminSEO,
  listMedia,
  uploadMedia,
  deleteMedia
};
