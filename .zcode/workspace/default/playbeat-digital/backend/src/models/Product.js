const mongoose = require('mongoose');
const slugify = require('../utils/slugify');
const {
  PRODUCT_STATUS,
  PRODUCT_TYPES,
  DELIVERY_TYPES,
} = require('../../../shared/constants');

/**
 * ProductVariant is modeled as an embedded subdocument (MongoDB best
 * practice) — e.g. "Amazon Prime Video: 3 Months / 6 Months / 1 Year".
 */
const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, default: '' },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0, default: null },
    stockQuantity: { type: Number, default: 0, min: 0 },
    unlimitedStock: { type: Boolean, default: false },
    deliveryMethod: { type: String, enum: DELIVERY_TYPES, default: 'instant' },
    lemonSqueezyVariantId: { type: String, default: '' },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    sku: { type: String, unique: true, sparse: true, trim: true },
    description: { type: String, default: '' },
    shortDescription: { type: String, default: '', maxlength: 500 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', required: true, index: true },
    subcategory: { type: String, default: '', trim: true },
    images: [{ type: String }],
    video: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0, default: null },
    currency: { type: String, default: 'USD', uppercase: true, maxlength: 3 },
    productType: { type: String, enum: PRODUCT_TYPES, default: 'digital' },
    deliveryType: { type: String, enum: DELIVERY_TYPES, default: 'instant' },
    stockQuantity: { type: Number, default: 0, min: 0 },
    unlimitedStock: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: PRODUCT_STATUS, default: 'draft', index: true },
    featured: { type: Boolean, default: false, index: true },
    trending: { type: Boolean, default: false, index: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    variants: [variantSchema],
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      keywords: [{ type: String }],
    },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', tags: 'text', shortDescription: 'text' });
productSchema.index({ status: 1, featured: 1, trending: 1 });
productSchema.index({ createdAt: -1 });

productSchema.pre('validate', function ensureSlug(next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

productSchema.methods.effectivePrice = function effectivePrice(variantId) {
  if (variantId && this.variants?.length) {
    const variant = this.variants.id(variantId);
    if (variant) return variant.salePrice ?? variant.price;
  }
  return this.salePrice ?? this.price;
};

productSchema.methods.inStock = function inStock(variantId) {
  if (variantId && this.variants?.length) {
    const variant = this.variants.id(variantId);
    if (variant) return variant.unlimitedStock || variant.stockQuantity > 0;
  }
  return this.unlimitedStock || this.stockQuantity > 0;
};

module.exports = mongoose.model('Product', productSchema);
