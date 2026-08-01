const express = require('express');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const validate = require('../middleware/validate');
const rules = require('../validators');

const router = express.Router();

router.post('/register', authLimiter, rules.register, validate, authController.register);
router.post('/login', authLimiter, rules.login, validate, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authLimiter, rules.forgotPassword, validate, authController.forgotPassword);
router.post('/reset-password/:token', authLimiter, rules.resetPassword, validate, authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

router.get('/me', protect, authController.me);
router.put('/me', protect, authController.updateProfile);
router.put('/change-password', protect, rules.changePassword, validate, authController.changePassword);
router.get('/wishlist', protect, authController.wishlist);
router.post('/wishlist/:productId', protect, authController.toggleWishlist);

module.exports = router;
