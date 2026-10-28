// HTML for the development-only mock payment page (GET /api/payments/mock/checkout).
// Every value is escaped; the controller only decides what to show.
const escapeHtml = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const STYLE = `body{font-family:system-ui,sans-serif;background:#f4f4f5;display:grid;place-items:center;min-height:100vh;margin:0}
.card{background:#fff;border-radius:16px;padding:32px;max-width:380px;width:90%;box-shadow:0 10px 30px rgba(0,0,0,.1);text-align:center}
.tag{display:inline-block;background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;padding:4px 10px;border-radius:99px}
.amt{font-size:34px;font-weight:800;margin:12px 0 4px}a{display:block;padding:12px;border-radius:10px;margin-top:12px;font-weight:700;text-decoration:none}
.pay{background:#16a34a;color:#fff}.fail{background:#fee2e2;color:#b91c1c}`;

/** @param {{ gatewayName: string, label: string, amount: number, payUrl: string, failUrl: string }} page */
const mockCheckoutPage = ({ gatewayName, label, amount, payUrl, failUrl }) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mock payment</title>
<style>${STYLE}</style></head>
<body><div class="card"><span class="tag">TEST MODE - no real money</span>
<h2>${escapeHtml(gatewayName)} mock payment</h2><div>${escapeHtml(label)}</div>
<div class="amt">$${escapeHtml(Number(amount).toFixed(2))}</div>
<a class="pay" href="${escapeHtml(payUrl)}">Pay successfully</a><a class="fail" href="${escapeHtml(failUrl)}">Fail / cancel payment</a></div></body></html>`;

module.exports = { mockCheckoutPage };
