const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const inventoryService = require('../services/inventory.service');
const { decrypt, encrypt } = require('../utils/crypto');
const { randomToken } = require('../utils/crypto');
const { logAudit } = require('../middleware/audit');

const inventoryController = {
  /** Admin list — payloads are NEVER included here. */
  list: catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.product) filter.product = req.query.product;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.batchId) filter.batchId = req.query.batchId;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);

    const [items, total, stats] = await Promise.all([
      Inventory.find(filter)
        .populate('product', 'name slug sku')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Inventory.countDocuments(filter),
      Inventory.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    res.json({
      success: true,
      data: items,
      stats: Object.fromEntries(stats.map((s) => [s._id, s.count])),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  }),

  /** Reveal a single payload (audited, admin-only). */
  reveal: catchAsync(async (req, res) => {
    const item = await Inventory.findById(req.params.id).select('+payloadEncrypted');
    if (!item) throw ApiError.notFound('Inventory item not found');
    await logAudit({ req, action: 'inventory.reveal', resource: 'inventory', resourceId: item._id });
    res.json({ success: true, data: { id: item._id, type: item.type, payload: decrypt(item.payloadEncrypted) } });
  }),

  create: catchAsync(async (req, res) => {
    const { productId, variantName = '', type, payload, label = '', expiresAt = null, note = '' } = req.body;
    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    const [item] = await inventoryService.addItems({
      productId, variantName, type, payloads: [payload], label, expiresAt, note,
    });

    // Keep catalog stock counters in sync with actual digital inventory.
    if (!product.unlimitedStock) {
      product.stockQuantity += 1;
      await product.save();
    }

    await logAudit({ req, action: 'inventory.create', resource: 'inventory', resourceId: item._id });
    res.status(201).json({ success: true, data: { id: item._id } });
  }),

  /** Bulk import: accepts an array of payload strings (one unit each). */
  bulk: catchAsync(async (req, res) => {
    const { productId, variantName = '', type, payloads, label = '', note = '' } = req.body;
    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');
    if (!Array.isArray(payloads) || !payloads.length) throw ApiError.badRequest('payloads must be a non-empty array');
    if (payloads.length > 2000) throw ApiError.badRequest('Maximum 2000 items per import');

    const batchId = randomToken(8);
    const items = await inventoryService.addItems({
      productId, variantName, type, payloads: payloads.map((p) => String(p).trim()).filter(Boolean),
      label, batchId, note,
    });

    if (!product.unlimitedStock) {
      product.stockQuantity += items.length;
      await product.save();
    }

    await logAudit({ req, action: 'inventory.bulkImport', resource: 'inventory', meta: { productId, count: items.length, batchId } });
    res.status(201).json({ success: true, data: { imported: items.length, batchId } });
  }),

  /** CSV export — includes decrypted payloads. Admin-only and audited. */
  exportCsv: catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.product) filter.product = req.query.product;
    if (req.query.status) filter.status = req.query.status;
    const items = await Inventory.find(filter).select('+payloadEncrypted').limit(10000);

    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = ['id,product,variant,type,label,status,payload,created_at'];
    for (const item of items) {
      rows.push(
        [item._id, item.product, item.variantName, item.type, item.label, item.status,
         decrypt(item.payloadEncrypted), item.createdAt.toISOString()]
          .map(escape).join(',')
      );
    }

    await logAudit({ req, action: 'inventory.export', resource: 'inventory', meta: { count: items.length } });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory-export.csv"');
    res.send(rows.join('\n'));
  }),

  update: catchAsync(async (req, res) => {
    const { label, status, note, expiresAt, payload } = req.body;
    const item = await Inventory.findById(req.params.id);
    if (!item) throw ApiError.notFound('Inventory item not found');
    if (label !== undefined) item.label = label;
    if (status !== undefined) item.status = status;
    if (note !== undefined) item.note = note;
    if (expiresAt !== undefined) item.expiresAt = expiresAt;
    if (payload !== undefined && payload !== '') item.payloadEncrypted = encrypt(payload);
    await item.save();
    await logAudit({ req, action: 'inventory.update', resource: 'inventory', resourceId: item._id });
    res.json({ success: true, data: { id: item._id } });
  }),

  remove: catchAsync(async (req, res) => {
    const item = await Inventory.findById(req.params.id);
    if (!item) throw ApiError.notFound('Inventory item not found');
    if (item.status === 'sold') throw ApiError.badRequest('Sold inventory cannot be deleted (audit trail)');
    await item.deleteOne();
    await logAudit({ req, action: 'inventory.delete', resource: 'inventory', resourceId: req.params.id });
    res.json({ success: true, message: 'Inventory item deleted' });
  }),
};

module.exports = inventoryController;
