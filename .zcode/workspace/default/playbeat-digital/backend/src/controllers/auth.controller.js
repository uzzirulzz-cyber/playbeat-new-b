const crypto = require('crypto');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { signCustomerToken } = require('../utils/token');
const { randomToken } = require('../utils/crypto');
const { emails } = require('../services/email.service');
const env = require('../config/env');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const issueToken = (user, res) => {
  const token = signCustomerToken(user);
  res.cookie('pb_token', token, {
    httpOnly: true,
    secure: env.isProd(),
    sameSite: env.isProd() ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
};

const authController = {
  register: catchAsync(async (req, res) => {
    const { name, email, phone = '', password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw ApiError.conflict('An account with this email already exists');

    const user = new User({ name, email, phone });
    await user.setPassword(password);
    user.verifyEmailToken = sha256(randomToken(24));
    await user.save();

    await emails.welcome(user).catch(() => {});
    await emails.verifyEmail(user, user.verifyEmailToken).catch(() => {});

    const token = issueToken(user, res);
    res.status(201).json({ success: true, data: { token, user: user.toSafeJSON() } });
  }),

  login: catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || !(await user.comparePassword(password))) {
      throw ApiError.unauthorized('Invalid email or password');
    }
    if (user.status === 'blocked') throw ApiError.forbidden('This account has been blocked');

    user.lastLoginAt = new Date();
    await user.save();

    const token = issueToken(user, res);
    res.json({ success: true, data: { token, user: user.toSafeJSON() } });
  }),

  logout: catchAsync(async (req, res) => {
    res.clearCookie('pb_token');
    res.json({ success: true, message: 'Logged out' });
  }),

  me: catchAsync(async (req, res) => {
    res.json({ success: true, data: req.user.toSafeJSON() });
  }),

  updateProfile: catchAsync(async (req, res) => {
    const { name, phone, addresses } = req.body;
    if (name !== undefined) req.user.name = name;
    if (phone !== undefined) req.user.phone = phone;
    if (Array.isArray(addresses)) req.user.addresses = addresses.slice(0, 10);
    await req.user.save();
    res.json({ success: true, data: req.user.toSafeJSON() });
  }),

  changePassword: catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await user.comparePassword(currentPassword))) {
      throw ApiError.badRequest('Current password is incorrect');
    }
    await user.setPassword(newPassword);
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  }),

  forgotPassword: catchAsync(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond identically to avoid account enumeration.
    if (user) {
      const token = randomToken(32);
      user.resetPasswordToken = sha256(token);
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      await emails.passwordReset(user, token).catch(() => {});
      if (!env.isProd()) {
        return res.json({ success: true, message: 'Reset link sent if the account exists', devToken: token });
      }
    }
    res.json({ success: true, message: 'Reset link sent if the account exists' });
  }),

  resetPassword: catchAsync(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: sha256(token),
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires +passwordHash');
    if (!user) throw ApiError.badRequest('Reset link is invalid or has expired');

    await user.setPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ success: true, message: 'Password has been reset' });
  }),

  verifyEmail: catchAsync(async (req, res) => {
    const { token } = req.params;
    const user = await User.findOne({ verifyEmailToken: token }).select('+verifyEmailToken');
    if (!user) throw ApiError.badRequest('Invalid verification link');
    user.emailVerified = true;
    user.verifyEmailToken = undefined;
    await user.save();
    res.json({ success: true, message: 'Email verified' });
  }),

  wishlist: catchAsync(async (req, res) => {
    await req.user.populate('wishlist', 'name slug price salePrice images ratings status');
    res.json({ success: true, data: req.user.wishlist });
  }),

  toggleWishlist: catchAsync(async (req, res) => {
    const { productId } = req.params;
    const idx = req.user.wishlist.findIndex((id) => id.toString() === productId);
    if (idx >= 0) req.user.wishlist.splice(idx, 1);
    else req.user.wishlist.push(productId);
    await req.user.save();
    res.json({ success: true, data: { wishlist: req.user.wishlist, added: idx < 0 } });
  }),
};

module.exports = authController;
