const express = require('express');
const customerController = require('../controllers/customer.controller');
const { adminProtect, permit } = require('../middleware/adminAuth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(adminProtect, permit('customers'));
router.get('/', customerController.list);
router.get('/:id', customerController.getById);
router.put('/:id/status', validate, customerController.updateStatus);

module.exports = router;
