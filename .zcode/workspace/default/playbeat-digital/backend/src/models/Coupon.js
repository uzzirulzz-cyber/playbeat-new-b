const mongoose = require('mongoose');
const { COUPON_TYPES } = require('../../../shared/constants');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, enum: COUPON_TYPES, required: true },
    value: { type: Number, required: true, min: 0 },
    minSubtotal: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: null, min: 0 },
    usageLimit: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: null, min: 1 },
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true, index: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

couponSchema.methods.isUsable = function isUsable(subtotal) {
  if (!this.active) return { ok: false, reason: 'Coupon is not active' };
  if (this.expiresAt && this.expiresAt < new Date()) return { ok: false, reason: 'Coupon has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) return { ok: false, reason: 'Coupon usage limit reached' };
  if (this.minSubtotal && subtotal < this.minSubtotal) {
    return { ok: false, reason: `Minimum order of ${this.minSubtotal} required` };
  }
  return { ok: true };
};

module.exports = mongoose.model('Coupon', couponSchema);
