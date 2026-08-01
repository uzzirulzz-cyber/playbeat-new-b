const mongoose = require('mongoose');
const HomepageSection = require('../models/HomepageSection');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { logAudit } = require('../middleware/audit');

/** Populate configured product/category references for storefront rendering. */
const populateSections = async (sections) => {
  return Promise.all(
    sections.map(async (section) => {
      const obj = section.toObject();
      const ids = (obj.config?.productIds || []).filter((id) => mongoose.isValidObjectId(id));
      const catIds = (obj.config?.categoryIds || []).filter((id) => mongoose.isValidObjectId(id));
      if (ids.length) {
        obj.config.products = await Product.find({ _id: { $in: ids }, status: 'active' })
          .populate('category', 'name slug')
          .limit(obj.config.limit || 12);
      } else if (['trending', 'featured_products'].includes(obj.type)) {
        // Dynamic fallback when no explicit selection is configured.
        const filter = { status: 'active' };
        if (obj.type === 'trending') filter.trending = true;
        if (obj.type === 'featured_products') filter.featured = true;
        obj.config.products = await Product.find(filter)
          .populate('category', 'name slug')
          .sort({ soldCount: -1, createdAt: -1 })
          .limit(obj.config.limit || 8);
      }
      if (catIds.length) {
        obj.config.categories = await ProductCategory.find({ _id: { $in: catIds }, status: 'active' }).sort({ order: 1 });
      } else if (obj.type === 'featured_categories') {
        obj.config.categories = await ProductCategory.find({ status: 'active', featured: true }).sort({ order: 1 }).limit(10);
      }
      return obj;
    })
  );
};

const homepageController = {
  /** Public homepage payload: enabled sections, ordered, fully populated. */
  getHomepage: catchAsync(async (req, res) => {
    const sections = await HomepageSection.find({ enabled: true }).sort({ order: 1 });
    res.json({ success: true, data: await populateSections(sections) });
  }),

  adminList: catchAsync(async (req, res) => {
    const sections = await HomepageSection.find().sort({ order: 1 });
    res.json({ success: true, data: sections });
  }),

  create: catchAsync(async (req, res) => {
    const maxOrder = await HomepageSection.findOne().sort({ order: -1 }).select('order');
    const section = await HomepageSection.create({ ...req.body, order: (maxOrder?.order ?? -1) + 1 });
    await logAudit({ req, action: 'homepage.createSection', resource: 'homepage', resourceId: section._id, meta: { type: section.type } });
    res.status(201).json({ success: true, data: section });
  }),

  update: catchAsync(async (req, res) => {
    const section = await HomepageSection.findById(req.params.id);
    if (!section) throw ApiError.notFound('Section not found');
    const { type, title, subtitle, enabled, config } = req.body;
    if (type !== undefined) section.type = type;
    if (title !== undefined) section.title = title;
    if (subtitle !== undefined) section.subtitle = subtitle;
    if (enabled !== undefined) section.enabled = enabled;
    if (config !== undefined) section.config = config;
    await section.save();
    await logAudit({ req, action: 'homepage.updateSection', resource: 'homepage', resourceId: section._id });
    res.json({ success: true, data: section });
  }),

  remove: catchAsync(async (req, res) => {
    const section = await HomepageSection.findByIdAndDelete(req.params.id);
    if (!section) throw ApiError.notFound('Section not found');
    await logAudit({ req, action: 'homepage.deleteSection', resource: 'homepage', resourceId: req.params.id });
    res.json({ success: true, message: 'Section deleted' });
  }),

  /** Reorder: body is the full ordered array of section IDs. */
  reorder: catchAsync(async (req, res) => {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) throw ApiError.badRequest('orderedIds must be an array');
    await Promise.all(
      orderedIds.map((id, index) =>
        HomepageSection.findByIdAndUpdate(id, { $set: { order: index } })
      )
    );
    await logAudit({ req, action: 'homepage.reorder', resource: 'homepage' });
    const sections = await HomepageSection.find().sort({ order: 1 });
    res.json({ success: true, data: sections });
  }),
};

module.exports = homepageController;
