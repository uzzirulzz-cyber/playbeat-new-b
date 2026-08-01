const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Payment = require('../models/Payment');
const SiteSettings = require('../models/SiteSettings');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { computeTotals, round2 } = require('../utils/pricing');
const { nextOrderNumber } = require('../utils/numbering');
const { decrypt } = require('../utils/crypto');
const inventoryService = require('../services/inventory.service');
const deliveryService = require('../services/delivery.service');
const orderFlow = require('../services/orderFlow.service');
const stripeService = require('../services/payment/stripe.service');
const lemonSqueezyService = require('../services/payment/lemonsqueezy.service');
const { emails } = require('../services/email.service');
const { notify } = require('../services/notify.service');
const { logAudit } = require('../middleware/audit');
const logger = require('../utils/logger');

/** Decrypt delivered assets for the order owner / authorized admin. */
const orderWithAssets = async (order) => {
  const obj = order.toObject ? order.toObject() : order;
  for (const item of obj.items) {
    item.deliveredAssets = (item.deliveredAssets || []).map((asset) => {
      if (!asset.payloadEncrypted) return asset;
      try {
        return { ...asset, payload: decrypt(asset.payloadEncrypted), payloadEncrypted: undefined };
      } catch {
        return { ...asset, payload: '[unavailable]', payloadEncrypted: undefined };
      }
    });
  }
  return obj;
};

