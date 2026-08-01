const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { verifyAdminToken } = require('../utils/token');
const Admin = require('../models/Admin');

/**
 * Granular role -> permission map. Backend enforcement is authoritative —
 * frontend role checks are only for UI convenience.
 * superadmin: everything. admin: full operations. manager: catalog +
 * inventory + orders. support: tickets + customers.
 */
const ROLE_PERMISSIONS = {
  superadmin: ['*'],
  admin: [
    'dashboard', 'analytics', 'products', 'categories', 'inventory', 'orders',
    'customers', 'payments', 'coupons', 'homepage', 'tickets', 'settings',
    'reviews', 'audit',
  ],
  manager: ['dashboard', 'products', 'categories', 'inventory', 'orders'],
  support: ['dashboard', 'tickets', 'customers', 'orders'],
};

const extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies?.pb_admin_token) return req.cookies.pb_admin_token;
  return null;
};

/** Require an authenticated admin (any role). */
const adminProtect = catchAsync(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Admin authentication required');

  let payload;
  try {
    payload = verifyAdminToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired admin session');
  }

  const admin = await Admin.findById(payload.sub);
  if (!admin || !admin.active) throw ApiError.unauthorized('Admin account unavailable');

  req.admin = admin;
  next();
});

/** Require one of the given permissions, e.g. permit('products'), permit('orders','payments'). */
const permit = (...resources) => (req, res, next) => {
  const admin = req.admin;
  if (!admin) return next(ApiError.unauthorized('Admin authentication required'));
  const allowed = ROLE_PERMISSIONS[admin.role] || [];
  if (allowed.includes('*')) return next();
  const ok = resources.some((resource) => allowed.includes(resource));
  if (!ok) return next(ApiError.forbidden('Insufficient permissions'));
  return next();
};

module.exports = { adminProtect, permit, ROLE_PERMISSIONS };
