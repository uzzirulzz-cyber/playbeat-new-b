const ProductCategory = require('../models/ProductCategory');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { logAudit } = require('../middleware/audit');

const categoryController = {
  list: catchAsync(async (req, res) => {
    const categories = await ProductCategory.find({ status: 'active' }).sort({ order: 1, name: 1 });
    const counts = await Product.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
    const data = categories.map((c) => ({ ...c.toObject(), productCount: countMap[c._id.toString()] || 0 }));
    res.json({ success: true, data });
  }),

  adminList: catchAsync(async (req, res) => {
    const categories = await ProductCategory.find().sort({ order: 1, name: 1 });
    res.json({ success: true, data: categories });
  }),

  create: catchAsync(async (req, res) => {
    const category = await ProductCategory.create(req.body);
    await logAudit({ req, action: 'category.create', resource: 'category', resourceId: category._id });
    res.status(201).json({ success: true, data: category });
  }),

  update: catchAsync(async (req, res) => {
    const category = await ProductCategory.findById(req.params.id);
    if (!category) throw ApiError.notFound('Category not found');
    Object.assign(category, req.body);
    await category.save();
    await logAudit({ req, action: 'category.update', resource: 'category', resourceId: category._id });
    res.json({ success: true, data: category });
  }),

  remove: catchAsync(async (req, res) => {
    const inUse = await Product.countDocuments({ category: req.params.id });
    if (inUse > 0) throw ApiError.conflict(`Category is used by ${inUse} product(s) — reassign them first`);
    const category = await ProductCategory.findByIdAndDelete(req.params.id);
    if (!category) throw ApiError.notFound('Category not found');
    await logAudit({ req, action: 'category.delete', resource: 'category', resourceId: req.params.id });
    res.json({ success: true, message: 'Category deleted' });
  }),
};

module.exports = categoryController;
