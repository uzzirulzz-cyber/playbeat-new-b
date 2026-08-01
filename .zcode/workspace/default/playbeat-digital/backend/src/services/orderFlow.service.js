const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Coupon = require('../models/Coupon');
const deliveryService = require('./delivery.service');
const inventoryService = require('./inventory.service');
const { notify } = require('./notify.service');
const { emails } = require('./email.service');
const logger = require('../utils/logger');

/**
 * Central order/payment state transitions, shared by provider webhooks and
 * admin-verified manual payments. All functions are idempotent — webhooks
 * may be delivered more than once.
 */
const orderFlow = {
  /** Payment verified -> mark paid -> run digital delivery pipeline. */
  async markOrderPaid(orderId, { provider, providerPaymentId = '', sessionId = '' }) {
    const order = await Order.findById(orderId).populate('user');
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.paymentStatus === 'succeeded') return order; // idempotent

    order.paymentStatus = 'succeeded';
    order.status = 'paid';
    order.paidAt = new Date();
    order.timeline.push({ status: 'paid', note: `Payment confirmed via ${provider}` });
    await order.save();

    await Payment.findOneAndUpdate(
      { order: order._id, provider },
      {
        $set: {
          status: 'succeeded',
          ...(providerPaymentId ? { providerPaymentId } : {}),
          ...(sessionId ? { providerSessionId: sessionId } : {}),
        },
      },
      { new: true }
    );

    if (order.couponCode) {
      await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
    }

    const user = order.user;
    await notify({
      user: user._id,
      type: 'payment',
      title: `Payment confirmed for ${order.orderNumber}`,
      body: `We received your payment of ${order.currency} ${order.total.toFixed(2)}.`,
      link: `/account/orders/${order._id}`,
    });
    await emails.orderConfirmation(user, order).catch((e) => logger.error(`Email failed: ${e.message}`));

    return deliveryService.deliverOrder(order);
  },

  /** Payment failed or expired -> release reserved inventory. */
  async markOrderFailed(orderId, { provider, reason = 'Payment failed', cancelled = false }) {
    const order = await Order.findById(orderId);
    if (!order || order.paymentStatus === 'succeeded') return order;

    await inventoryService.release(order._id);
    order.status = cancelled ? 'cancelled' : 'failed';
    order.paymentStatus = cancelled ? 'expired' : 'failed';
    order.timeline.push({ status: order.status, note: reason });
    await order.save();

    await Payment.findOneAndUpdate(
      { order: order._id, provider },
      { $set: { status: 'failed', failureReason: reason } }
    );

    await notify({
      user: order.user,
      type: 'payment',
      title: `Payment ${cancelled ? 'cancelled' : 'failed'} for ${order.orderNumber}`,
      body: reason,
      link: `/account/orders/${order._id}`,
    });
    return order;
  },
};

module.exports = orderFlow;
