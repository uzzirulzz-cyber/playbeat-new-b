const CustomerTicket = require('../models/CustomerTicket');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { nextTicketNumber } = require('../utils/numbering');
const { emails } = require('../services/email.service');
const { notify } = require('../services/notify.service');
const { logAudit } = require('../middleware/audit');

const sanitizeMessages = (ticket, isAdmin) => {
  const obj = ticket.toObject();
  if (!isAdmin) obj.messages = obj.messages.filter((m) => !m.internal);
  return obj;
};

const ticketController = {
  // ── Customer ──────────────────────────────────────────────────────────────
  create: catchAsync(async (req, res) => {
    const { category, subject, message, orderId = null, attachments = [] } = req.body;
    const ticket = await CustomerTicket.create({
      ticketNumber: await nextTicketNumber(),
      user: req.user._id,
      order: orderId,
      category,
      subject,
      messages: [
        {
          senderType: 'customer',
          sender: req.user._id,
          senderName: req.user.name,
          body: message,
          attachments: attachments.slice(0, 5),
        },
      ],
    });
    res.status(201).json({ success: true, data: sanitizeMessages(ticket, false) });
  }),

  myTickets: catchAsync(async (req, res) => {
    const tickets = await CustomerTicket.find({ user: req.user._id })
      .select('-messages')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: tickets });
  }),

  myTicket: catchAsync(async (req, res) => {
    const ticket = await CustomerTicket.findOne({ _id: req.params.id, user: req.user._id });
    if (!ticket) throw ApiError.notFound('Ticket not found');
    res.json({ success: true, data: sanitizeMessages(ticket, false) });
  }),

  reply: catchAsync(async (req, res) => {
    const ticket = await CustomerTicket.findOne({ _id: req.params.id, user: req.user._id });
    if (!ticket) throw ApiError.notFound('Ticket not found');
    if (ticket.status === 'closed') throw ApiError.badRequest('This ticket is closed');

    ticket.messages.push({
      senderType: 'customer',
      sender: req.user._id,
      senderName: req.user.name,
      body: req.body.message,
      attachments: (req.body.attachments || []).slice(0, 5),
    });
    if (['resolved', 'waiting'].includes(ticket.status)) ticket.status = 'open';
    await ticket.save();
    res.json({ success: true, data: sanitizeMessages(ticket, false) });
  }),

  close: catchAsync(async (req, res) => {
    const ticket = await CustomerTicket.findOne({ _id: req.params.id, user: req.user._id });
    if (!ticket) throw ApiError.notFound('Ticket not found');
    ticket.status = 'closed';
    ticket.closedAt = new Date();
    await ticket.save();
    res.json({ success: true, data: sanitizeMessages(ticket, false) });
  }),

  // ── Admin ─────────────────────────────────────────────────────────────────
  adminList: catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.q) {
      filter.$or = [
        { ticketNumber: { $regex: req.query.q, $options: 'i' } },
        { subject: { $regex: req.query.q, $options: 'i' } },
      ];
    }
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const [items, total] = await Promise.all([
      CustomerTicket.find(filter)
        .populate('user', 'name email')
        .populate('assignee', 'name email')
        .select('-messages')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      CustomerTicket.countDocuments(filter),
    ]);
    res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  }),

  adminGet: catchAsync(async (req, res) => {
    const ticket = await CustomerTicket.findById(req.params.id)
      .populate('user', 'name email')
      .populate('assignee', 'name email')
      .populate('order', 'orderNumber status total');
    if (!ticket) throw ApiError.notFound('Ticket not found');
    res.json({ success: true, data: sanitizeMessages(ticket, true) });
  }),

  adminReply: catchAsync(async (req, res) => {
    const { message, internal = false } = req.body;
    const ticket = await CustomerTicket.findById(req.params.id).populate('user');
    if (!ticket) throw ApiError.notFound('Ticket not found');

    ticket.messages.push({
      senderType: 'admin',
      sender: req.admin._id,
      senderName: req.admin.name,
      body: message,
      internal,
    });
    if (!internal && ticket.status === 'open') ticket.status = 'in_progress';
    await ticket.save();

    if (!internal) {
      await notify({
        user: ticket.user._id,
        type: 'ticket',
        title: `New reply on ${ticket.ticketNumber}`,
        body: ticket.subject,
        link: `/account/tickets/${ticket._id}`,
      });
      await emails.ticketUpdate(ticket.user, ticket).catch(() => {});
    }
    res.json({ success: true, data: sanitizeMessages(ticket, true) });
  }),

  adminUpdate: catchAsync(async (req, res) => {
    const { status, priority, assignee } = req.body;
    const ticket = await CustomerTicket.findById(req.params.id).populate('user');
    if (!ticket) throw ApiError.notFound('Ticket not found');

    if (status !== undefined) {
      ticket.status = status;
      if (['closed', 'resolved'].includes(status)) ticket.closedAt = new Date();
    }
    if (priority !== undefined) ticket.priority = priority;
    if (assignee !== undefined) ticket.assignee = assignee || null;
    await ticket.save();

    if (status !== undefined) {
      await notify({
        user: ticket.user._id,
        type: 'ticket',
        title: `Ticket ${ticket.ticketNumber} is now ${status.replace('_', ' ')}`,
        body: ticket.subject,
        link: `/account/tickets/${ticket._id}`,
      });
      await emails.ticketUpdate(ticket.user, ticket).catch(() => {});
    }
    await logAudit({ req, action: 'ticket.update', resource: 'ticket', resourceId: ticket._id, meta: { status, priority } });
    res.json({ success: true, data: sanitizeMessages(ticket, true) });
  }),
};

module.exports = ticketController;
