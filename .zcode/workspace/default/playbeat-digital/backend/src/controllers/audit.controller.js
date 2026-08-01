const AuditLog = require('../models/AuditLog');
const catchAsync = require('../utils/catchAsync');

const auditController = {
  list: catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.action) filter.action = { $regex: req.query.action, $options: 'i' };
    if (req.query.resource) filter.resource = req.query.resource;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('admin', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);
    res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  }),
};

module.exports = auditController;
