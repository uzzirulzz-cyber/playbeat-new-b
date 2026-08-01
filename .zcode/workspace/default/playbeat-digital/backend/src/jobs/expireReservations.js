const Order = require('../models/Order');
const inventoryService = require('../services/inventory.service');
const logger = require('../utils/logger');

/**
 * Local-only safety net: releases inventory reservations whose orders never
 * completed payment (e.g. customer abandoned checkout without the provider
 * sending an expiry webhook). Runs every 10 minutes on the traditional
 * server; serverless deployments rely on provider expiry webhooks instead.
 */
const sweep = async () => {
  try {
    const cutoff = new Date(Date.now() - 45 * 60 * 1000);
    const stale = await Order.find({
      status: 'payment_pending',
      createdAt: { $lt: cutoff },
    }).select('_id orderNumber');
    for (const order of stale) {
      const released = await inventoryService.release(order._id);
      order.status = 'failed';
      order.paymentStatus = 'expired';
      order.timeline.push({ status: 'failed', note: 'Payment window expired; reservation released' });
      await order.save();
      logger.info(`Released ${released} reserved units for expired order ${order.orderNumber}`);
    }
  } catch (err) {
    logger.error(`Reservation sweep failed: ${err.message}`);
  }
};

const startReservationExpiryJob = () => {
  const timer = setInterval(sweep, 10 * 60 * 1000);
  timer.unref();
  logger.info('Reservation expiry job started (10m interval)');
};

module.exports = { startReservationExpiryJob, sweep };
