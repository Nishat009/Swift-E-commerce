const nodemailer = require('nodemailer');

const BRAND = 'SwiftCart';
const GOLD = '#8b6f47';
const CREAM = '#faf9f6';

let transporter = null;
let warned = false;

const isConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!isConfigured()) {
    if (!warned) {
      warned = true;
      console.warn('[email] SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS) - emails are disabled. See backend/EMAIL.md');
    }
    return null;
  }
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const frontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3001').replace(/\/$/, '');
const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const template = ({ title, intro, body = '', button, footnote }) => `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM};font-family:Helvetica,Arial,sans-serif;color:#2b2622;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e8e2d6;">
<tr><td style="background:${GOLD};padding:22px 32px;text-align:center;"><span style="font-family:Georgia,'Times New Roman',serif;font-size:24px;letter-spacing:3px;color:#ffffff;text-transform:uppercase;">${BRAND}</span></td></tr>
<tr><td style="padding:36px 32px 28px;">
<h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:26px;margin:0 0 16px;color:${GOLD};">${esc(title)}</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${intro}</p>
${body}
${button ? `<p style="text-align:center;margin:28px 0 8px;"><a href="${esc(button.url)}" style="background:${GOLD};color:#ffffff;text-decoration:none;padding:13px 30px;font-size:13px;letter-spacing:2px;text-transform:uppercase;display:inline-block;">${esc(button.label)}</a></p>` : ''}
${footnote ? `<p style="font-size:12px;line-height:1.5;color:#7a7168;margin:24px 0 0;">${footnote}</p>` : ''}
</td></tr>
<tr><td style="background:${CREAM};padding:18px 32px;text-align:center;font-size:11px;color:#9a9086;border-top:1px solid #e8e2d6;">&copy; ${new Date().getFullYear()} ${BRAND}. This is an automated message.</td></tr>
</table></td></tr></table></body></html>`;

const codeBox = (code) => `<p style="text-align:center;margin:8px 0 20px;"><span style="font-family:Georgia,serif;font-size:34px;letter-spacing:8px;color:${GOLD};background:${CREAM};border:1px dashed ${GOLD};padding:12px 24px;display:inline-block;">${esc(code)}</span></p>`;

