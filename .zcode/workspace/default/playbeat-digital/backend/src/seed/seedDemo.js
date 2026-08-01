/**
 * Demo content seeder for local development / first launch.
 * Creates categories, products (with variants), homepage sections, a demo
 * coupon and default site settings so the storefront renders real content
 * driven entirely from the API. Run with: npm run seed:demo
 */
require('../config/env');
const connectDB = require('../config/db');
const ProductCategory = require('../models/ProductCategory');
const Product = require('../models/Product');
const HomepageSection = require('../models/HomepageSection');
const SiteSettings = require('../models/SiteSettings');
const Coupon = require('../models/Coupon');
const slugify = require('../utils/slugify');
const inventoryService = require('../services/inventory.service');

const IMG = (seed) => `https://picsum.photos/seed/${seed}/800/600`;

const CATEGORIES = [
  { name: 'Gaming Accounts', icon: 'gamepad', featured: true },
  { name: 'Game Currency', icon: 'coins', featured: true },
  { name: 'Game Items', icon: 'shield', featured: true },
  { name: 'Gift Cards', icon: 'gift', featured: true },
  { name: 'Software & SaaS', icon: 'terminal', featured: true },
  { name: 'Social Media Services', icon: 'users', featured: true },
  { name: 'Web Hosting', icon: 'server', featured: true },
  { name: 'Digital Marketing', icon: 'megaphone', featured: true },
  { name: 'Web3', icon: 'cube', featured: true },
  { name: 'Business Services', icon: 'briefcase', featured: true },
];

const PRODUCTS = [
  {
    name: 'Amazon Prime Video Subscription',
    shortDescription: 'Stream thousands of movies and shows in HD/4K.',
    category: 'Software & SaaS',
    price: 0,
    featured: true,
    trending: true,
    variants: [
      { name: '3 Months', price: 14.99, deliveryMethod: 'instant' },
      { name: '6 Months', price: 26.99, salePrice: 29.99, deliveryMethod: 'instant' },
      { name: '1 Year', price: 44.99, salePrice: 59.99, deliveryMethod: 'instant' },
    ],
    type: 'license_key',
    payloads: ['PRIME-XXXX-2024-3M', 'PRIME-XXXX-2024-6M', 'PRIME-XXXX-2024-1Y'],
  },
  {
    name: 'Steam Gift Card',
    shortDescription: 'Redeem for games, software and in-game items.',
    category: 'Gift Cards',
    price: 0,
    featured: true,
    trending: true,
    variants: [
      { name: '$20', price: 19.5 },
      { name: '$50', price: 48.5 },
      { name: '$100', price: 96.0 },
    ],
    type: 'activation_code',
    payloads: ['STEAM-CODE-20-AAA', 'STEAM-CODE-50-BBB', 'STEAM-CODE-100-CCC'],
  },
  {
    name: 'Netflix Premium 4K',
    shortDescription: 'Ultra HD streaming on 4 devices at once.',
    category: 'Software & SaaS',
    price: 16.99,
    trending: true,
    type: 'account',
    payloads: ['netflix@email.com:password123'],
  },
  {
    name: 'Fortnite V-Bucks',
    shortDescription: 'In-game currency for skins, emotes and battle passes.',
    category: 'Game Currency',
    price: 0,
    featured: true,
    variants: [
      { name: '1,000 V-Bucks', price: 7.99 },
      { name: '2,800 V-Bucks', price: 19.99, salePrice: 24.99 },
      { name: '13,500 V-Bucks', price: 79.99 },
    ],
    type: 'activation_code',
    payloads: ['VB-1000-AAA', 'VB-2800-BBB', 'VB-13500-CCC'],
  },
  {
    name: 'Managed WordPress Hosting',
    shortDescription: 'Fast, secure, SSD-backed hosting with free SSL & CDN.',
    category: 'Web Hosting',
    price: 9.99,
    salePrice: 14.99,
    featured: true,
    deliveryType: 'manual',
    type: 'manual',
    payloads: [],
  },
  {
    name: 'Instagram Growth Package',
    shortDescription: 'Real, targeted follower growth over 30 days.',
    category: 'Social Media Services',
    price: 49.99,
    trending: true,
    deliveryType: 'manual',
    type: 'manual',
    payloads: [],
  },
  {
    name: 'Adobe Creative Cloud All Apps',
    shortDescription: 'Photoshop, Illustrator, Premiere Pro and 20+ apps.',
    category: 'Software & SaaS',
    price: 39.99,
    salePrice: 54.99,
    featured: true,
    type: 'license_key',
    payloads: ['ADOBE-CC-2024-LICENSE'],
  },
  {
    name: 'Crypto Wallet Setup & Audit',
    shortDescription: 'Secure hardware-backed wallet configuration by experts.',
    category: 'Web3',
    price: 99.0,
    deliveryType: 'manual',
    type: 'manual',
    payloads: [],
  },
];

