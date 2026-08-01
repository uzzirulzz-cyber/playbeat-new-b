const Counter = require('../models/Counter');

const pad = (n, width = 5) => String(n).padStart(width, '0');

const nextOrderNumber = async () => {
  const seq = await Counter.next('order');
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `ORD-${ymd}-${pad(seq)}`;
};

const nextTicketNumber = async () => {
  const seq = await Counter.next('ticket');
  return `TKT-${pad(seq)}`;
};

module.exports = { nextOrderNumber, nextTicketNumber };
