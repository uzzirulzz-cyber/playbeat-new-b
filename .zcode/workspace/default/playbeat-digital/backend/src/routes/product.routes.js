const express = require('express');
const productController = require('../controllers/product.controller');
const reviewController = require('../controllers/review.controller');
const { protect } = require('../middleware/auth');
const { adminProtect, permit } = require('../middleware/adminAuth');
const validate = require('../middleware/validate');
const rules = require('../validators');

const router = express.Router();

// Public
router.get('/', productController.list);
router.get('/:slug', productController.getBySlug);
router.get('/:slug/reviews', reviewController.listForProduct);
router.post('/:slug/reviews', protect, rules.review, validate, reviewController.create);

// Admin (mounted under /api/admin/products in routes/index.js)
const adminRouter = express.Router();
adminRouter.use(adminProtect, permit('products'));
adminRouter.get('/', productController.adminList);
adminRouter.get('/:id', productController.adminGet);
adminRouter.post('/', rules.product, validate, productController.create);
adminRouter.put('/:id', productController.update);
adminRouter.delete('/:id', productController.remove);

module.exports = { public: router, admin: adminRouter };
