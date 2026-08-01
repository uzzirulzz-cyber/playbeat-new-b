const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { logAudit } = require('../middleware/audit');

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { 'ratings.average': -1 },
  popular: { soldCount: -1 },
};

const buildPublicQuery = async (query) => {
  const filter = { status: 'active' };
  if (query.q) filter.$text = { $search: query.q };
  if (query.featured === 'true') filter.featured = true;
  if (query.trending === 'true') filter.trending = true;
  if (query.tag) filter.tags = query.tag.toLowerCase();
  if (query.category) {
    const category = await ProductCategory.findOne({ slug: query.category });
    filter.category = category ? category._id : null;
  }
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }
  return filter;
};

const paginate = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 12, 1), 60);
  return { page, limit, skip: (page - 1) * limit };
};

const productController = {
  // ── Public ────────────────────────────────────────────────────────────────
  list: catchAsync(async (req, res) => {
    const filter = await buildPublicQuery(req.query);
    const { page, limit, skip } = paginate(req.query);
    const sort = SORTS[req.query.sort] || SORTS.newest;

    const [items, total] = await Promise.all([
      Product.find(filter).populate('category', 'name slug').sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  }),

  getBySlug: catchAsync(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug, status: 'active' }).populate(
      'category',
      'name slug'
    );
    if (!product) throw ApiError.notFound('Product not found');

    const related = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      status: 'active',
    })
      .select('name slug price salePrice images ratings deliveryType')
      .limit(4);

    res.json({ success: true, data: { product, related } });
  }),

  // ── Admin ─────────────────────────────────────────────────────────────────
  adminList: catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.q) filter.name = { $regex: req.query.q, $options: 'i' };
    const { page, limit, skip } = paginate(req.query);

    const [items, total] = await Promise.all([
      Product.find(filter).populate('category', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);
    res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  }),

  adminGet: catchAsync(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!product) throw ApiError.notFound('Product not found');
    res.json({ success: true, data: product });
  }),

  create: catchAsync(async (req, res) => {
    const product = await Product.create(req.body);
    await logAudit({ req, action: 'product.create', resource: 'product', resourceId: product._id, meta: { name: product.name } });
    res.status(201).json({ success: true, data: product });
  }),

  update: catchAsync(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw ApiError.notFound('Product not found');
    Object.assign(product, req.body);
    await product.save(); // full validation + slug hooks
    await logAudit({ req, action: 'product.update', resource: 'product', resourceId: product._id });
    res.json({ success: true, data: product });
  }),

  remove: catchAsync(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw ApiError.notFound('Product not found');
    await logAudit({ req, action: 'product.delete', resource: 'product', resourceId: req.params.id, meta: { name: product.name } });
    res.json({ success: true, message: 'Product deleted' });
  }),
};

module.exports = productController;
