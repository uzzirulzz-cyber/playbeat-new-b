const { body, param } = require('express-validator');
const {
  PAYMENT_METHODS,
  INVENTORY_TYPES,
  INVENTORY_STATUS,
  ORDER_STATUS,
  TICKET_CATEGORIES,
  TICKET_STATUS,
  TICKET_PRIORITY,
  COUPON_TYPES,
  HOMEPAGE_SECTION_TYPES,
  ADMIN_ROLES,
  PRODUCT_STATUS,
  PRODUCT_TYPES,
  DELIVERY_TYPES,
} = require('../../../shared/constants');

const rules = {
  register: [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  login: [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  forgotPassword: [body('email').isEmail().normalizeEmail()],
  resetPassword: [
    param('token').notEmpty(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  changePassword: [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],

  product: [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('category').isMongoId().withMessage('Valid category is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('salePrice').optional({ nullable: true }).isFloat({ min: 0 }),
    body('status').optional().isIn(PRODUCT_STATUS),
    body('productType').optional().isIn(PRODUCT_TYPES),
    body('deliveryType').optional().isIn(DELIVERY_TYPES),
    body('images').optional().isArray(),
    body('tags').optional().isArray(),
    body('variants').optional().isArray(),
    body('variants.*.name').optional().trim().notEmpty(),
    body('variants.*.price').optional().isFloat({ min: 0 }),
  ],
  category: [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('order').optional().isInt(),
    body('featured').optional().isBoolean(),
  ],

  cartAdd: [
    body('productId').isMongoId().withMessage('Valid productId is required'),
    body('variantId').optional({ nullable: true }).isMongoId(),
    body('qty').optional().isInt({ min: 1, max: 99 }),
  ],
  cartUpdate: [body('qty').isInt({ min: 1, max: 99 }).withMessage('Quantity must be 1-99')],
  coupon: [body('code').trim().notEmpty().withMessage('Coupon code is required')],

  orderCreate: [
    body('paymentMethod').isIn(PAYMENT_METHODS).withMessage('Invalid payment method'),
    body('customerInfo').optional().isObject(),
  ],
  orderStatus: [body('status').isIn(ORDER_STATUS).withMessage('Invalid order status')],
  note: [body('text').trim().notEmpty().withMessage('Note text is required')],

  inventoryItem: [
    body('productId').isMongoId(),
    body('type').isIn(INVENTORY_TYPES).withMessage('Invalid inventory type'),
    body('payload').notEmpty().withMessage('Payload is required'),
    body('variantName').optional().trim(),
  ],
  inventoryBulk: [
    body('productId').isMongoId(),
    body('type').isIn(INVENTORY_TYPES),
    body('payloads').isArray({ min: 1, max: 2000 }).withMessage('payloads must be an array of 1-2000 entries'),
  ],
  inventoryUpdate: [
    body('status').optional().isIn(INVENTORY_STATUS),
    body('label').optional().trim(),
    body('note').optional().trim(),
  ],

  ticket: [
    body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 200 }),
    body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 5000 }),
    body('category').optional().isIn(TICKET_CATEGORIES),
    body('orderId').optional({ nullable: true }).isMongoId(),
  ],
  ticketReply: [body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 5000 })],
  ticketUpdate: [
    body('status').optional().isIn(TICKET_STATUS),
    body('priority').optional().isIn(TICKET_PRIORITY),
    body('assignee').optional({ nullable: true }).isMongoId(),
  ],

  review: [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('title').optional().trim().isLength({ max: 200 }),
    body('comment').optional().trim().isLength({ max: 2000 }),
  ],

  couponAdmin: [
    body('code').trim().notEmpty().withMessage('Code is required'),
    body('type').isIn(COUPON_TYPES).withMessage('Invalid coupon type'),
    body('value').isFloat({ min: 0 }).withMessage('Value must be positive'),
    body('usageLimit').optional({ nullable: true }).isInt({ min: 1 }),
    body('minSubtotal').optional().isFloat({ min: 0 }),
  ],

  homepageSection: [
    body('type').isIn(HOMEPAGE_SECTION_TYPES).withMessage('Invalid section type'),
    body('title').optional().trim().isLength({ max: 200 }),
    body('config').optional().isObject(),
  ],
  reorder: [body('orderedIds').isArray({ min: 1 }).withMessage('orderedIds array required')],

  adminCreate: [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 10 }).withMessage('Admin password must be at least 10 characters'),
    body('role').isIn(ADMIN_ROLES).withMessage('Invalid role'),
  ],
  adminUpdate: [
    body('role').optional().isIn(ADMIN_ROLES),
    body('active').optional().isBoolean(),
  ],
};

module.exports = rules;
