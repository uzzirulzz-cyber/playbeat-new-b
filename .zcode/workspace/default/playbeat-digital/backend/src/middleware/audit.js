const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Writes an audit trail entry for a sensitive action. Never throws — audit
 * failures must not break business operations.
 */
const logAudit = async ({ req, action, resource = '', resourceId = '', meta = {} }) => {
  try {
    await AuditLog.create({
      admin: req.admin?._id || null,
      adminEmail: req.admin?.email || 'system',
      action,
      resource,
      resourceId: resourceId ? String(resourceId) : '',
      meta,
      ip: req.ip || '',
    });
  } catch (err) {
    logger.error(`Audit log failed for ${action}: ${err.message}`);
  }
};

module.exports = { logAudit };
