const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/** Creates an in-app notification. Never throws. */
const notify = async ({ user, type = 'order', title, body = '', link = '' }) => {
  try {
    await Notification.create({ user, type, title, body, link });
  } catch (err) {
    logger.error(`Notification failed: ${err.message}`);
  }
};

module.exports = { notify };
