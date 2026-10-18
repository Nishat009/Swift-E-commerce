// The store account: one balance plus a statement of every credit and debit.
// Sales are booked in when an order is paid; refunds are paid out of it and are refused when the
// balance is too low. Lines with a `ref` are booked once only, so retries never double count.
const StoreWallet = require('../models/StoreWallet');
const WalletTransaction = require('../models/WalletTransaction');

const KEY = 'store';
const round = (n) => Math.round(Number(n) * 100) / 100;
// Money the store starts with, so refunds work on a fresh install (demo data)
const openingBalance = () => {
  const n = Number(process.env.STORE_WALLET_OPENING_BALANCE);
  return Number.isFinite(n) && n >= 0 ? round(n) : 50000;
};

class WalletError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const actor = (user) => (user ? { by: user._id || user.id || null, byName: user.name || '' } : {});

// The wallet document, created with its opening balance the first time it is needed
const ensureWallet = async () => {
  const existing = await StoreWallet.findOne({ key: KEY });
  if (existing) return existing;
  const opening = openingBalance();
  try {
    const wallet = await StoreWallet.create({ key: KEY, balance: opening });
    await WalletTransaction.create({
      type: 'credit',
      category: 'opening_balance',
      amount: opening,
      balanceAfter: opening,
      description: 'Opening balance',
      ref: 'opening_balance',
    }).catch((err) => { if (err.code !== 11000) throw err; });
    return wallet;
  } catch (err) {
    if (err.code === 11000) return StoreWallet.findOne({ key: KEY }); // created by a parallel request
    throw err;
  }
};

const getBalance = async () => round((await ensureWallet()).balance);

// Book a line. For a debit the balance must cover it. Returns the transaction, or null when a
// line with the same ref was already booked.
const post = async (type, { category, amount, description = '', order = null, ref, user } = {}) => {
  const value = round(amount);
  if (!Number.isFinite(value) || value <= 0) throw new WalletError('The amount must be more than 0.');
  await ensureWallet();

  let txn;
  try {
    txn = await WalletTransaction.create({
      type,
      category,
      amount: value,
      description,
      order: order?._id || order || null,
      orderNumber: order?.orderNumber || '',
      ref: ref || undefined,
      ...actor(user),
    });
  } catch (err) {
    if (err.code === 11000) return null;
    throw err;
  }

  const delta = type === 'credit' ? value : -value;
  const filter = type === 'debit' ? { key: KEY, balance: { $gte: value } } : { key: KEY };
  const wallet = await StoreWallet.findOneAndUpdate(filter, { $inc: { balance: delta } }, { new: true });
  if (!wallet) {
    await WalletTransaction.deleteOne({ _id: txn._id });
    const balance = await getBalance();
    throw new WalletError(`The store wallet has $${balance.toFixed(2)}, which is not enough to pay out $${value.toFixed(2)}. Add funds in Accounts first.`, 409);
  }
  // Floating point drift from many $inc calls: keep the stored balance at whole cents
  const balanceAfter = round(wallet.balance);
  if (balanceAfter !== wallet.balance) await StoreWallet.updateOne({ _id: wallet._id }, { $set: { balance: balanceAfter } });
  txn.balanceAfter = balanceAfter;
  await WalletTransaction.updateOne({ _id: txn._id }, { $set: { balanceAfter } });
  return txn;
};

const credit = (details) => post('credit', details);
const debit = (details) => post('debit', details);

// Undo a line that was booked for an action that then failed (books the opposite line)
const reverse = async (txn, reason) => {
  if (!txn) return null;
  return post(txn.type === 'credit' ? 'debit' : 'credit', {
    category: 'adjustment',
    amount: txn.amount,
    description: `Reversal: ${reason || txn.description}`,
    order: txn.order ? { _id: txn.order, orderNumber: txn.orderNumber } : null,
    ref: `reversal:${txn._id}`,
  }).catch((err) => console.error('Wallet reversal failed:', err.message));
};

const METHOD_LABELS = { cod: 'cash on delivery', bkash: 'bKash', card: 'card' };

// Money received for an order. Safe to call more than once; never throws.
const recordSale = async (order, user) => {
  try {
    if (!order || !(Number(order.total) > 0)) return null;
    return await credit({
      category: 'sale',
      amount: order.total,
      description: `Payment received for ${order.orderNumber} (${METHOD_LABELS[order.paymentMethod] || order.paymentMethod})`,
      order,
      ref: `sale:${order._id}`,
      user,
    });
  } catch (err) {
    console.error('Wallet sale entry failed:', err.message);
    return null;
  }
};

module.exports = { WalletError, ensureWallet, getBalance, credit, debit, reverse, recordSale, openingBalance, round };
