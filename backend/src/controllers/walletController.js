const mongoose = require('mongoose');
const WalletTransaction = require('../models/WalletTransaction');
const wallet = require('../services/wallet');
const { sendSuccess, sendError } = require('../utils/response');
const { logActivity } = require('../utils/activityLog');
const { isSuperAdmin } = require('../middleware/roleMiddleware');

const TYPES = ['credit', 'debit'];
const CATEGORIES = WalletTransaction.schema.path('category').enumValues;

// Statement filters from the query string: type, category, from / to (dates), q (order number or text)
const statementFilter = (query) => {
  const filter = {};
  if (TYPES.includes(query.type)) filter.type = query.type;
  if (CATEGORIES.includes(query.category)) filter.category = query.category;
  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;
  if ((from && !isNaN(from)) || (to && !isNaN(to))) {
    filter.createdAt = {};
    if (from && !isNaN(from)) filter.createdAt.$gte = from;
    // "to" is a calendar day: include all of it
    if (to && !isNaN(to)) filter.createdAt.$lt = new Date(to.getTime() + 24 * 60 * 60 * 1000);
  }
  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 80) : '';
  if (q) {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ orderNumber: re }, { description: re }, { byName: re }];
  }
  return filter;
};

const totalsFor = async (filter) => {
  const rows = await WalletTransaction.aggregate([
    { $match: filter },
    { $group: { _id: { type: '$type', category: '$category' }, sum: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const totals = { credits: 0, debits: 0, sales: 0, saleCount: 0, refunds: 0, refundCount: 0, adjustments: 0 };
  for (const r of rows) {
    if (r._id.type === 'credit') totals.credits += r.sum; else totals.debits += r.sum;
    if (r._id.category === 'sale') { totals.sales += r.sum; totals.saleCount += r.count; }
    if (r._id.category === 'refund') { totals.refunds += r.sum; totals.refundCount += r.count; }
    if (r._id.category === 'adjustment') totals.adjustments += r._id.type === 'credit' ? r.sum : -r.sum;
  }
  for (const k of Object.keys(totals)) if (!k.endsWith('Count')) totals[k] = wallet.round(totals[k]);
  return totals;
};

// @desc    Store wallet balance and account statement
// @route   GET /api/admin/wallet   ?page&limit&type&category&from&to&q
// @access  Private/Admin
const getWallet = async (req, res, next) => {
  try {
    const store = await wallet.ensureWallet();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const filter = statementFilter(req.query);
    const [transactions, total, totals] = await Promise.all([
      WalletTransaction.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
      WalletTransaction.countDocuments(filter),
      totalsFor(filter),
    ]);
    return sendSuccess(res, 'Store wallet', {
      balance: wallet.round(store.balance),
      currency: store.currency,
      updatedAt: store.updatedAt,
      totals,
      transactions,
    }, 200, {
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      canAdjust: isSuperAdmin(req.user),
    });
  } catch (error) {
    next(error);
  }
};

const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  // Leading = + - @ would run as a formula in a spreadsheet
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

// @desc    The statement (same filters) as a CSV download
// @route   GET /api/admin/wallet/statement.csv
// @access  Private/Admin
const exportStatement = async (req, res, next) => {
  try {
    await wallet.ensureWallet();
    const rows = await WalletTransaction.find(statementFilter(req.query)).sort({ createdAt: 1, _id: 1 }).limit(20000).lean();
    const lines = [['Date', 'Type', 'Category', 'Description', 'Order', 'Amount', 'Balance after', 'By']]
      .concat(rows.map((t) => [
        new Date(t.createdAt).toISOString(),
        t.type,
        t.category,
        t.description,
        t.orderNumber,
        (t.type === 'debit' ? -t.amount : t.amount).toFixed(2),
        t.balanceAfter === null || t.balanceAfter === undefined ? '' : Number(t.balanceAfter).toFixed(2),
        t.byName || (t.category === 'sale' ? 'System' : ''),
      ]));
    await logActivity(req, 'Wallet Statement Exported', `${rows.length} lines`, 'wallet');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="store-statement-${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.send(lines.map((l) => l.map(csvCell).join(',')).join('\n'));
  } catch (error) {
    next(error);
  }
};

// @desc    Add money to or take money out of the store wallet by hand (super admin)
// @route   POST /api/admin/wallet/adjust   body: { type: 'credit' | 'debit', amount, note }
// @access  Private/SuperAdmin
const adjustWallet = async (req, res, next) => {
  try {
    const type = req.body?.type;
    const amount = wallet.round(Number(req.body?.amount));
    const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 300) : '';
    if (!TYPES.includes(type)) return sendError(res, 'Type must be "credit" (add funds) or "debit" (withdraw).', 400);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000) return sendError(res, 'Enter an amount between $0.01 and $10,000,000.', 400);
    if (note.length < 5) return sendError(res, 'Add a short note saying why (at least 5 characters).', 400);

    let txn;
    try {
      txn = await wallet[type]({ category: 'adjustment', amount, description: note, ref: `adjust:${new mongoose.Types.ObjectId()}`, user: req.user });
    } catch (err) {
      if (err instanceof wallet.WalletError) return sendError(res, err.message, err.status);
      throw err;
    }
    await logActivity(req, type === 'credit' ? 'Wallet Funds Added' : 'Wallet Funds Withdrawn', `$${amount.toFixed(2)}: ${note} (balance now $${Number(txn.balanceAfter).toFixed(2)})`, 'wallet');
    return sendSuccess(res, type === 'credit' ? 'Funds added' : 'Funds withdrawn', txn, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = { getWallet, exportStatement, adjustWallet };
