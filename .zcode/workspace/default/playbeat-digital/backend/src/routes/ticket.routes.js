const express = require('express');
const ticketController = require('../controllers/ticket.controller');
const { protect } = require('../middleware/auth');
const { adminProtect, permit } = require('../middleware/adminAuth');
const validate = require('../middleware/validate');
const rules = require('../validators');

const router = express.Router();

// Customer
router.use(protect);
router.post('/', rules.ticket, validate, ticketController.create);
router.get('/', ticketController.myTickets);
router.get('/:id', ticketController.myTicket);
router.post('/:id/reply', rules.ticketReply, validate, ticketController.reply);
router.post('/:id/close', ticketController.close);

// Admin (mounted under /api/admin/tickets)
const adminRouter = express.Router();
adminRouter.use(adminProtect, permit('tickets'));
adminRouter.get('/', ticketController.adminList);
adminRouter.get('/:id', ticketController.adminGet);
adminRouter.post('/:id/reply', rules.ticketReply, validate, ticketController.adminReply);
adminRouter.put('/:id', rules.ticketUpdate, validate, ticketController.adminUpdate);

module.exports = { public: router, admin: adminRouter };