// Core sender: never throws, resolves true/false.
const sendEmail = async ({ to, subject, html, text, replyTo }) => {
  try {
    const t = getTransporter();
    if (!t || !to) return false;
    await t.sendMail({
      from: process.env.MAIL_FROM || `"${BRAND}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || subject,
      ...(replyTo ? { replyTo } : {}),
    });
    return true;
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}: ${err.message}`);
    return false;
  }
};

// Fire-and-forget wrapper so API responses never wait on SMTP.
const fire = (promise) => { Promise.resolve(promise).catch((e) => console.error('[email]', e.message)); };

const sendPasswordReset = (user, resetToken) => {
  const url = `${frontendUrl()}/auth/login?resetToken=${encodeURIComponent(resetToken)}`;
  return sendEmail({
    to: user.email,
    subject: `Reset your ${BRAND} password`,
    text: `Reset your password: ${url}\nReset code: ${resetToken}\nThis expires in 15 minutes.`,
    html: template({
      title: 'Reset your password',
      intro: `Hi ${esc(user.name)}, we received a request to reset your password. Click the button below, or paste the reset code on the reset form. It expires in 15 minutes.`,
      body: `<p style="font-size:12px;word-break:break-all;background:${CREAM};padding:10px;border:1px solid #e8e2d6;margin:0;">Reset code: <strong>${esc(resetToken)}</strong></p>`,
      button: { label: 'Reset password', url },
      footnote: 'If you did not request this, you can safely ignore this email.',
    }),
  });
};

const sendLoginOtp = (user, otp) => sendEmail({
  to: user.email,
  subject: `Your ${BRAND} login code`,
  text: `Your login code is ${otp}. It expires in 5 minutes.`,
  html: template({
    title: 'Your login code',
    intro: `Hi ${esc(user.name)}, use this code to sign in. It expires in 5 minutes.`,
    body: codeBox(otp),
    footnote: 'If you did not try to sign in, please ignore this email.',
  }),
});

const sendWelcome = (user) => sendEmail({
  to: user.email,
  subject: `Welcome to ${BRAND}`,
  text: `Welcome to ${BRAND}, ${user.name}!`,
  html: template({
    title: `Welcome, ${esc(user.name)}`,
    intro: 'Your account is ready. Discover the latest collections, build your wishlist and try outfits in our dressing room.',
    button: { label: 'Start shopping', url: `${frontendUrl()}/products` },
  }),
});

const sendNewsletterConfirmation = (email) => sendEmail({
  to: email,
  subject: `You're subscribed to ${BRAND}`,
  text: `Thanks for subscribing to the ${BRAND} newsletter.`,
  html: template({
    title: 'Thanks for subscribing',
    intro: 'You will now receive news on new arrivals, exclusive offers and style notes.',
    button: { label: 'Browse the shop', url: `${frontendUrl()}/products` },
  }),
});

const itemsTable = (order) => {
  const rows = (order.products || []).map((it) => {
    const name = it.product?.name || it.name || 'Item';
    return `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;">${esc(name)} &times; ${esc(it.quantity)}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;">${money(it.price * it.quantity)}</td></tr>`;
  }).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
<tr><td style="padding:8px 0;font-size:13px;color:#7a7168;">Shipping</td><td align="right" style="font-size:13px;color:#7a7168;">${money(order.shipping)}</td></tr>
<tr><td style="padding:8px 0;font-size:13px;color:#7a7168;">Tax</td><td align="right" style="font-size:13px;color:#7a7168;">${money(order.tax)}</td></tr>
<tr><td style="padding:10px 0;font-family:Georgia,serif;font-size:18px;color:${GOLD};">Total</td><td align="right" style="font-family:Georgia,serif;font-size:18px;color:${GOLD};">${money(order.total)}</td></tr></table>`;
};

const sendOrderConfirmation = (user, order) => sendEmail({
  to: user.email,
  subject: `Order ${order.orderNumber} confirmed`,
  text: `Thank you for your order ${order.orderNumber}. Total: ${money(order.total)}.`,
  html: template({
    title: 'Thank you for your order',
    intro: `Hi ${esc(user.name)}, we have received order <strong>${esc(order.orderNumber)}</strong>.`,
    body: itemsTable(order),
    button: { label: 'View my orders', url: `${frontendUrl()}/orders` },
  }),
});

const STATUS_COPY = {
  Shipped: 'Good news - your order is on its way.',
  Delivered: 'Your order has been delivered. We hope you love it.',
  Cancelled: 'Your order has been cancelled. Any reserved stock has been released.',
};

const sendOrderStatusUpdate = (user, order) => {
  const copy = STATUS_COPY[order.orderStatus];
  if (!copy) return Promise.resolve(false);
  return sendEmail({
    to: user.email,
    subject: `Order ${order.orderNumber}: ${order.orderStatus}`,
    text: `Order ${order.orderNumber} is now ${order.orderStatus}.`,
    html: template({
      title: `Order ${esc(order.orderStatus.toLowerCase())}`,
      intro: `Hi ${esc(user.name)}, ${copy} (Order <strong>${esc(order.orderNumber)}</strong>)`,
      button: { label: 'View my orders', url: `${frontendUrl()}/orders` },
    }),
  });
};

// Loads the order's user (if not already populated) and emails them. Fire-and-forget safe.
const emailOrderEvent = async (order, kind) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(order.user?._id || order.user).select('name email');
    if (!user) return false;
    return kind === 'confirmation' ? await sendOrderConfirmation(user, order) : await sendOrderStatusUpdate(user, order);
  } catch (err) {
    console.error('[email] order email failed:', err.message);
    return false;
  }
};

// Contact form: notifies the shop owner (CONTACT_EMAIL, else MAIL_FROM/SMTP_USER) and replies to the sender.
const sendContactNotification = ({ name, email, subject, message, phone } = {}) => {
  const to = process.env.CONTACT_EMAIL || process.env.SMTP_USER;
  return sendEmail({
    to,
    replyTo: email,
    subject: `[Contact] ${subject || 'New message'} - ${name || email}`,
    text: `From: ${name} <${email}>\n${phone ? `Phone: ${phone}\n` : ''}\n${message}`,
    html: template({
      title: 'New contact message',
      intro: `<strong>${esc(name)}</strong> (${esc(email)}${phone ? `, ${esc(phone)}` : ''}) wrote:`,
      body: `<p style="font-size:14px;line-height:1.6;white-space:pre-wrap;background:${CREAM};padding:14px;border:1px solid #e8e2d6;margin:0;">${esc(message)}</p>`,
      footnote: `Subject: ${esc(subject || '-')}. Reply directly to this email to respond.`,
    }),
  });
};

module.exports = {
  isConfigured,
  sendEmail,
  fire,
  sendPasswordReset,
  sendLoginOtp,
  sendWelcome,
  sendNewsletterConfirmation,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  emailOrderEvent,
  sendContactNotification,
};
