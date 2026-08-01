const mongoose = require('mongoose');
const { HOMEPAGE_SECTION_TYPES } = require('../../../shared/constants');

/**
 * A homepage section managed by the Homepage Builder. `config` is a flexible
 * payload per section type:
 * - hero: { heading, subheading, backgroundImage, primaryCta {label, link}, secondaryCta {...} }
 * - trending / featured_products: { productIds: [], limit }
 * - featured_categories: { categoryIds: [] }
 * - banner: { image, link, buttonText, align }
 * - testimonials: { items: [{name, role, quote, rating, avatar}] }
 * - faq: { items: [{question, answer}] }
 * - custom_html: { html }
 */
const homepageSectionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: HOMEPAGE_SECTION_TYPES, required: true },
    title: { type: String, default: '', maxlength: 200 },
    subtitle: { type: String, default: '', maxlength: 500 },
    enabled: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

homepageSectionSchema.index({ enabled: 1, order: 1 });

module.exports = mongoose.model('HomepageSection', homepageSectionSchema);
