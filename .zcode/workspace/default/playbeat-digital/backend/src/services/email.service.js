const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Configurable transactional email. If SMTP is not configured the email is
 * logged instead of sent, so development works without a mail provider.
 */
let transporter = null;
const getTransporter = () => {
  if (transporter) return transporter;
  if (!env.email.host || !env.email.user) return null;
  transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.port === 465,
    auth: { user: env.email.user, pass: env.email.pass },
  });
  return transporter;
};

const layout = (title, bodyHtml) => `
  <div style="background:#0a0f1e;padding:32px;font-family:Inter,Arial,sans-serif;color:#e5e7eb">
    <div style="max-width:560px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:16px;overflow:hidden">
      <div style="padding:20px 28px;border-bottom:1px solid #1f2937">
        <span style="font-size:20px;font-weight:800;color:#3b82f6">PLAYBEAT</span>
        <span style="font-size:20px;font-weight:800;color:#f59e0b">.DIGITAL</span>
      </div>
      <div style="padding:28px">
        <h1 style="margin:0 0 16px;font-size:20px;color:#f9fafb">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:16px 28px;border-top:1px solid #1f2937;font-size:12px;color:#6b7280">
        PlayBeat Digital — Your Digital World. One Powerful Marketplace.
      </div>
    </div>
  </div>`;

const sendMail = async ({ to, subject, title, html }) => {
  const tx = getTransporter();
  const finalHtml = layout(title, html);
  if (!tx) {
    logger.info(`[email:disabled] To: ${to} | Subject: ${subject}`);
    return { delivered: false, reason: 'smtp-not-configured' };
  }
  await tx.sendMail({ from: env.email.from, to, subject, html: finalHtml });
  return { delivered: true };
};

const assetBlock = (assets) =>
  `<div style="background:#0b1220;border:1px solid #1f2937;border-radius:12px;padding:16px;margin:16px 0">` +
  assets
    .map(
      (a) =>
        `<div style="margin:8px 0"><div style="font-size:12px;color:#9ca3af;text-transform:uppercase">${a.label || a.type}</div>
         <div style="font-family:monospace;font-size:14px;color:#fbbf24;word-break:break-all">${a.payload}</div></div>`
    )
    .join('') +
  `</div>`;

const emails = {
  welcome: (user) =>
    sendMail({
      to: user.email,
      subject: 'Welcome to PlayBeat Digital',
      title: `Welcome, ${user.name}!`,
      html: `<p>Your account is ready. Explore premium digital products, software, gaming, hosting and more.</p>
             <p><a href="${env.clientUrl}/products" style="color:#3b82f6">Start exploring →</a></p>`,
    }),

  verifyEmail: (user, token) =>
    sendMail({
      to: user.email,
      subject: 'Verify your PlayBeat Digital email',
      title: 'Verify your email address',
      html: `<p>Click the link below to verify your email:</p>
             <p><a href="${env.clientUrl}/verify-email/${token}" style="color:#3b82f6">Verify email</a></p>`,
    }),

  passwordReset: (user, token) =>
    sendMail({
      to: user.email,
      subject: 'Reset your PlayBeat Digital password',
      title: 'Password reset requested',
      html: `<p>We received a request to reset your password. This link expires in 1 hour.</p>
             <p><a href="${env.clientUrl}/reset-password/${token}" style="color:#3b82f6">Reset password</a></p>
             <p style="color:#9ca3af;font-size:13px">If you did not request this, you can ignore this email.</p>`,
    }),

  orderConfirmation: (user, order) =>
    sendMail({
      to: user.email,
      subject: `Order ${order.orderNumber} confirmed`,
      title: 'Order confirmation',
      html: `<p>Thanks for your order <strong>${order.orderNumber}</strong>.</p>
             <p>Total: <strong>${order.currency} ${order.total.toFixed(2)}</strong></p>
             <p><a href="${env.clientUrl}/account/orders/${order._id}" style="color:#3b82f6">View order →</a></p>`,
    }),

  digitalDelivery: (user, order, assets) =>
    sendMail({
      to: user.email,
      subject: `Your digital products — ${order.orderNumber}`,
      title: 'Your digital delivery is ready',
      html: `<p>Your order <strong>${order.orderNumber}</strong> has been delivered:</p>
             ${assetBlock(assets)}
             <p style="color:#9ca3af;font-size:13px">You can always access these from your account:
             <a href="${env.clientUrl}/account/downloads" style="color:#3b82f6">My downloads</a></p>`,
    }),

  manualPaymentInstructions: (user, order, instructions) =>
    sendMail({
      to: user.email,
      subject: `Payment instructions — ${order.orderNumber}`,
      title: 'Complete your payment',
      html: `<p>Your order <strong>${order.orderNumber}</strong> is awaiting payment of
             <strong>${order.currency} ${order.total.toFixed(2)}</strong>.</p>
             <p>${instructions || 'Please follow the payment instructions shown at checkout.'}</p>
             <p style="color:#9ca3af;font-size:13px">Your order will be delivered once payment is verified.</p>`,
    }),

  refund: (user, order) =>
    sendMail({
      to: user.email,
      subject: `Refund processed — ${order.orderNumber}`,
      title: 'Your refund has been processed',
      html: `<p>Order <strong>${order.orderNumber}</strong> (${order.currency} ${order.total.toFixed(2)}) has been refunded.</p>`,
    }),

  ticketUpdate: (user, ticket) =>
    sendMail({
      to: user.email,
      subject: `Ticket ${ticket.ticketNumber} updated`,
      title: 'Support ticket update',
      html: `<p>Your ticket <strong>${ticket.ticketNumber}</strong> (${ticket.subject}) is now
             <strong>${ticket.status.replace('_', ' ')}</strong>.</p>
             <p><a href="${env.clientUrl}/account/tickets/${ticket._id}" style="color:#3b82f6">View ticket →</a></p>`,
    }),
};

module.exports = { sendMail, emails };
