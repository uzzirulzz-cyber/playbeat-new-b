const express = require('express');
const settingsController = require('../controllers/settings.controller');
const { adminProtect, permit } = require('../middleware/adminAuth');

const router = express.Router();

// Public storefront settings
router.get('/', settingsController.publicGet);

// Admin settings (mounted under /api/admin/settings)
const adminRouter = express.Router();
adminRouter.use(adminProtect, permit('settings'));
adminRouter.get('/', settingsController.adminGet);
adminRouter.put('/', settingsController.adminUpdate);

module.exports = { public: router, admin: adminRouter };
