const User = require('../models/User');
const Research = require('../models/Research');
const Template = require('../models/Template');
const Border = require('../models/Border');
const AISettings = require('../models/AISettings');
const AILog = require('../models/AILog');
const ActivityLog = require('../models/ActivityLog');
const defaultBorders = require('../services/document/defaultBorders');
const AIService = require('../services/ai/aiService');
const config = require('../config/env');
const mongoose = require('mongoose');
const { isDesignatedSuperAdmin } = require('../middleware/auth');


// Seed default borders & settings if empty
const seedDefaultsIfEmpty = async () => {
  try {
    const borderCount = await Border.countDocuments();
    if (borderCount === 0) {
      await Border.insertMany(defaultBorders);
      console.log('[Admin] Default borders initialized in database.');
    }

    const aiSettingsCount = await AISettings.countDocuments();
    if (aiSettingsCount === 0) {
      await AISettings.create({
        provider: 'openrouter',
        model: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
        temperature: 0.1,
        systemInstructions: 'أنت خبير أكاديمي متخصص في هيكلة وتنظيم البحوث العلمية والجامعية باللغة العربية بدقة متناهية.'
      });
      console.log('[Admin] Default AI settings initialized.');
    }

    const templateCount = await Template.countDocuments();
    if (templateCount === 0) {
      await Template.create({
        templateId: 'template-default-a4',
        name: 'Standard Arabic Academic A4',
        nameAr: 'القالب الأكاديمي القياسي A4 (وفق النموذج المرجعي)',
        active: true,
        isDefault: true,
        version: 1
      });
      console.log('[Admin] Default template initialized.');
    }
  } catch (err) {
    console.warn('[Admin] Seed defaults warning:', err.message);
  }
};

// 1. Dashboard Statistics
const getStats = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      userCount,
      researchCount,
      completedResearchCount,
      activeUserCount,
      suspendedUserCount,
      pdfExportsCount
    ] = await Promise.all([
      User.countDocuments(),
      Research.countDocuments(),
      Research.countDocuments({ status: { $in: ['ready', 'exported'] } }),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      ActivityLog.countDocuments({ action: 'pdf_exported' })
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role status createdAt');

    const recentResearches = await Research.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status currentStep userId createdAt updatedAt cover.university cover.studentName');

    const recentActivity = await ActivityLog.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(6);

    return res.json({
      success: true,
      data: {
        stats: {
          userCount,
          researchCount,
          completedResearchCount,
          activeUserCount,
          inactiveUserCount: suspendedUserCount,
          exportsCount: pdfExportsCount,
          pdfExportsCount
        },
        recentUsers,
        recentResearches,
        recentActivity
      }
    });
  } catch (err) {
    next(err);
  }
};

// 2. Users Management
const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const search = (req.query.q || '').trim();
    const roleFilter = req.query.role;
    const statusFilter = req.query.status;

    const matchQuery = {};
    if (search) {
      matchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (roleFilter && ['user', 'admin', 'super_admin', 'editor'].includes(roleFilter)) {
      matchQuery.role = roleFilter;
    }
    if (statusFilter && ['active', 'suspended'].includes(statusFilter)) {
      matchQuery.status = statusFilter;
    }

    const totalUsers = await User.countDocuments(matchQuery);

    const users = await User.aggregate([
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'researches',
          localField: '_id',
          foreignField: 'userId',
          as: 'userResearches'
        }
      },
      {
        $project: {
          passwordHash: 0,
          __v: 0
        }
      },
      {
        $addFields: {
          researchCount: { $size: '$userResearches' }
        }
      },
      {
        $project: {
          userResearches: 0
        }
      }
    ]);

    return res.json({
      success: true,
      data: {
        users,
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit) || 1
      }
    });
  } catch (err) {
    next(err);
  }
};

const getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -__v');
    if (!user) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'المستخدم غير موجود' });
    }

    const researchCount = await Research.countDocuments({ userId: user._id });

    return res.json({
      success: true,
      data: {
        user,
        researchCount
      }
    });
  } catch (err) {
    next(err);
  }
};

