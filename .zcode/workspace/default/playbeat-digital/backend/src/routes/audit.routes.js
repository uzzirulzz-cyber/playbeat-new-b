const express = require('express');
const auditController = require('../controllers/audit.controller');
const { adminProtect, permit } = require('../middleware/adminAuth');

const router = express.Router();

router.use(adminProtect, permit('audit'));
router.get('/', auditController.list);

module.exports = router;
