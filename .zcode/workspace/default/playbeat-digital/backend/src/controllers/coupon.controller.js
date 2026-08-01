const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { logAudit } = require('../middleware/audit');

const couponController = {
  list: catchAsync(async (req, res) => {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  }),

  create: catchAsync(async (req, res) => {
    const coupon = await Coupon.create({ ...req.body, code: req.body.code.toUpperCase().trim() });
    await logAudit({ req, action: 'coupon.create', resource: 'coupon', resourceId: coupon._id, meta: { code: coupon.code } });
    res.status(201).json({ success: true, data: coupon });
  }),

  update: catchAsync(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) throw ApiError.notFound('Coupon not found');
    Object.assign(coupon, req.body);
    if (req.body.code) coupon.code = req.body.code.toUpperCase().trim();
    await coupon.save();
    await logAudit({ req, action: 'coupon.update', resource: 'coupon', resourceId: coupon._id });
    res.json({ success: true, data: coupon });
  }),

  remove: catchAsync(async (req, res) => {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) throw ApiError.notFound('Coupon not found');
    await logAudit({ req, action: 'coupon.delete', resource: 'coupon', resourceId: req.params.id, meta: { code: coupon.code } });
    res.json({ success: true, message: 'Coupon deleted' });
  }),
};

module.exports = couponController;
