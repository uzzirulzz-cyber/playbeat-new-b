const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { encrypt, decrypt } = require('../utils/crypto');

/**
 * Transaction-safe digital inventory management.
 *
 * Reservation uses an atomic findOneAndUpdate on the status field, so two
 * concurrent checkouts can never reserve the same unit — no distributed
 * lock or multi-document transaction required, which keeps it compatible
 * with serverless deployments and standalone MongoDB topologies.
 */
const inventoryService = {
  availableCount: (productId, variantName = '') =>
    Inventory.countDocuments({ product: productId, variantName, status: 'available' }),

  /** Atomically reserve `qty` units for an order. Rolls back on shortfall. */
  async reserve({ productId, variantName = '', qty, orderId }) {
    const reserved = [];
    for (let i = 0; i < qty; i += 1) {
      const item = await Inventory.findOneAndUpdate(
        { product: productId, variantName, status: 'available' },
        { $set: { status: 'reserved', reservedBy: orderId, reservedAt: new Date() } },
        { new: true }
      );
      if (!item) break;
      reserved.push(item);
    }
    if (reserved.length < qty) {
      // Roll back partial reservation.
      await Inventory.updateMany(
        { _id: { $in: reserved.map((i) => i._id) } },
        { $set: { status: 'available' }, $unset: { reservedBy: '', reservedAt: '' } }
      );
      throw ApiError.conflict('Insufficient digital stock for one or more items');
    }
    return reserved;
  },

  /** Convert reservations into delivered assets. Returns decrypted assets. */
  async fulfill({ productId, variantName = '', qty, orderId }) {
    const items = await Inventory.find({
      product: productId,
      variantName,
      status: 'reserved',
      reservedBy: orderId,
    })
      .select('+payloadEncrypted')
      .limit(qty);

    const now = new Date();
    const assets = [];
    for (const item of items) {
      item.status = 'sold';
      item.order = orderId;
      item.soldAt = now;
      await item.save();
      assets.push({
        type: item.type,
        label: item.label,
        payload: decrypt(item.payloadEncrypted),
        payloadEncrypted: item.payloadEncrypted,
        inventoryItem: item._id,
      });
    }
    return assets;
  },

  /** Release reservations (payment failed / expired / refunded). */
  async release(orderId) {
    const result = await Inventory.updateMany(
      { reservedBy: orderId, status: 'reserved' },
      { $set: { status: 'available' }, $unset: { reservedBy: '', reservedAt: '' } }
    );
    return result.modifiedCount;
  },

  /** Disable already-sold units (refund / fraud). */
  async disableSold(orderId) {
    await Inventory.updateMany(
      { order: orderId, status: 'sold' },
      { $set: { status: 'disabled' } }
    );
  },

  /** Decrement catalog stock counters after a successful sale. */
  async decrementProductStock(productId, variantName, qty) {
    const product = await Product.findById(productId);
    if (!product) return;
    product.soldCount = (product.soldCount || 0) + qty;
    if (variantName && product.variants?.length) {
      const variant = product.variants.find((v) => v.name === variantName);
      if (variant && !variant.unlimitedStock) {
        variant.stockQuantity = Math.max(0, variant.stockQuantity - qty);
      }
    } else if (!product.unlimitedStock) {
      product.stockQuantity = Math.max(0, product.stockQuantity - qty);
    }
    await product.save();
  },

  addItems: async ({ productId, variantName = '', type, payloads, label = '', batchId = '', expiresAt = null, note = '' }) => {
    const docs = payloads.map((payload) => ({
      product: productId,
      variantName,
      type,
      label,
      batchId,
      expiresAt,
      note,
      payloadEncrypted: encrypt(payload),
      status: 'available',
    }));
    return Inventory.insertMany(docs);
  },
};

module.exports = inventoryService;
