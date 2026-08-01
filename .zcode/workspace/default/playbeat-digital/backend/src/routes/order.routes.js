const express = require('express');
const orderController = require('../controllers/order.controller');
const { protect } = require('../middleware/auth');
const { adminProtect, permit } = require('../middleware/adminAuth');
const validate = require('../middleware/validate');
const rules = require('../validators');

const router = express.Router();

// Customer
router.post('/', protect, rules.orderCreate, validate, orderController.create);
router.get('/mine', protect, orderController.myOrders);
router.get('/mine/:id', protect, orderController.myOrder);

// Admin (mounted under /api/admin/orders)
const adminRouter = express.Router();
adminRouter.use(adminProtect, permit('orders'));
adminRouter.get('/', orderController.adminList);
adminRouter.get('/:id', orderController.adminGet);
adminRouter.put('/:id/status', rules.orderStatus, validate, orderController.updateStatus);
adminRouter.post('/:id/notes', rules.note, validate, orderController.addNote);
adminRouter.post('/:id/resend-delivery', orderController.resendDelivery);
adminRouter.post('/:id/refund', orderController.refund);
adminRouter.post('/:id/items/:itemId/delivered', orderController.markItemDelivered);

module.exports = { public: router, admin: adminRouter };
