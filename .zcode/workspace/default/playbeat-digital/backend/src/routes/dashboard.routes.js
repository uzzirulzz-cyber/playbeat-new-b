const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { adminProtect, permit } = require('../middleware/adminAuth');

const router = express.Router();

router.use(adminProtect);
router.get('/dashboard', permit('dashboard'), dashboardController.stats);
router.get('/analytics', permit('analytics'), dashboardController.analytics);

module.exports = router;
