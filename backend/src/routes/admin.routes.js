const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const cmsController = require('../controllers/cmsController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { upload } = require('../services/media/mediaService');

// Protect all admin routes: Authentication + Explicit Admin Role Check
router.use(authenticate, requireAdmin);

// 1. Dashboard Statistics
router.get('/dashboard', adminController.getStats);
router.get('/stats', adminController.getStats);

// 2. CMS Content Management
router.get('/content/:slug', cmsController.getAdminContent);
router.put('/content/:slug', cmsController.updateAdminContent);
router.post('/content/:slug/publish', cmsController.publishContent);
router.post('/content/:slug/unpublish', cmsController.unpublishContent);

// 3. Media Library
router.get('/media', cmsController.listMedia);
router.post('/media', upload.single('file'), cmsController.uploadMedia);
router.delete('/media/:id', cmsController.deleteMedia);

// 4. Users Management
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUserDetails);
router.get('/users/:id/researches', adminController.getUserResearches);
router.patch('/users/:id', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/status', adminController.updateUserStatus);

// 5. Research Management
router.get('/researches', adminController.listAllResearches);
router.get('/researches/:id', adminController.getResearchDetails);
router.patch('/researches/:id', adminController.updateResearchStatus);

// 6. Activity & Audit Logs
router.get('/activity', adminController.listActivityLogs);
router.get('/logs', adminController.listLogs); // Legacy AI logs alias

// 7. Site Settings & SEO
router.get('/settings', cmsController.getAdminSettings);
router.put('/settings', cmsController.updateAdminSettings);
router.patch('/settings', cmsController.updateAdminSettings);
router.post('/settings/maintenance', cmsController.toggleMaintenanceMode);

router.get('/seo', cmsController.getAdminSEO);
router.put('/seo', cmsController.updateAdminSEO);

// 8. AI, Border & Template endpoints (Preserved)
router.get('/ai-settings', adminController.getAISettings);
router.patch('/ai-settings', adminController.updateAISettings);
router.post('/ai-settings/test', adminController.testAIConnection);

router.get('/borders', adminController.listBorders);
router.post('/borders', adminController.createBorder);
router.patch('/borders/:id/toggle', adminController.toggleBorder);

router.get('/templates', adminController.listTemplates);
router.patch('/templates/:id/activate', adminController.activateTemplate);

module.exports = router;

