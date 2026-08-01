const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const SiteSettings = require('../models/SiteSettings');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { computeTotals, round2 } = require('../utils/pricing');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

/** Hydrate cart items with live product data and compute server-side totals. */
const hydrateCart = async (cart) => {
  const productIds = cart.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } }).populate('category', 'name slug');
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const items = [];
  for (const item of cart.items) {
    const product = productMap.get(item.product.toString());
    if (!product || product.status !== 'active') continue; // drop stale items
    let unitPrice = product.salePrice ?? product.price;
    let inStock = product.unlimitedStock || product.stockQuantity > 0;
    if (item.variantId) {
      const variant = product.variants.id(item.variantId);
      if (!variant) continue;
      unitPrice = variant.salePrice ?? variant.price;
      inStock = variant.unlimitedStock || variant.stockQuantity > 0;
    }
    items.push({
      id: item._id,
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] || '',
      variantId: item.variantId,
      variantName: item.variantName,
      deliveryType: product.deliveryType,
      qty: item.qty,
      unitPrice,
      lineTotal: round2(unitPrice * item.qty),
      inStock,
      currency: product.currency,
    });
  }

  let coupon = null;
  let couponError = null;
  if (cart.couponCode) {
    const found = await Coupon.findOne({ code: cart.couponCode });
    if (found) {
      const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
      const usable = found.isUsable(subtotal);
      if (usable.ok) coupon = found;
      else couponError = usable.reason;
    } else {
      couponError = 'Invalid coupon code';
    }
  }

  const settings = await SiteSettings.getSite();
  const totals = computeTotals(
    items.map((i) => ({ unitPrice: i.unitPrice, qty: i.qty })),
    coupon,
    settings.taxPercent
  );

  return {
    items,
    couponCode: coupon ? coupon.code : cart.couponCode || '',
    couponError,
    currency: settings.currency,
    taxPercent: settings.taxPercent,
    totals,
  };
};

const cartController = {
  get: catchAsync(async (req, res) => {
    const cart = await getOrCreateCart(req.user._id);
    res.json({ success: true, data: await hydrateCart(cart) });
  }),

  addItem: catchAsync(async (req, res) => {
    const { productId, variantId = null, qty = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') throw ApiError.notFound('Product not found');

    let variantName = '';
    if (variantId) {
      const variant = product.variants.id(variantId);
      if (!variant) throw ApiError.badRequest('Invalid variant');
      if (!variant.unlimitedStock && variant.stockQuantity < qty) throw ApiError.conflict('Not enough stock');
      variantName = variant.name;
    } else if (!product.unlimitedStock && product.stockQuantity < qty) {
      throw ApiError.conflict('Not enough stock');
    }

    const cart = await getOrCreateCart(req.user._id);
    const existing = cart.items.find(
      (i) => i.product.toString() === productId && String(i.variantId || '') === String(variantId || '')
    );
    if (existing) existing.qty = Math.min(existing.qty + qty, 99);
    else cart.items.push({ product: productId, variantId, variantName, qty });
    await cart.save();

    res.status(201).json({ success: true, data: await hydrateCart(cart) });
  }),

  updateItem: catchAsync(async (req, res) => {
    const { qty } = req.body;
    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.id(req.params.itemId);
    if (!item) throw ApiError.notFound('Cart item not found');
    item.qty = qty;
    await cart.save();
    res.json({ success: true, data: await hydrateCart(cart) });
  }),

  removeItem: catchAsync(async (req, res) => {
    const cart = await getOrCreateCart(req.user._id);
    cart.items.pull({ _id: req.params.itemId });
    await cart.save();
    res.json({ success: true, data: await hydrateCart(cart) });
  }),

  clear: catchAsync(async (req, res) => {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    cart.couponCode = '';
    await cart.save();
    res.json({ success: true, data: await hydrateCart(cart) });
  }),

  applyCoupon: catchAsync(async (req, res) => {
    const { code } = req.body;
    const cart = await getOrCreateCart(req.user._id);
    cart.couponCode = String(code || '').toUpperCase().trim();
    await cart.save();
    const data = await hydrateCart(cart);
    if (data.couponError) throw ApiError.badRequest(data.couponError);
    res.json({ success: true, data });
  }),

  removeCoupon: catchAsync(async (req, res) => {
    const cart = await getOrCreateCart(req.user._id);
    cart.couponCode = '';
    await cart.save();
    res.json({ success: true, data: await hydrateCart(cart) });
  }),

  /** Merge a guest (localStorage) cart into the persistent cart on login. */
  merge: catchAsync(async (req, res) => {
    const { items = [] } = req.body;
    const cart = await getOrCreateCart(req.user._id);
    for (const incoming of items.slice(0, 50)) {
      const product = await Product.findById(incoming.productId);
      if (!product || product.status !== 'active') continue;
      let variantName = '';
      if (incoming.variantId) {
        const variant = product.variants.id(incoming.variantId);
        if (!variant) continue;
        variantName = variant.name;
      }
      const existing = cart.items.find(
        (i) =>
          i.product.toString() === incoming.productId &&
          String(i.variantId || '') === String(incoming.variantId || '')
      );
      const qty = Math.min(Math.max(parseInt(incoming.qty, 10) || 1, 1), 99);
      if (existing) existing.qty = Math.min(existing.qty + qty, 99);
      else cart.items.push({ product: product._id, variantId: incoming.variantId || null, variantName, qty });
    }
    await cart.save();
    res.json({ success: true, data: await hydrateCart(cart) });
  }),
};

module.exports = cartController;
