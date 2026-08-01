/**
 * Shared domain constants for PlayBeat Digital.
 * Backend imports this file directly; the frontend keeps a mirrored ESM copy
 * in frontend/src/lib/constants.js (Vite cannot import outside its root).
 */

const ORDER_STATUS = [
  'pending',
  'payment_pending',
  'paid',
  'processing',
  'delivered',
  'completed',
  'cancelled',
  'refunded',
  'failed',
];

const PAYMENT_STATUS = ['pending', 'created', 'succeeded', 'failed', 'refunded', 'expired'];

const PAYMENT_METHODS = ['stripe', 'lemonsqueezy', 'manual'];

const INVENTORY_STATUS = ['available', 'reserved', 'sold', 'expired', 'disabled'];

const INVENTORY_TYPES = [
  'license_key',
  'activation_code',
  'account',
  'credentials',
  'download_link',
  'digital_file',
  'manual',
];

const TICKET_STATUS = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
const TICKET_PRIORITY = ['low', 'medium', 'high', 'urgent'];
const TICKET_CATEGORIES = [
  'order',
  'payment',
  'delivery',
  'account',
  'product',
  'refund',
  'other',
];

const ADMIN_ROLES = ['superadmin', 'admin', 'manager', 'support'];

const PRODUCT_STATUS = ['draft', 'active', 'archived'];
const PRODUCT_TYPES = ['digital', 'physical'];
const DELIVERY_TYPES = ['instant', 'manual'];

const COUPON_TYPES = ['percent', 'fixed'];

const HOMEPAGE_SECTION_TYPES = [
  'hero',
  'trending',
  'featured_categories',
  'featured_products',
  'banner',
  'testimonials',
  'faq',
  'custom_html',
];

module.exports = {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  INVENTORY_STATUS,
  INVENTORY_TYPES,
  TICKET_STATUS,
  TICKET_PRIORITY,
  TICKET_CATEGORIES,
  ADMIN_ROLES,
  PRODUCT_STATUS,
  PRODUCT_TYPES,
  DELIVERY_TYPES,
  COUPON_TYPES,
  HOMEPAGE_SECTION_TYPES,
};
