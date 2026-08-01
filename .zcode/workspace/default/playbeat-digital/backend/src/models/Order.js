const mongoose = require('mongoose');
const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } = require('../../../shared/constants');

/**
 * OrderItem is embedded in the order (MongoDB best practice). Delivered
 * digital assets are snapshotted onto the item at delivery time so the
 * customer retains access even if inventory records are later cleaned up.
 */
const deliveredAssetSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    label: { type: String, default: '' },
    payloadEncrypted: { type: String, required: true, select: false },
    inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    deliveredAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    variantName: { type: String, default: '' },
    sku: { type: String, default: '' },
    image: { type: String, default: '' },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    deliveryType: { type: String, enum: ['instant', 'manual'], default: 'instant' },
    deliveryStatus: { type: String, enum: ['pending', 'delivered', 'failed'], default: 'pending' },
    deliveredAssets: [deliveredAssetSchema],
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true },
    couponCode: { type: String, default: '', uppercase: true, trim: true },
    status: { type: String, enum: ORDER_STATUS, default: 'payment_pending', index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUS, default: 'pending', index: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    customerInfo: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    notes: [
      {
        by: { type: String, default: 'admin' },
        text: { type: String, required: true },
        at: { type: Date, default: Date.now },
      },
    ],
    timeline: [
      {
        status: { type: String },
        at: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
    paidAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
