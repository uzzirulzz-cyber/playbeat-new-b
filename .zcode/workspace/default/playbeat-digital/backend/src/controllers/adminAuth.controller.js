const Admin = require('../models/Admin');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { signAdminToken } = require('../utils/token');
const { logAudit } = require('../middleware/audit');
const env = require('../config/env');

const issueToken = (admin, res) => {
  const token = signAdminToken(admin);
  res.cookie('pb_admin_token', token, {
    httpOnly: true,
    secure: env.isProd(),
    sameSite: env.isProd() ? 'none' : 'lax',
    maxAge: 12 * 60 * 60 * 1000,
  });
  return token;
};

const adminAuthController = {
  login: catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!admin || !(await admin.comparePassword(password))) {
      throw ApiError.unauthorized('Invalid credentials');
    }
    if (!admin.active) throw ApiError.forbidden('This admin account is disabled');

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = issueToken(admin, res);
    req.admin = admin;
    await logAudit({ req, action: 'admin.login', resource: 'admin', resourceId: admin._id });
    res.json({ success: true, data: { token, admin: admin.toSafeJSON() } });
  }),

  me: catchAsync(async (req, res) => {
    res.json({ success: true, data: req.admin.toSafeJSON() });
  }),

  logout: catchAsync(async (req, res) => {
    res.clearCookie('pb_admin_token');
    res.json({ success: true, message: 'Logged out' });
  }),

  changePassword: catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin._id).select('+passwordHash');
    if (!(await admin.comparePassword(currentPassword))) {
      throw ApiError.badRequest('Current password is incorrect');
    }
    await admin.setPassword(newPassword);
    admin.forcePasswordChange = false;
    await admin.save();
    res.json({ success: true, message: 'Password updated' });
  }),

  // ── Admin user management (superadmin only) ─────────────────────────────
  listAdmins: catchAsync(async (req, res) => {
    const admins = await Admin.find().sort({ createdAt: -1 });
    res.json({ success: true, data: admins.map((a) => a.toSafeJSON()) });
  }),

  createAdmin: catchAsync(async (req, res) => {
    const { name, email, password, role } = req.body;
    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) throw ApiError.conflict('An admin with this email already exists');

    const admin = new Admin({ name, email, role, forcePasswordChange: true });
    await admin.setPassword(password);
    await admin.save();

    await logAudit({ req, action: 'admin.create', resource: 'admin', resourceId: admin._id, meta: { role } });
    res.status(201).json({ success: true, data: admin.toSafeJSON() });
  }),

  updateAdmin: catchAsync(async (req, res) => {
    const { role, active, name } = req.body;
    const admin = await Admin.findById(req.params.id);
    if (!admin) throw ApiError.notFound('Admin not found');
    if (admin._id.toString() === req.admin._id.toString() && active === false) {
      throw ApiError.badRequest('You cannot disable your own account');
    }
    if (role !== undefined) admin.role = role;
    if (active !== undefined) admin.active = active;
    if (name !== undefined) admin.name = name;
    await admin.save();

    await logAudit({ req, action: 'admin.update', resource: 'admin', resourceId: admin._id, meta: { role, active } });
    res.json({ success: true, data: admin.toSafeJSON() });
  }),
};

module.exports = adminAuthController;
