const express = require('express');
const inventoryController = require('../controllers/inventory.controller');
const { adminProtect, permit } = require('../middleware/adminAuth');
const validate = require('../middleware/validate');
const rules = require('../validators');

const router = express.Router();

router.use(adminProtect, permit('inventory'));
router.get('/export', inventoryController.exportCsv);
router.get('/', inventoryController.list);
router.get('/:id/reveal', inventoryController.reveal);
router.post('/', rules.inventoryItem, validate, inventoryController.create);
router.post('/bulk', rules.inventoryBulk, validate, inventoryController.bulk);
router.put('/:id', rules.inventoryUpdate, validate, inventoryController.update);
router.delete('/:id', inventoryController.remove);

module.exports = router;
