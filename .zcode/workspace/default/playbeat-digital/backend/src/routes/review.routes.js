const express = require('express');
const reviewController = require('../controllers/review.controller');
const { adminProtect, permit } = require('../middleware/adminAuth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(adminProtect, permit('reviews'));
router.get('/', reviewController.adminList);
router.put('/:id/status', validate, reviewController.adminSetStatus);

module.exports = router;