const getUserResearches = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));

    const filter = { userId: req.params.id };
    const total = await Research.countDocuments(filter);
    const researches = await Research.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('title status currentStep borderId cover createdAt updatedAt');

    return res.json({
      success: true,
      data: {
        researches,
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

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || !['user', 'admin', 'super_admin', 'editor'].includes(role)) {
      return res.status(400).json({ success: false, code: 'INVALID_ROLE', message: 'يرجى تحديد دور صالح (user أو editor أو admin أو super_admin)' });
    }

    // Authorization rule: Only admins and super_admins can change roles
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'غير مصرح لك بتعديل أدوار المستخدمين.'
      });
    }

    // Higher authority rule: Only Super Admin can promote someone to super_admin or modify a super_admin
    if ((role === 'super_admin') && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'يتطلب ترقية مستخدم إلى مدير عام (Super Admin) صلاحيات مدير عام حصراً.'
      });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'المستخدم غير موجود' });
    }

    // Safety guard: The designated Super Admin account cannot be demoted
    if (isDesignatedSuperAdmin(targetUser.email) && role !== 'super_admin') {
      return res.status(400).json({
        success: false,
        code: 'CANNOT_DEMOTE_DESIGNATED_SUPER_ADMIN',
        message: 'لا يمكن خفض رتبة حساب المدير العام الرئيسي للنظام.'
      });
    }

    if (targetUser.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'لا يمكن لغير المدير العام تعديل رتبة مدير عام آخر.'
      });
    }

    // Safety guard: Protect the last super_admin from downgrade
    if (targetUser.role === 'super_admin' && role !== 'super_admin') {
      const superAdminCount = await User.countDocuments({ role: 'super_admin', status: 'active' });
      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          code: 'CANNOT_REMOVE_LAST_SUPER_ADMIN',
          message: 'لا يمكن خفض رتبة المدير العام (Super Admin) الأخير في النظام لمنع فقدان التحكم.'
        });
      }
    }

    // Safety guard: Prevent removing the last active administrator
    if ((targetUser.role === 'admin' || targetUser.role === 'super_admin') && role === 'user') {
      const activeAdminCount = await User.countDocuments({ role: { $in: ['admin', 'super_admin'] }, status: 'active' });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          code: 'CANNOT_REMOVE_LAST_ADMIN',
          message: 'لا يمكن سحب صلاحية المسؤول الأخير في النظام لمنع قفل النظام.'
        });
      }
    }

    // Safety guard: A user cannot modify their own role through a client request
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        code: 'CANNOT_MODIFY_OWN_ROLE',
        message: 'لا يمكن للمستخدم تعديل دوره الخاص.'
      });
    }

    const oldRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();


    // Record real activity log
    await ActivityLog.record({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'role_changed',
      targetId: String(targetUser._id),
      details: `تم تغيير دور المستخدم (${targetUser.email}) من "${oldRole}" إلى "${role}"`
    });

    return res.json({
      success: true,
      message: 'تم تحديث دور المستخدم بنجاح',
      data: {
        user: {
          _id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
          status: targetUser.status
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { status, role } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'المستخدم غير موجود' });
    }

    // Safety guard: Super Admin cannot deactivate themselves
    if (status === 'suspended' && req.user._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({
        success: false,
        code: 'CANNOT_DEACTIVATE_SELF',
        message: 'لا يمكنك تجميد أو إيقاف حسابك الإداري الخاص.'
      });
    }

    // Safety guard: Do not suspend the last active super_admin / admin
    if (status === 'suspended' && targetUser.role === 'super_admin') {
      const activeSuperAdminCount = await User.countDocuments({ role: 'super_admin', status: 'active' });
      if (activeSuperAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          code: 'CANNOT_SUSPEND_LAST_SUPER_ADMIN',
          message: 'لا يمكن إيقاف حساب المدير العام الأخير في النظام.'
        });
      }
    } else if (status === 'suspended' && targetUser.role === 'admin') {
      const activeAdminCount = await User.countDocuments({ role: { $in: ['admin', 'super_admin'] }, status: 'active' });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          code: 'CANNOT_SUSPEND_LAST_ADMIN',
          message: 'لا يمكن إيقاف حساب المسؤول الوحيد في النظام.'
        });
      }
    }

    if (status && ['active', 'suspended'].includes(status)) {
      targetUser.status = status;
    }
    if (role && ['user', 'admin', 'super_admin'].includes(role) && req.user.role === 'super_admin') {
      targetUser.role = role;
    }

    await targetUser.save();

    await ActivityLog.record({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'user_status_changed',
      targetId: String(targetUser._id),
      details: `تم تحديث حالة المستخدم (${targetUser.email}) إلى "${targetUser.status}"`
    });

    return res.json({
      success: true,
      message: 'تم تحديث حالة المستخدم بنجاح',
      data: {
        user: {
          _id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
          status: targetUser.status
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// 3. Researches Management
const listAllResearches = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const search = (req.query.q || '').trim();
    const statusFilter = req.query.status;
    const stepFilter = req.query.step;
    const userIdFilter = req.query.userId;

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'cover.title': { $regex: search, $options: 'i' } },
        { 'cover.studentName': { $regex: search, $options: 'i' } },
        { 'cover.university': { $regex: search, $options: 'i' } }
      ];
    }

    if (statusFilter && ['draft', 'structure_review', 'in_progress', 'ready', 'exported'].includes(statusFilter)) {
      query.status = statusFilter;
    }

    if (stepFilter && !isNaN(parseInt(stepFilter, 10))) {
      query.currentStep = parseInt(stepFilter, 10);
    }

    if (userIdFilter && mongoose.Types.ObjectId.isValid(userIdFilter)) {
      query.userId = userIdFilter;
    }

    const total = await Research.countDocuments(query);
    const researches = await Research.find(query)
      .populate('userId', 'name email role status')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('title status currentStep borderId templateId cover documentMetadata createdAt updatedAt userId');

    return res.json({
      success: true,
      data: {
        researches,
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

const getResearchDetails = async (req, res, next) => {
  try {
    const research = await Research.findById(req.params.id)
      .populate('userId', 'name email role status');

    if (!research) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'البحث غير موجود' });
    }

    return res.json({
      success: true,
      data: { research }
    });
  } catch (err) {
    next(err);
  }
};

const updateResearchStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const research = await Research.findById(req.params.id).populate('userId', 'name email');
    if (!research) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'البحث غير موجود' });
    }

    const oldStatus = research.status;
    if (status && ['draft', 'structure_review', 'in_progress', 'ready', 'exported', 'archived'].includes(status)) {
      research.status = status;
      await research.save();
    }

    await ActivityLog.record({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: status === 'archived' ? 'research_archived' : 'research_updated',
      targetId: String(research._id),
      details: `تم تعديل حالة البحث (${research.title}) من "${oldStatus}" إلى "${research.status}"`
    });

    return res.json({
      success: true,
      message: 'تم تحديث حالة البحث بنجاح',
      data: { research }
    });
  } catch (err) {
    next(err);
  }
};


