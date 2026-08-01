const express = require('express');
const homepageController = require('../controllers/homepage.controller');
const { adminProtect, permit } = require('../middleware/adminAuth');
const validate = require('../middleware/validate');
const rules = require('../validators');

const router = express.Router();

// Public storefront homepage
router.get('/', homepageController.getHomepage);

// Admin Homepage Builder (mounted under /api/admin/homepage)
const adminRouter = express.Router();
adminRouter.use(adminProtect, permit('homepage'));
adminRouter.get('/', homepageController.adminList);
adminRouter.post('/', rules.homepageSection, validate, homepageController.create);
adminRouter.put('/reorder', rules.reorder, validate, homepageController.reorder);
adminRouter.put('/:id', homepageController.update);
adminRouter.delete('/:id', homepageController.remove);

module.exports = { public: router, admin: adminRouter };
