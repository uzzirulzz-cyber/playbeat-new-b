const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const json = (req, res) => {
  res.status(429).json({ success: false, message: 'Too many requests, please try again later' });
};

/** Global API limiter. */
const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json,
});

/** Stricter limiter for credential endpoints (login / register / reset). */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json,
  skipSuccessfulRequests: true,
});

module.exports = { apiLimiter, authLimiter };