// 4. Activity Logs
const listActivityLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '15', 10)));
    const action = req.query.action;
    const search = (req.query.q || '').trim();

    const query = {};
    if (action) query.action = action;
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: {
        logs,
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

// 5. System Settings
const getSystemSettings = async (req, res, next) => {
  try {
    let aiSettings = await AISettings.findOne({ active: true });
    if (!aiSettings) {
      aiSettings = await AISettings.create({
        provider: 'openrouter',
        model: 'nvidia/llama-3.1-nemotron-70b-instruct:free'
      });
    }

    // Never return customApiKey in plaintext
    const safeAiSettings = aiSettings.toObject ? aiSettings.toObject() : { ...aiSettings };
    safeAiSettings.customApiKey = safeAiSettings.customApiKey ? '••••••••••••••••' : '';
    safeAiSettings.hasCustomApiKey = Boolean(aiSettings.customApiKey);

    const [activeTemplate, bordersCount, totalUsers, totalResearches] = await Promise.all([
      Template.findOne({ active: true }),
      Border.countDocuments(),
      User.countDocuments(),
      Research.countDocuments()
    ]);

    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      environment: config.nodeEnv || 'development',
      databaseStatus: 'متصل (MongoDB)',
      totalUsers,
      totalResearches
    };

    return res.json({
      success: true,
      data: {
        aiSettings: safeAiSettings,
        activeTemplate,
        bordersCount,
        systemInfo
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateSystemSettings = async (req, res, next) => {
  try {
    const { provider, model, customApiKey, temperature, systemInstructions } = req.body;

    let settings = await AISettings.findOne({ active: true });
    if (!settings) {
      settings = new AISettings();
    }

    if (provider) settings.provider = provider;
    if (model) settings.model = model;
    // Only update API key if non-empty and not the masked placeholder
    if (customApiKey !== undefined && !customApiKey.includes('••••')) {
      settings.customApiKey = customApiKey.trim();
    }
    if (temperature !== undefined && !isNaN(Number(temperature))) {
      settings.temperature = Math.max(0, Math.min(1, Number(temperature)));
    }
    if (systemInstructions !== undefined) {
      settings.systemInstructions = systemInstructions;
    }

    await settings.save();

    await ActivityLog.record({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'settings_updated',
      details: `تم تحديث إعدادات النظام والذكاء الاصطناعي (الموديل: ${settings.model})`
    });

    const safeSettings = settings.toObject ? settings.toObject() : { ...settings };
    safeSettings.customApiKey = safeSettings.customApiKey ? '••••••••••••••••' : '';
    safeSettings.hasCustomApiKey = Boolean(settings.customApiKey);

    return res.json({
      success: true,
      message: 'تم حفظ إعدادات النظام بنجاح',
      data: { settings: safeSettings }
    });
  } catch (err) {
    next(err);
  }
};

// Legacy AI Settings endpoints (kept for backward compatibility)
const getAISettings = async (req, res, next) => {
  return getSystemSettings(req, res, next);
};

const updateAISettings = async (req, res, next) => {
  return updateSystemSettings(req, res, next);
};

const testAIConnection = async (req, res, next) => {
  try {
    const adapter = await AIService.getAdapter();
    const testResult = await adapter.analyzeIntroduction('المقدمة:\nالمطلب الأول: تمهيد وتعريف\nالمطلب الثاني: الأحكام');

    return res.json({
      success: true,
      message: 'الاتصال بنموذج الذكاء الاصطناعي يعمل بكفاءة عالية',
      data: {
        model: adapter.model,
        testResult
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      code: 'AI_CONNECTION_FAILED',
      message: `فشل اختبار الاتصال: ${err.message}`
    });
  }
};

// Borders Management
const listBorders = async (req, res, next) => {
  try {
    const borders = await Border.find().sort({ createdAt: 1 });
    return res.json({ success: true, data: { borders } });
  } catch (err) {
    next(err);
  }
};

const createBorder = async (req, res, next) => {
  try {
    const { borderId, name, nameAr, category, accentColor, svgPattern } = req.body;
    const border = await Border.create({
      borderId,
      name,
      nameAr,
      category,
      accentColor,
      svgPattern
    });
    return res.status(201).json({ success: true, message: 'تم إضافة الإطار بنجاح', data: { border } });
  } catch (err) {
    next(err);
  }
};

const toggleBorder = async (req, res, next) => {
  try {
    const border = await Border.findById(req.params.id);
    if (!border) return res.status(404).json({ success: false, message: 'الإطار غير موجود' });

    border.active = !border.active;
    await border.save();

    return res.json({ success: true, message: 'تم تحديث حالة الإطار', data: { border } });
  } catch (err) {
    next(err);
  }
};

// Templates Management
const listTemplates = async (req, res, next) => {
  try {
    const templates = await Template.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: { templates } });
  } catch (err) {
    next(err);
  }
};

const activateTemplate = async (req, res, next) => {
  try {
    await Template.updateMany({}, { active: false, isDefault: false });
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { active: true, isDefault: true },
      { new: true }
    );
    return res.json({ success: true, message: 'تم تفعيل القالب المرجعي بنجاح', data: { template } });
  } catch (err) {
    next(err);
  }
};

const listLogs = async (req, res, next) => {
  try {
    const logs = await AILog.find()
      .populate('userId', 'name email')
      .populate('researchId', 'title')
      .sort({ createdAt: -1 })
      .limit(100);

  } catch (err) {
    next(err);
  }
};

module.exports = {
  seedDefaultsIfEmpty,
  getStats,
  listUsers,
  getUserDetails,
  getUserResearches,
  updateUserRole,
  updateUserStatus,
  listAllResearches,
  getResearchDetails,
  updateResearchStatus,
  listActivityLogs,
  getSystemSettings,
  updateSystemSettings,
  getAISettings,
  updateAISettings,
  testAIConnection,
  listBorders,
  createBorder,
  toggleBorder,
  listTemplates,
  activateTemplate,
  listLogs
};
