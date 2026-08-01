const mongoose = require('mongoose');
const { TICKET_STATUS, TICKET_PRIORITY, TICKET_CATEGORIES } = require('../../../shared/constants');

const messageSchema = new mongoose.Schema(
  {
    senderType: { type: String, enum: ['customer', 'admin'], required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderName: { type: String, default: '' },
    body: { type: String, required: true, maxlength: 5000 },
    attachments: [{ type: String }],
    internal: { type: Boolean, default: false },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    category: { type: String, enum: TICKET_CATEGORIES, default: 'other' },
    subject: { type: String, required: true, maxlength: 200 },
    status: { type: String, enum: TICKET_STATUS, default: 'open', index: true },
    priority: { type: String, enum: TICKET_PRIORITY, default: 'medium', index: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    messages: [messageSchema],
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });

module.exports = mongoose.model('CustomerTicket', ticketSchema);
