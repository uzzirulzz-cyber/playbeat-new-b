const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { logAudit } = require('../middleware/audit');

const recalcProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId, status: 'published' } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    $set: {
      'ratings.average': stats[0] ? Math.round(stats[0].avg * 10) / 10 : 0,
      'ratings.count': stats[0]?.count || 0,
    },
  });
};

const reviewController = {
  listForProduct: catchAsync(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug, status: 'active' });
    if (!product) throw ApiError.notFound('Product not found');
    const reviews = await Review.find({ product: product._id, status: 'published' })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: reviews });
  }),

  create: catchAsync(async (req, res) => {
    const { rating, title = '', comment = '' } = req.body;
    const product = await Product.findOne({ slug: req.params.slug, status: 'active' });
    if (!product) throw ApiError.notFound('Product not found');

    const purchased = await Order.findOne({
      user: req.user._id,
      paymentStatus: 'succeeded',
      'items.product': product._id,
    });

    const review = await Review.findOneAndUpdate(
      { product: product._id, user: req.user._id },
      {
        $set: {
          rating,
          title,
          comment,
          verifiedPurchase: Boolean(purchased),
          ...(purchased ? { order: purchased._id } : {}),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await recalcProductRating(product._id);
    res.status(201).json({ success: true, data: review });
  }),

  // ── Admin moderation ──────────────────────────────────────────────────────
  adminList: catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const reviews = await Review.find(filter)
      .populate('user', 'name email')
      .populate('product', 'name slug')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: reviews });
  }),

  adminSetStatus: catchAsync(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) throw ApiError.notFound('Review not found');
    review.status = req.body.status;
    await review.save();
    await recalcProductRating(review.product);
    await logAudit({ req, action: 'review.moderate', resource: 'review', resourceId: review._id, meta: { status: review.status } });
    res.json({ success: true, data: review });
  }),
};

module.exports = reviewController;
