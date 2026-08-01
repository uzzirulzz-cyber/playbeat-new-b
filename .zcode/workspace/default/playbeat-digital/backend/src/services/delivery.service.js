const Order = require('../models/Order');
const inventoryService = require('./inventory.service');
const { emails } = require('./email.service');
const { notify } = require('./notify.service');
const logger = require('../utils/logger');

/**
 * Digital delivery pipeline, executed ONLY after a verified payment
 * (provider webhook or admin-verified manual payment):
 * reserve -> fulfill -> snapshot assets onto order items -> notify -> email.
 */
const deliveryService = {
  async deliverOrder(order) {
    const fresh = await Order.findById(order._id);
    if (!fresh) throw new Error('Order not found');
    if (['delivered', 'completed'].includes(fresh.status)) return fresh; // idempotent

    const allAssetsForEmail = [];
    let anyManual = false;

    for (const item of fresh.items) {
      if (item.deliveryType === 'manual') {
        anyManual = true;
        continue; // A human operator delivers these from the admin panel.
      }
      if (item.deliveryStatus === 'delivered') continue;

      const assets = await inventoryService.fulfill({
        productId: item.product,
        variantName: item.variantName || '',
        qty: item.qty,
        orderId: fresh._id,
      });

      if (assets.length < item.qty) {
        item.deliveryStatus = 'failed';
        logger.error(`Delivery shortfall for order ${fresh.orderNumber} item ${item.name}`);
      } else {
        item.deliveryStatus = 'delivered';
        for (const asset of assets) {
          item.deliveredAssets.push({
            type: asset.type,
            label: asset.label,
            payloadEncrypted: asset.payloadEncrypted,
            inventoryItem: asset.inventoryItem,
          });
          allAssetsForEmail.push({ type: asset.type, label: asset.label || item.name, payload: asset.payload });
        }
        await inventoryService.decrementProductStock(item.product, item.variantName || '', item.qty);
      }
    }

    fresh.deliveredAt = new Date();
    fresh.status = anyManual ? 'processing' : 'delivered';
    fresh.timeline.push({ status: fresh.status, note: anyManual ? 'Instant items delivered; manual delivery pending' : 'Digital delivery completed' });
    if (!anyManual) {
      fresh.status = 'completed';
      fresh.timeline.push({ status: 'completed', note: 'Order completed' });
    }
    await fresh.save();

    await notify({
      user: fresh.user,
      type: 'delivery',
      title: `Order ${fresh.orderNumber} delivered`,
      body: anyManual
        ? 'Your instant items are ready. A manual delivery item is being processed by our team.'
        : 'Your digital products are ready in your account.',
      link: `/account/orders/${fresh._id}`,
    });

    if (allAssetsForEmail.length) {
      const user = await fresh.populate('user').then((o) => o.user);
      await emails.digitalDelivery(user, fresh, allAssetsForEmail).catch((e) =>
        logger.error(`Delivery email failed: ${e.message}`)
      );
    }

    return fresh;
  },

  /** Mark a manual-delivery item as delivered by an admin. */
  async markManualItemDelivered(order, itemId) {
    const item = order.items.id(itemId);
    if (!item) throw new Error('Order item not found');
    item.deliveryStatus = 'delivered';
    const allDelivered = order.items.every((i) => i.deliveryStatus === 'delivered');
    if (allDelivered) {
      order.status = 'completed';
      order.deliveredAt = order.deliveredAt || new Date();
      order.timeline.push({ status: 'completed', note: 'All items delivered' });
    }
    await order.save();
    return order;
  },
};

module.exports = deliveryService;
