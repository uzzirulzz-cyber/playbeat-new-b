const Order = require('../models/Order');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const orderFlow = require('../services/orderFlow.service');
const stripeService = require('../services/payment/stripe.service');
const lemonSqueezyService = require('../services/payment/lemonsqueezy.service');
const logger = require('../utils/logger');

const paymentController = {
  /**
   * Stripe webhook — the ONLY path that marks Stripe orders as paid.
   * Requires the exact raw body (mounted with express.raw in app.js).
   */
  stripeWebhook: async (req, res) => {
    let event;
    try {
      event = stripeService.constructEvent(req.body, req.headers['stripe-signature']);
    } catch (err) {
      logger.warn(`Stripe webhook signature rejected: ${err.message}`);
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          if (session.payment_status === 'paid') {
            await orderFlow.markOrderPaid(session.metadata.orderId, {
              provider: 'stripe',
              providerPaymentId: session.payment_intent,
              sessionId: session.id,
            });
          }
          break;
        }
        case 'checkout.session.expired': {
          const session = event.data.object;
          await orderFlow.markOrderFailed(session.metadata.orderId, {
            provider: 'stripe',
            reason: 'Checkout session expired',
            cancelled: true,
          });
          break;
        }
        case 'checkout.session.async_payment_failed': {
          const session = event.data.object;
          await orderFlow.markOrderFailed(session.metadata.orderId, {
            provider: 'stripe',
            reason: 'Async payment failed',
          });
          break;
        }
        default:
          break; // Unhandled events are acknowledged with 200.
      }
    } catch (err) {
      logger.error(`Stripe webhook handling failed (${event.type}): ${err.message}`);
      return res.status(500).json({ success: false, message: 'Webhook handling failed' });
    }

    return res.json({ received: true });
  },

  /** Lemon Squeezy webhook — HMAC-verified payment confirmation. */
  lemonSqueezyWebhook: async (req, res) => {
    const signature = req.headers['x-signature'];
    if (!lemonSqueezyService.verifySignature(req.body, signature)) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    let event;
    try {
      event = JSON.parse(req.body.toString('utf8'));
    } catch {
      return res.status(400).json({ success: false, message: 'Malformed payload' });
    }

    try {
      const eventName = event.meta?.event_name;
      const customOrderId = event.meta?.custom_data?.order_id;
      if (eventName === 'order_created' && customOrderId) {
        const attributes = event.data?.attributes || {};
        if (attributes.status === 'paid') {
          await orderFlow.markOrderPaid(customOrderId, {
            provider: 'lemonsqueezy',
            providerPaymentId: event.data?.id || '',
          });
        }
      }
    } catch (err) {
      logger.error(`Lemon Squeezy webhook handling failed: ${err.message}`);
      return res.status(500).json({ success: false, message: 'Webhook handling failed' });
    }

    return res.json({ received: true });
  },

  /** Re-create a Stripe checkout session for an unpaid order (owner only). */
  resumeStripeSession: catchAsync(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
    if (!order) throw ApiError.notFound('Order not found');
    if (order.paymentStatus === 'succeeded') throw ApiError.badRequest('Order is already paid');
    if (order.paymentMethod !== 'stripe') throw ApiError.badRequest('Order does not use Stripe');

    const session = await stripeService.createCheckoutSession({
      order,
      customerEmail: order.customerInfo.email,
    });
    await Payment.findOneAndUpdate(
      { order: order._id, provider: 'stripe' },
      { $set: { providerSessionId: session.id, status: 'created' } }
    );
    res.json({ success: true, data: { sessionUrl: session.url } });
  }),

  /** Customer payment history. */
  myPayments: catchAsync(async (req, res) => {
    const payments = await Payment.find({ user: req.user._id })
      .populate('order', 'orderNumber total status')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: payments });
  }),

  // ── Admin ─────────────────────────────────────────────────────────────────
  adminList: catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.provider) filter.provider = req.query.provider;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const [items, total] = await Promise.all([
      Payment.find(filter)
        .populate('order', 'orderNumber total')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);
    res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  }),
};

module.exports = paymentController;
