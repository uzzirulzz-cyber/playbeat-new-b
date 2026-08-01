const mongoose = require('mongoose');
const { INVENTORY_STATUS, INVENTORY_TYPES } = require('../../../shared/constants');

/**
 * One document per deliverable digital unit (a license key, an account,
 * a download link...). Payloads are AES-256-GCM encrypted at rest and are
 * never exposed through public APIs. State machine:
 * available -> reserved (during checkout) -> sold (after verified payment).
 */
const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variantName: { type: String, default: '', trim: true },
    type: { type: String, enum: INVENTORY_TYPES, required: true },
    payloadEncrypted: { type: String, required: true, select: false },
    label: { type: String, default: '', trim: true },
    status: { type: String, enum: INVENTORY_STATUS, default: 'available', index: true },
    reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    reservedAt: { type: Date, default: null },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    soldAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    batchId: { type: String, default: '', index: true },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

inventorySchema.index({ product: 1, variantName: 1, status: 1 });
inventorySchema.index({ reservedBy: 1, status: 1 });
inventorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Inventory', inventorySchema);
