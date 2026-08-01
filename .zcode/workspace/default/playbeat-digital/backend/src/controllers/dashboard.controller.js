const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const User = require('../models/User');
const CustomerTicket = require('../models/CustomerTicket');
const catchAsync = require('../utils/catchAsync');

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const dashboardController = {
  stats: catchAsync(async (req, res) => {
    const now = new Date();
    const today = startOfDay(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      revenueAll, revenueToday, revenueMonth,
      totalOrders, pendingOrders, completedOrders,
      totalCustomers, activeProducts, lowStockProducts,
      failedPayments, refunds, openTickets, recentOrders,
    ] = await Promise.all([
      Payment.aggregate([{ $match: { status: 'succeeded' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { status: 'succeeded', createdAt: { $gte: today } } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { status: 'succeeded', createdAt: { $gte: monthStart } } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['pending', 'payment_pending', 'processing'] } }),
      Order.countDocuments({ status: 'completed' }),
      User.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ unlimitedStock: false, stockQuantity: { $lte: 5 }, status: 'active' }),
      Payment.countDocuments({ status: 'failed' }),
      Payment.countDocuments({ status: 'refunded' }),
      CustomerTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(8).select('orderNumber total status paymentStatus createdAt user'),
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: revenueAll[0]?.sum || 0,
        todaySales: revenueToday[0]?.sum || 0,
        monthlySales: revenueMonth[0]?.sum || 0,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalCustomers,
        activeProducts,
        lowStockProducts,
        failedPayments,
        refunds,
        openTickets,
        recentOrders,
      },
    });
  }),

  analytics: catchAsync(async (req, res) => {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const dayFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

    const [revenueByDay, ordersByDay, customersByDay, topProducts, categoryPerformance] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'succeeded', createdAt: { $gte: since } } },
        { $group: { _id: dayFormat, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: dayFormat, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: dayFormat, customers: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'succeeded', createdAt: { $gte: since } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', units: { $sum: '$items.qty' }, revenue: { $sum: '$items.total' } } },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'succeeded', createdAt: { $gte: since } } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $lookup: {
            from: 'productcategories',
            localField: 'product.category',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        { $group: { _id: '$category.name', revenue: { $sum: '$items.total' }, units: { $sum: '$items.qty' } } },
        { $sort: { revenue: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: { days, revenueByDay, ordersByDay, customersByDay, topProducts, categoryPerformance },
    });
  }),
};

module.exports = dashboardController;
