const nodemailer = require('nodemailer');

const BRAND = 'SwiftCart';
const GOLD = '#8b6f47';
const CREAM = '#faf9f6';

let transporter = null;
let etherealPromise = null;
let warned = false;

const isConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

// FR-3.2: in development without SMTP, send to a free Ethereal test inbox and log a preview link.
const useEthereal = () => process.env.NODE_ENV === 'development' && process.env.EMAIL_ETHEREAL !== 'false';

const getEtherealTransporter = () => {
  if (!etherealPromise) {
    etherealPromise = nodemailer.createTestAccount().then((account) => {
      console.log(`[email] SMTP not configured - using Ethereal test inbox ${account.user} (open the preview links below)`);
      return nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      });
    }).catch((err) => {
      console.warn(`[email] Could not create an Ethereal test inbox: ${err.message}`);
      etherealPromise = null;
      return null;
    });
  }
  return etherealPromise;
};

const getTransporter = async () => {
  if (!isConfigured()) {
    if (useEthereal()) return getEtherealTransporter();
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
const frontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3001').split(',')[0].trim().replace(/\/$/, '');
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
    const t = await getTransporter();
    if (!t || !to) return false;
    const info = await t.sendMail({
      from: process.env.MAIL_FROM || `"${BRAND}" <${process.env.SMTP_USER || 'no-reply@swiftcart.test'}>`,
      to,
      subject,
      html,
      text: text || subject,
      ...(replyTo ? { replyTo } : {}),
    });
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log(`[email] "${subject}" preview: ${preview}`);
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

const backendUrl = () => (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '');

const sendNewsletterConfirmation = (email, unsubscribeToken) => {
  const unsubscribeUrl = unsubscribeToken ? `${backendUrl()}/api/newsletter/unsubscribe?token=${unsubscribeToken}` : '';
  return sendEmail({
    to: email,
    subject: `You're subscribed to ${BRAND}`,
    text: `Thanks for subscribing to the ${BRAND} newsletter.${unsubscribeUrl ? ` Unsubscribe: ${unsubscribeUrl}` : ''}`,
    html: template({
      title: 'Thanks for subscribing',
      intro: 'You will now receive news on new arrivals, exclusive offers and style notes.',
      button: { label: 'Browse the shop', url: `${frontendUrl()}/products` },
      footnote: unsubscribeUrl ? `Changed your mind? <a href="${esc(unsubscribeUrl)}" style="color:#7a7168;">Unsubscribe</a> in one click.` : '',
    }),
  });
};

const orderUrl = (order) => `${frontendUrl()}/orders?order=${encodeURIComponent(order._id || order.id)}`;

const variantLabel = (it) => {
  const options = it.variant?.options && typeof it.variant.options === 'object' ? Object.entries(it.variant.options) : [];
  return options.map(([group, value]) => `${group}: ${value}`).join(', ') || it.variant?.name || '';
};

const summaryRow = (label, value, color = '#7a7168') =>
  `<tr><td colspan="2" style="padding:6px 0;font-size:13px;color:${color};">${label}</td><td align="right" style="font-size:13px;color:${color};">${value}</td></tr>`;

// FR-3.3: itemised invoice with thumbnails, variants, discounts, tax, shipping and address
const itemsTable = (order) => {
  const rows = (order.products || []).map((it) => {
    const name = it.product?.title || it.product?.name || it.name || 'Item';
    const image = it.product?.thumbnail || (it.product?.images || [])[0];
    const variant = variantLabel(it);
    const thumb = image && /^https?:///.test(image)
      ? `<img src="${esc(image)}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;object-fit:cover;border:1px solid #eee;">`
      : '';
    return `<tr>
<td width="64" style="padding:10px 8px 10px 0;border-bottom:1px solid #eee;vertical-align:top;">${thumb}</td>
<td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;vertical-align:top;">${esc(name)}<br>
<span style="font-size:12px;color:#7a7168;">${variant ? `${esc(variant)} &middot; ` : ''}${esc(it.quantity)} &times; ${money(it.price)}</span></td>
<td align="right" style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;vertical-align:top;">${money(it.price * it.quantity)}</td></tr>`;
  }).join('');
  const discountRows = [
    order.discount > 0 ? summaryRow(`Coupon${order.coupon ? ` (${esc(order.coupon)})` : ''}`, `-${money(order.discount)}`, '#2f7d4f') : '',
    order.promoDiscount > 0 ? summaryRow('Promotion', `-${money(order.promoDiscount)}`, '#2f7d4f') : '',
  ].join('');
  const a = order.shippingAddress;
  const address = a
    ? `<p style="font-size:13px;line-height:1.6;margin:20px 0 0;color:#2b2622;"><strong>Shipping to</strong><br>${esc(a.street)}<br>${esc(a.city)}, ${esc(a.state)} ${esc(a.zipCode)}<br>${esc(a.country)}</p>`
    : '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
${summaryRow('Subtotal', money(order.subtotal))}
${discountRows}
${summaryRow('Tax (10%)', money(order.tax))}
${summaryRow('Shipping', order.shipping > 0 ? money(order.shipping) : 'Free')}
<tr><td colspan="2" style="padding:10px 0;font-family:Georgia,serif;font-size:18px;color:${GOLD};">Total</td><td align="right" style="font-family:Georgia,serif;font-size:18px;color:${GOLD};">${money(order.total)}</td></tr></table>
<p style="font-size:13px;margin:16px 0 0;color:#7a7168;">Payment: ${esc(String(order.paymentMethod || '').toUpperCase())} (${esc(order.paymentStatus)})</p>
${address}`;
};

const sendOrderConfirmation = (user, order) => sendEmail({
  to: user.email,
  subject: `Order ${order.orderNumber} received`,
  text: `Thank you for your order ${order.orderNumber}. Total: ${money(order.total)}. Track it at ${orderUrl(order)}`,
  html: template({
    title: 'Thank you for your order',
    intro: `Hi ${esc(user.name)}, we have received order <strong>${esc(order.orderNumber)}</strong>.`,
    body: itemsTable(order),
    button: { label: 'View order status', url: orderUrl(order) },
  }),
});

// FR-3.4: emails for these status changes
const STATUS_COPY = {
  Confirmed: 'Your order is confirmed and is being prepared.',
  Shipped: 'Good news - your order is on its way.',
  Delivered: 'Your order has been delivered. We hope you love it.',
  Cancelled: 'Your order has been cancelled. Any reserved stock has been released.',
  Returned: 'Your return has been received.',
};

const sendOrderStatusUpdate = (user, order) => {
  const copy = STATUS_COPY[order.orderStatus];
  if (!copy) return Promise.resolve(false);
  const refund = ['Refund Needed', 'Refunded'].includes(order.paymentStatus)
    ? (order.paymentStatus === 'Refunded' ? ' Your payment has been refunded.' : ' Your payment will be refunded.')
    : '';
  return sendEmail({
    to: user.email,
    subject: `Order ${order.orderNumber}: ${order.orderStatus}`,
    text: `Order ${order.orderNumber} is now ${order.orderStatus}.${refund}`,
    html: template({
      title: `Order ${esc(order.orderStatus.toLowerCase())}`,
      intro: `Hi ${esc(user.name)}, ${copy}${refund} (Order <strong>${esc(order.orderNumber)}</strong>)`,
      button: { label: 'View order status', url: orderUrl(order) },
    }),
  });
};

// Loads the order's user (if not already populated) and emails them. Fire-and-forget safe.
const emailOrderEvent = async (order, kind) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(order.user?._id || order.user).select('name email');
    if (!user) return false;
    if (kind === 'confirmation' && order.populate && !order.populated?.('products.product')) await order.populate('products.product');
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
  renderOrderInvoice: itemsTable,
  sendContactNotification,
};
