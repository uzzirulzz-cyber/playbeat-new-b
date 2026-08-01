const express = require('express');
const os = require('os');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');

const router = express.Router();

// Lightweight health check for uptime monitors / load balancers.
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'playbeat-api',
      uptime: Math.round(process.uptime()),
      memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      dbState: mongoose.connection.readyState, // 1 = connected
      host: os.hostname(),
      time: new Date().toISOString(),
    },
  });
});

// Dynamic XML sitemap generated from active catalog.
router.get('/sitemap.xml', async (req, res) => {
  res.set('Content-Type', 'application/xml');
  const origin = process.env.SITE_BASE_URL || 'https://playbeat.digital';

  const [products, categories] = await Promise.all([
    Product.find({ status: 'active' }).select('slug updatedAt').limit(2000).lean(),
    ProductCategory.find({ status: 'active' }).select('slug updatedAt').lean(),
  ]);

  const urls = [
    `<url><loc>${origin}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${origin}/products</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    `<url><loc>${origin}/categories</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
    ...categories.map(
      (c) =>
        `<url><loc>${origin}/categories/${c.slug}</loc><lastmod>${c.updatedAt.toISOString()}</lastmod><priority>0.6</priority></url>`
    ),
    ...products.map(
      (p) =>
        `<url><loc>${origin}/products/${p.slug}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod><priority>0.8</priority></url>`
    ),
  ].join('');

  res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
});

// Sub-routers
const authRoutes = require('./auth.routes');
const adminAuthRoutes = require('./adminAuth.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');
const paymentRoutes = require('./payment.routes');
const ticketRoutes = require('./ticket.routes');
const notificationRoutes = require('./notification.routes');
const homepageRoutes = require('./homepage.routes');
const settingsRoutes = require('./settings.routes');
const couponRoutes = require('./coupon.routes');
const inventoryRoutes = require('./inventory.routes');
const customerRoutes = require('./customer.routes');
const reviewRoutes = require('./review.routes');
const auditRoutes = require('./audit.routes');
const dashboardRoutes = require('./dashboard.routes');

// Public / customer-facing
router.use('/auth', authRoutes);
router.use('/admin/auth', adminAuthRoutes);
router.use('/products', productRoutes.public);
router.use('/categories', categoryRoutes.public);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes.public);
router.use('/payments', paymentRoutes.public);
router.use('/tickets', ticketRoutes.public);
router.use('/notifications', notificationRoutes);
router.use('/homepage', homepageRoutes.public);
router.use('/settings', settingsRoutes.public);

// Admin operations (mounted under /api/admin/*)
router.use('/admin/products', productRoutes.admin);
router.use('/admin/categories', categoryRoutes.admin);
router.use('/admin/orders', orderRoutes.admin);
router.use('/admin/payments', paymentRoutes.admin);
router.use('/admin/tickets', ticketRoutes.admin);
router.use('/admin/homepage', homepageRoutes.admin);
router.use('/admin/settings', settingsRoutes.admin);
router.use('/admin/coupons', couponRoutes);
router.use('/admin/inventory', inventoryRoutes);
router.use('/admin/customers', customerRoutes);
router.use('/admin/reviews', reviewRoutes);
router.use('/admin/audit-logs', auditRoutes);
router.use('/admin', dashboardRoutes);

module.exports = router;
