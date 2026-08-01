const express = require('express');
const categoryController = require('../controllers/category.controller');
const { adminProtect, permit } = require('../middleware/adminAuth');
const validate = require('../middleware/validate');
const rules = require('../validators');

const router = express.Router();

router.get('/', categoryController.list);

const adminRouter = express.Router();
adminRouter.use(adminProtect, permit('categories'));
adminRouter.get('/', categoryController.adminList);
adminRouter.post('/', rules.category, validate, categoryController.create);
adminRouter.put('/:id', categoryController.update);
adminRouter.delete('/:id', categoryController.remove);

module.exports = { public: router, admin: adminRouter };
