const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const notificationController = {
  list: catchAsync(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unread = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ success: true, data: notifications, unread });
  }),

  markRead: catchAsync(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) throw ApiError.notFound('Notification not found');
    res.json({ success: true, data: notification });
  }),

  markAllRead: catchAsync(async (req, res) => {
    await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
    res.json({ success: true, message: 'All notifications marked as read' });
  }),
};

module.exports = notificationController;