const SECTIONS = [
  {
    type: 'hero',
    title: 'PlayBeat Digital',
    enabled: true,
    order: 0,
    config: {
      heading: 'Your Digital World. One Powerful Marketplace.',
      subheading: 'Discover premium digital products, subscriptions, software, gaming, hosting, marketing services and more.',
      backgroundImage: IMG('hero'),
      primaryCta: { label: 'Explore Products', link: '/products' },
      secondaryCta: { label: 'Browse Categories', link: '/categories' },
    },
  },
  { type: 'trending', title: 'Trending Now', subtitle: 'Hot picks loved by our community', order: 1, config: { limit: 8 } },
  { type: 'featured_categories', title: 'Featured Categories', order: 2, config: {} },
  { type: 'featured_products', title: 'Featured Products', subtitle: 'Hand-picked premium deals', order: 3, config: { limit: 8 } },
  {
    type: 'banner',
    order: 4,
    config: {
      image: IMG('banner'),
      heading: 'Instant Digital Delivery',
      body: 'Most orders delivered automatically within seconds of payment.',
      buttonText: 'Shop now',
      link: '/products',
    },
  },
  {
    type: 'testimonials',
    title: 'What customers say',
    order: 5,
    config: {
      items: [
        { name: 'Alex M.', role: 'Gamer', quote: 'Got my game key instantly. Best price around!', rating: 5 },
        { name: 'Priya S.', role: 'Founder', quote: 'The hosting setup was painless and fast.', rating: 5 },
        { name: 'Diego R.', role: 'Creator', quote: 'Reliable software licenses at great prices.', rating: 4 },
      ],
    },
  },
  {
    type: 'faq',
    title: 'Frequently Asked Questions',
    order: 6,
    config: {
      items: [
        { question: 'How fast is delivery?', answer: 'Instant-delivery items arrive seconds after payment is confirmed. Manual items are handled by our team.' },
        { question: 'Which payment methods are supported?', answer: 'Stripe, Lemon Squeezy and manual bank transfer — configurable from the admin panel.' },
        { question: 'Are my digital products safe?', answer: 'Yes — credentials are encrypted at rest and only revealed to you after purchase.' },
      ],
    },
  },
];

const run = async () => {
  await connectDB();
  console.log('[seed:demo] Seeding categories...');
  const categoryMap = {};
  for (const c of CATEGORIES) {
    const doc = await ProductCategory.findOneAndUpdate(
      { slug: slugify(c.name) },
      { $set: { ...c, status: 'active' } },
      { new: true, upsert: true }
    );
    categoryMap[c.name] = doc;
  }

  console.log('[seed:demo] Seeding products + inventory...');
  await Product.deleteMany({});
  for (const p of PRODUCTS) {
    const category = categoryMap[p.category];
    const product = await Product.create({
      name: p.name,
      slug: slugify(p.name),
      shortDescription: p.shortDescription,
      category: category._id,
      price: p.price || p.variants?.[0]?.price || 9.99,
      salePrice: p.salePrice ?? null,
      images: [IMG(slugify(p.name))],
      status: 'active',
      featured: !!p.featured,
      trending: !!p.trending,
      productType: 'digital',
      deliveryType: p.deliveryType || 'instant',
      unlimitedStock: false,
      stockQuantity: 5,
      variants: p.variants || [],
      tags: [category.slug],
      description: p.shortDescription,
    });

    // Pre-load sample digital inventory for instant-delivery variants.
    if (p.deliveryType !== 'manual' && p.payloads?.length) {
      for (const variant of product.variants) {
        await inventoryService.addItems({
          productId: product._id,
          variantName: variant.name,
          type: p.type,
          payloads: p.payloads,
          batchId: 'demo',
        });
        variant.stockQuantity = p.payloads.length;
      }
      await product.save();
    } else if (p.deliveryType !== 'manual' && p.payloads?.length) {
      await inventoryService.addItems({
        productId: product._id,
        variantName: '',
        type: p.type,
        payloads: p.payloads,
        batchId: 'demo',
      });
    }
  }

  console.log('[seed:demo] Seeding homepage sections...');
  await HomepageSection.deleteMany({});
  await HomepageSection.insertMany(SECTIONS);

  console.log('[seed:demo] Seeding settings + coupon...');
  const settings = await SiteSettings.getSite();
  settings.set({
    contactEmail: 'support@playbeat.digital',
    supportEmail: 'support@playbeat.digital',
    payments: {
      stripeEnabled: false,
      lemonSqueezyEnabled: false,
      manualEnabled: true,
      manualLabel: 'Bank Transfer / Manual Payment',
      manualInstructions: 'Transfer the total to the bank details shown and contact support with your order number.',
    },
    announcements: { enabled: true, message: '🎉 Welcome to PlayBeat Digital — instant digital delivery!' },
  });
  await settings.save();

  await Coupon.findOneAndUpdate(
    { code: 'WELCOME10' },
    { $set: { type: 'percent', value: 10, active: true, usageLimit: 1000, description: '10% off your first order' } },
    { upsert: true, new: true }
  );

  console.log('\n[seed:demo] Done. Login at /admin with your seeded super admin.\n');
  process.exit(0);
};

run().catch((err) => {
  console.error('[seed:demo] Failed:', err);
  process.exit(1);
});
