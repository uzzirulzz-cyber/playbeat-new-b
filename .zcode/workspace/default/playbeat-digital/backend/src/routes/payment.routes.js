const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth');
const { adminProtect, permit } = require('../middleware/adminAuth');

const router = express.Router();

// Webhooks are mounted raw in app.js (signature verification needs raw body).
router.get('/mine', protect, paymentController.myPayments);
router.post('/stripe/session/:orderId', protect, paymentController.resumeStripeSession);

const adminRouter = express.Router();
adminRouter.use(adminProtect, permit('payments'));
adminRouter.get('/', paymentController.adminList);

module.exports = { public: router, admin: adminRouter };