const orderController = {
  /**
   * Create an order from the server-side cart, reserve digital inventory and
   * initiate payment with the selected provider. The order only becomes
   * paid/delivered after a verified provider webhook (or admin verification
   * for manual payments) — never by client request.
   */
  create: catchAsync(async (req, res) => {
    const { paymentMethod, customerInfo = {} } = req.body;
    const settings = await SiteSettings.getSite();

    if (paymentMethod === 'stripe' && !settings.payments.stripeEnabled) {
      throw ApiError.badRequest('Stripe payments are currently disabled');
    }
    if (paymentMethod === 'lemonsqueezy' && !settings.payments.lemonSqueezyEnabled) {
      throw ApiError.badRequest('Lemon Squeezy payments are currently disabled');
    }
    if (paymentMethod === 'manual' && !settings.payments.manualEnabled) {
      throw ApiError.badRequest('Manual payments are currently disabled');
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || !cart.items.length) throw ApiError.badRequest('Your cart is empty');

    // ── Build order items from live DB data (client prices are ignored). ──
    const items = [];
    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.product);
      if (!product || product.status !== 'active') {
        throw ApiError.conflict(`"${cartItem.variantName || 'An item'}" is no longer available`);
      }
      let unitPrice = product.salePrice ?? product.price;
      let sku = product.sku || '';
      let deliveryType = product.deliveryType;
      if (cartItem.variantId) {
        const variant = product.variants.id(cartItem.variantId);
        if (!variant) throw ApiError.conflict(`Variant no longer exists for "${product.name}"`);
        unitPrice = variant.salePrice ?? variant.price;
        sku = variant.sku || sku;
        deliveryType = variant.deliveryMethod || deliveryType;
        if (!variant.unlimitedStock && variant.stockQuantity < cartItem.qty) {
          throw ApiError.conflict(`Not enough stock for "${product.name} — ${variant.name}"`);
        }
      } else if (!product.unlimitedStock && product.stockQuantity < cartItem.qty) {
        throw ApiError.conflict(`Not enough stock for "${product.name}"`);
      }
      items.push({
        product: product._id,
        name: product.name,
        variantName: cartItem.variantName || '',
        sku,
        image: product.images?.[0] || '',
        qty: cartItem.qty,
        unitPrice,
        total: round2(unitPrice * cartItem.qty),
        deliveryType,
      });
    }

    // ── Coupon ──
    let coupon = null;
    if (cart.couponCode) {
      coupon = await Coupon.findOne({ code: cart.couponCode });
      if (coupon) {
        const subtotal = items.reduce((s, i) => s + i.total, 0);
        const usable = coupon.isUsable(subtotal);
        if (!usable.ok) throw ApiError.badRequest(usable.reason);
      }
    }

    const totals = computeTotals(items, coupon, settings.taxPercent);

    const order = await Order.create({
      orderNumber: await nextOrderNumber(),
      user: req.user._id,
      items,
      ...totals,
      currency: settings.currency,
      couponCode: coupon ? coupon.code : '',
      paymentMethod,
      status: 'payment_pending',
      paymentStatus: 'pending',
      customerInfo: {
        name: customerInfo.name || req.user.name,
        email: customerInfo.email || req.user.email,
        phone: customerInfo.phone || req.user.phone,
      },
      timeline: [{ status: 'payment_pending', note: 'Order created, awaiting payment' }],
    });

    // ── Reserve digital inventory for instant-delivery items. ──
    try {
      for (const item of items) {
        if (item.deliveryType !== 'instant') continue;
        await inventoryService.reserve({
          productId: item.product,
          variantName: item.variantName || '',
          qty: item.qty,
          orderId: order._id,
        });
      }
    } catch (err) {
      await inventoryService.release(order._id);
      await Order.findByIdAndDelete(order._id);
      throw err;
    }

    // ── Initiate payment with the chosen provider. ──
    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      provider: paymentMethod,
      amount: order.total,
      currency: order.currency,
      status: 'created',
    });

    const response = { order, payment: { method: paymentMethod } };

    if (paymentMethod === 'stripe') {
      const session = await stripeService.createCheckoutSession({ order, customerEmail: order.customerInfo.email });
      payment.providerSessionId = session.id;
      await payment.save();
      response.payment.sessionUrl = session.url;
    } else if (paymentMethod === 'lemonsqueezy') {
      const firstVariantProduct = await Product.findById(items[0].product);
      const firstVariant = items[0].variantName
        ? firstVariantProduct.variants.find((v) => v.name === items[0].variantName)
        : null;
      const lemonVariantId = firstVariant?.lemonSqueezyVariantId || firstVariantProduct?.variants?.[0]?.lemonSqueezyVariantId;
      const checkout = await lemonSqueezyService.createCheckout({
        order,
        customerEmail: order.customerInfo.email,
        lemonVariantId,
      });
      payment.providerSessionId = checkout.id;
      await payment.save();
      response.payment.sessionUrl = checkout.url;
    } else {
      response.payment.instructions = settings.payments.manualInstructions;
      await emails
        .manualPaymentInstructions(req.user, order, settings.payments.manualInstructions)
        .catch((e) => logger.error(`Email failed: ${e.message}`));
    }

    // ── Clear the cart only after the order + payment session exist. ──
    cart.items = [];
    cart.couponCode = '';
    await cart.save();

    await notify({
      user: req.user._id,
      type: 'order',
      title: `Order ${order.orderNumber} created`,
      body: `Total ${order.currency} ${order.total.toFixed(2)} — awaiting payment.`,
      link: `/account/orders/${order._id}`,
    });

    res.status(201).json({ success: true, data: response });
  }),

  // ── Customer ──────────────────────────────────────────────────────────────
  myOrders: catchAsync(async (req, res) => {
    const orders = await Order.find({ user: req.user._id })
      .select('-items.deliveredAssets')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: orders });
  }),

  myOrder: catchAsync(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .select('+items.deliveredAssets.payloadEncrypted');
    if (!order) throw ApiError.notFound('Order not found');
    res.json({ success: true, data: await orderWithAssets(order) });
  }),

  // ── Admin ─────────────────────────────────────────────────────────────────
  adminList: catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.q) {
      filter.$or = [
        { orderNumber: { $regex: req.query.q, $options: 'i' } },
        { 'customerInfo.email': { $regex: req.query.q, $options: 'i' } },
      ];
    }
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const [items, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .select('-items.deliveredAssets')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);
    res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  }),

  adminGet: catchAsync(async (req, res) => {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone createdAt')
      .select('+items.deliveredAssets.payloadEncrypted');
    if (!order) throw ApiError.notFound('Order not found');
    const payments = await Payment.find({ order: order._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { order: await orderWithAssets(order), payments } });
  }),

  updateStatus: catchAsync(async (req, res) => {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) throw ApiError.notFound('Order not found');

    if (status === 'paid' && order.paymentMethod === 'manual' && order.paymentStatus !== 'succeeded') {
      // Admin verifies a manual payment -> full delivery pipeline.
      await logAudit({ req, action: 'order.manualMarkPaid', resource: 'order', resourceId: order._id });
      const delivered = await orderFlow.markOrderPaid(order._id, { provider: 'manual' });
      return res.json({ success: true, data: delivered });
    }

    if (status === 'cancelled' && order.paymentStatus !== 'succeeded') {
      await inventoryService.release(order._id);
    }
    order.status = status;
    order.timeline.push({ status, note: `Status updated by ${req.admin.email}` });
    await order.save();
    await logAudit({ req, action: 'order.updateStatus', resource: 'order', resourceId: order._id, meta: { status } });
    res.json({ success: true, data: order });
  }),

  addNote: catchAsync(async (req, res) => {
    const { text } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) throw ApiError.notFound('Order not found');
    order.notes.push({ by: req.admin.email, text });
    await order.save();
    res.json({ success: true, data: order.notes });
  }),

  markItemDelivered: catchAsync(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw ApiError.notFound('Order not found');
    const updated = await deliveryService.markManualItemDelivered(order, req.params.itemId);
    await notify({
      user: updated.user,
      type: 'delivery',
      title: `Item delivered — ${updated.orderNumber}`,
      body: 'A manually delivered item on your order is complete.',
      link: `/account/orders/${updated._id}`,
    });
    await logAudit({ req, action: 'order.itemDelivered', resource: 'order', resourceId: order._id, meta: { itemId: req.params.itemId } });
    res.json({ success: true, data: updated });
  }),

  resendDelivery: catchAsync(async (req, res) => {
    const order = await Order.findById(req.params.id)
      .populate('user')
      .select('+items.deliveredAssets.payloadEncrypted');
    if (!order) throw ApiError.notFound('Order not found');
    const assets = [];
    for (const item of order.items) {
      for (const asset of item.deliveredAssets) {
        assets.push({ type: asset.type, label: asset.label || item.name, payload: decrypt(asset.payloadEncrypted) });
      }
    }
    if (!assets.length) throw ApiError.badRequest('No delivered assets on this order yet');
    await emails.digitalDelivery(order.user, order, assets);
    await logAudit({ req, action: 'order.resendDelivery', resource: 'order', resourceId: order._id });
    res.json({ success: true, message: 'Delivery email resent' });
  }),

  refund: catchAsync(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user');
    if (!order) throw ApiError.notFound('Order not found');
    if (order.paymentStatus !== 'succeeded') throw ApiError.badRequest('Only paid orders can be refunded');

    const payment = await Payment.findOne({ order: order._id, status: 'succeeded' });
    if (!payment) throw ApiError.notFound('Payment record not found');

    if (payment.provider === 'stripe') {
      const refund = await stripeService.createRefund(payment.providerPaymentId, null);
      payment.refundId = refund.id;
    }
    // Manual payments are refunded off-platform; we record the state change.

    payment.status = 'refunded';
    payment.refundedAt = new Date();
    await payment.save();

    order.status = 'refunded';
    order.paymentStatus = 'refunded';
    order.timeline.push({ status: 'refunded', note: `Refund issued by ${req.admin.email}` });
    await order.save();

    await inventoryService.disableSold(order._id);
    await notify({
      user: order.user._id,
      type: 'refund',
      title: `Refund issued for ${order.orderNumber}`,
      body: `${order.currency} ${order.total.toFixed(2)} has been refunded.`,
      link: `/account/orders/${order._id}`,
    });
    await emails.refund(order.user, order).catch(() => {});
    await logAudit({ req, action: 'order.refund', resource: 'order', resourceId: order._id });
    res.json({ success: true, data: order });
  }),
};

module.exports = orderController;
