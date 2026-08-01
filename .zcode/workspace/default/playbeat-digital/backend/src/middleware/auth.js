const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { verifyCustomerToken } = require('../utils/token');
const User = require('../models/User');

const extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies?.pb_token) return req.cookies.pb_token;
  return null;
};

/** Require an authenticated customer. */
const protect = catchAsync(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Authentication required');

  let payload;
  try {
    payload = verifyCustomerToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired session');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (user.status === 'blocked') throw ApiError.forbidden('Account is blocked');

  req.user = user;
  next();
});

module.exports = { protect, extractToken };
