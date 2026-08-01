const User = require('../models/User');
const Order = require('../models/Order');
const CustomerTicket = require('../models/CustomerTicket');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { logAudit } = require('../middleware/audit');

const customerController = {
  list: catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.q) {
      filter.$or = [
        { name: { $regex: req.query.q, $options: 'i' } },
        { email: { $regex: req.query.q, $options: 'i' } },
      ];
    }
    if (req.query.status) filter.status = req.query.status;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ]);

    const stats = await Order.aggregate([
      { $match: { user: { $in: items.map((u) => u._id) }, paymentStatus: 'succeeded' } },
      { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' } } },
    ]);
    const statMap = Object.fromEntries(stats.map((s) => [s._id.toString(), s]));

    const data = items.map((u) => ({
      ...u.toSafeJSON(),
      orderCount: statMap[u._id.toString()]?.orders || 0,
      totalSpent: statMap[u._id.toString()]?.spent || 0,
    }));

    res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  }),

  getById: catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw ApiError.notFound('Customer not found');

    const [orders, tickets, aggregates] = await Promise.all([
      Order.find({ user: user._id }).select('-items.deliveredAssets').sort({ createdAt: -1 }).limit(50),
      CustomerTicket.find({ user: user._id }).sort({ createdAt: -1 }).limit(20),
      Order.aggregate([
        { $match: { user: user._id, paymentStatus: 'succeeded' } },
        { $group: { _id: null, spent: { $sum: '$total' }, orders: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        customer: user.toSafeJSON(),
        orders,
        tickets,
        stats: { totalSpent: aggregates[0]?.spent || 0, paidOrders: aggregates[0]?.orders || 0 },
      },
    });
  }),

  updateStatus: catchAsync(async (req, res) => {
    const { status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) throw ApiError.notFound('Customer not found');
    user.status = status;
    await user.save();
    await logAudit({ req, action: 'customer.updateStatus', resource: 'customer', resourceId: user._id, meta: { status } });
    res.json({ success: true, data: user.toSafeJSON() });
  }),
};

module.exports = customerController;
