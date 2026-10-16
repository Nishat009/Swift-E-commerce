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

const template = ({ title, intro, body = '', button, footnote, automated = true }) => `<!doctype html>
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
<tr><td style="background:${CREAM};padding:18px 32px;text-align:center;font-size:11px;color:#9a9086;border-top:1px solid #e8e2d6;">&copy; ${new Date().getFullYear()} ${BRAND}.${automated ? ' This is an automated message.' : ''}</td></tr>
</table></td></tr></table></body></html>`;

const codeBox = (code) => `<p style="text-align:center;margin:8px 0 20px;"><span style="font-family:Georgia,serif;font-size:34px;letter-spacing:8px;color:${GOLD};background:${CREAM};border:1px dashed ${GOLD};padding:12px 24px;display:inline-block;">${esc(code)}</span></p>`;

// Core sender: never throws. Resolves { ok, previewUrl } (previewUrl only for the Ethereal test inbox).
const deliver = async ({ to, subject, html, text, replyTo }) => {
  try {
    const t = await getTransporter();
    if (!t || !to) return { ok: false, previewUrl: '' };
    const info = await t.sendMail({
      from: process.env.MAIL_FROM || `"${BRAND}" <${process.env.SMTP_USER || 'no-reply@swiftcart.test'}>`,
      to,
      subject,
      html,
      text: text || subject,
      ...(replyTo ? { replyTo } : {}),
    });
    const preview = nodemailer.getTestMessageUrl(info) || '';
    if (preview) console.log(`[email] "${subject}" preview: ${preview}`);
    return { ok: true, previewUrl: preview };
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}: ${err.message}`);
    return { ok: false, previewUrl: '' };
  }
};

// Resolves true/false.
const sendEmail = async (mail) => (await deliver(mail)).ok;

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
const adminOrderUrl = (order) => `${frontendUrl()}/admin?tab=orders&order=${encodeURIComponent(order._id || order.id)}`;

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
${summaryRow(order.deliveryZone ? `Delivery (${order.deliveryZone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})` : 'Shipping', order.shipping > 0 ? money(order.shipping) : 'Free')}
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

// Plain text typed by a person, as escaped HTML paragraphs (blank line = new paragraph)
const paragraphs = (text) => String(text || '').trim().split(/\n\s*\n/)
  .map((p) => `<p style="font-size:15px;line-height:1.6;margin:0 0 14px;">${esc(p).replace(/\n/g, '<br>')}</p>`)
  .join('');

const quoteBox = (label, text) => `<p style="font-size:13px;line-height:1.6;background:${CREAM};padding:12px 14px;border:1px solid #e8e2d6;margin:0 0 16px;"><strong>${esc(label)}</strong><br>${esc(text).replace(/\n/g, '<br>')}</p>`;

const sendReturnRequested = (user, order) => {
  const r = order.returnRequest || {};
  return sendEmail({
    to: user.email,
    subject: `Return request received for order ${order.orderNumber}`,
    text: `We received your return request for order ${order.orderNumber} (${r.reason}). We will review it within 2 business days.`,
    html: template({
      title: 'Return request received',
      intro: `Hi ${esc(user.name)}, we received your request to return order <strong>${esc(order.orderNumber)}</strong>. Our team will review it within 2 business days and email you the result.`,
      body: quoteBox('Reason', `${r.reason}${r.details ? `\n${r.details}` : ''}`),
      button: { label: 'View order', url: orderUrl(order) },
      footnote: 'Please keep the items unused, with their tags and original packaging, until the return is approved.',
    }),
  });
};

const sendReturnDecision = (user, order) => {
  const r = order.returnRequest || {};
  const approved = r.status === 'Approved';
  const refundLine = order.paymentStatus === 'Refund Needed'
    ? ` Your refund of ${money(order.total)} will be sent to your original payment method once we receive the items.`
    : '';
  return sendEmail({
    to: user.email,
    subject: `Return ${approved ? 'approved' : 'not approved'}: order ${order.orderNumber}`,
    text: approved
      ? `Your return for order ${order.orderNumber} was approved.${refundLine}${r.response ? `\n\n${r.response}` : ''}`
      : `Your return request for order ${order.orderNumber} was not approved.${r.response ? `\n\n${r.response}` : ''}`,
    html: template({
      title: approved ? 'Your return is approved' : 'About your return request',
      intro: approved
        ? `Hi ${esc(user.name)}, your return for order <strong>${esc(order.orderNumber)}</strong> was approved.${esc(refundLine)}`
        : `Hi ${esc(user.name)}, we reviewed your return request for order <strong>${esc(order.orderNumber)}</strong> and could not approve it.`,
      body: r.response ? quoteBox('Message from our team', r.response) : '',
      button: { label: 'View order', url: orderUrl(order) },
      footnote: approved ? 'Pack the items securely with their tags. Our courier will contact you to collect them.' : 'If you have questions, just reply to this email.',
    }),
  });
};

const sendRefundIssued = (user, order) => {
  const refund = order.refund || {};
  return sendEmail({
    to: user.email,
    subject: `Refund issued for order ${order.orderNumber}`,
    text: `We refunded ${money(refund.amount)} for order ${order.orderNumber} to your original payment method.`,
    html: template({
      title: 'Your refund is on its way',
      intro: `Hi ${esc(user.name)}, we refunded <strong>${money(refund.amount)}</strong> for order <strong>${esc(order.orderNumber)}</strong> to your original payment method (${esc(String(order.paymentMethod || '').toUpperCase())}).`,
      body: refund.note ? quoteBox('Note', refund.note) : '',
      button: { label: 'View order', url: orderUrl(order) },
      footnote: 'Card refunds usually take 5-10 business days to appear. bKash and cash refunds usually arrive within 3 business days.',
    }),
  });
};

// A message an admin wrote to the customer. Resolves { ok, previewUrl }.
const sendCustomerMessage = ({ user, order, subject, message, includeOrder, replyTo }) => deliver({
  to: user.email,
  subject,
  replyTo,
  text: `Hi ${user.name},\n\n${message}${order ? `\n\nOrder ${order.orderNumber}: ${orderUrl(order)}` : ''}`,
  html: template({
    title: subject,
    intro: `Hi ${esc(user.name)},`,
    body: `${paragraphs(message)}${order && includeOrder ? `<p style="font-size:13px;font-weight:bold;margin:24px 0 8px;">Order ${esc(order.orderNumber)}</p>${itemsTable(order)}` : ''}`,
    button: order ? { label: 'View order', url: orderUrl(order) } : { label: 'Visit the shop', url: `${frontendUrl()}/products` },
    footnote: 'You can reply directly to this email.',
    automated: false,
  }),
});

// Heads-up for the store team (ORDER_ALERT_EMAIL, else CONTACT_EMAIL / SMTP_USER). Skipped when none is set.
const sendStaffOrderAlert = (order, { subject, title, intro }) => {
  const to = process.env.ORDER_ALERT_EMAIL || process.env.CONTACT_EMAIL || process.env.SMTP_USER;
  if (!to) return Promise.resolve(false);
  return sendEmail({
    to,
    subject,
    text: `${intro}\n${adminOrderUrl(order)}`,
    html: template({
      title,
      intro: esc(intro),
      body: itemsTable(order),
      button: { label: 'Open in admin', url: adminOrderUrl(order) },
    }),
  });
};

const ORDER_EMAILS = {
  confirmation: sendOrderConfirmation,
  status: sendOrderStatusUpdate,
  return_requested: sendReturnRequested,
  return_decision: sendReturnDecision,
  refund: sendRefundIssued,
};

// Loads the order's user (if not already populated) and emails them. Fire-and-forget safe.
const emailOrderEvent = async (order, kind) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(order.user?._id || order.user).select('name email');
    if (!user || !ORDER_EMAILS[kind]) return false;
    if (kind === 'confirmation' && order.populate && !order.populated?.('products.product')) await order.populate('products.product');
    return await ORDER_EMAILS[kind](user, order);
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
  sendCustomerMessage,
  sendStaffOrderAlert,
  emailOrderEvent,
  renderOrderInvoice: itemsTable,
  sendContactNotification,
};
