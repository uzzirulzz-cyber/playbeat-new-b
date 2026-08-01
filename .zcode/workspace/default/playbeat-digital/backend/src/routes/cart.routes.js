const express = require('express');
const cartController = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const rules = require('../validators');

const router = express.Router();

router.use(protect);
router.get('/', cartController.get);
router.post('/items', rules.cartAdd, validate, cartController.addItem);
router.put('/items/:itemId', rules.cartUpdate, validate, cartController.updateItem);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/', cartController.clear);
router.post('/apply-coupon', rules.coupon, validate, cartController.applyCoupon);
router.delete('/coupon', cartController.removeCoupon);
router.post('/merge', cartController.merge);

module.exports = router;
