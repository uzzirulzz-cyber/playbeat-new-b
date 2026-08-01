const express = require('express');
const couponController = require('../controllers/coupon.controller');
const { adminProtect, permit } = require('../middleware/adminAuth');
const validate = require('../middleware/validate');
const rules = require('../validators');

const router = express.Router();

router.use(adminProtect, permit('coupons'));
router.get('/', couponController.list);
router.post('/', rules.couponAdmin, validate, couponController.create);
router.put('/:id', rules.couponAdmin, validate, couponController.update);
router.delete('/:id', couponController.remove);

module.exports = router;
