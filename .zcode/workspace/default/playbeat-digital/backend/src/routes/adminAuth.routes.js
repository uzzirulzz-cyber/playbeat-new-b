const express = require('express');
const adminAuthController = require('../controllers/adminAuth.controller');
const { adminProtect, permit } = require('../middleware/adminAuth');
const { authLimiter } = require('../middleware/rateLimit');
const validate = require('../middleware/validate');
const rules = require('../validators');

const router = express.Router();

router.post('/login', authLimiter, rules.login, validate, adminAuthController.login);
router.post('/logout', adminAuthController.logout);
router.get('/me', adminProtect, adminAuthController.me);
router.put('/change-password', adminProtect, rules.changePassword, validate, adminAuthController.changePassword);

// Admin user management — superadmin only.
router.get('/users', adminProtect, permit('settings'), adminAuthController.listAdmins);
router.post('/users', adminProtect, permit('settings'), rules.adminCreate, validate, adminAuthController.createAdmin);
router.put('/users/:id', adminProtect, permit('settings'), rules.adminUpdate, validate, adminAuthController.updateAdmin);

module.exports = router;
