const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Protect all admin routes: Authentication + Explicit Admin Role Check
router.use(authenticate, requireAdmin);

// 1. Dashboard Statistics
router.get('/stats', adminController.getStats);

// 2. Users Management
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUserDetails);
router.get('/users/:id/researches', adminController.getUserResearches);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/status', adminController.updateUserStatus);

// 3. Research Management
router.get('/researches', adminController.listAllResearches);
router.get('/researches/:id', adminController.getResearchDetails);

// 4. Activity & Audit Logs
router.get('/activity', adminController.listActivityLogs);
router.get('/logs', adminController.listLogs); // Legacy AI logs alias

// 5. System Settings
router.get('/settings', adminController.getSystemSettings);
router.patch('/settings', adminController.updateSystemSettings);

// Existing AI, Border & Template endpoints
router.get('/ai-settings', adminController.getAISettings);
router.patch('/ai-settings', adminController.updateAISettings);
router.post('/ai-settings/test', adminController.testAIConnection);

router.get('/borders', adminController.listBorders);
router.post('/borders', adminController.createBorder);
router.patch('/borders/:id/toggle', adminController.toggleBorder);

router.get('/templates', adminController.listTemplates);
router.patch('/templates/:id/activate', adminController.activateTemplate);

module.exports = router;
