// Atomic stock reservation for order lines. Each line is { product, quantity, stockTargets }
// where stockTargets (from utils/pricing) lists the variant options / combination with their own stock.
// soldCount moves with the stock so "best sellers" sorting reflects real orders.
const Product = require('../models/Product');

// Move stock for one variant option / combination. A negative delta only applies when enough is left.
const adjustTarget = (productId, target, delta) => {
  const guard = delta < 0 ? { stock: { $gte: -delta } } : {};
  if (target.kind === 'combination') {
    return Product.updateOne(
      { _id: productId, variantCombinations: { $elemMatch: { id: target.id, ...guard } } },
      { $inc: { 'variantCombinations.$.stock': delta } }
    );
  }
  return Product.updateOne(
    { _id: productId, variants: { $elemMatch: { name: target.group, options: { $elemMatch: { [target.field]: target.value, ...guard } } } } },
    { $inc: { 'variants.$[g].options.$[o].stock': delta } },
    { arrayFilters: [{ 'g.name': target.group }, { [`o.${target.field}`]: target.value }] }
  );
};

// Pipeline update so stockStatus stays in sync (atomic updates skip the model's save hook).
// soldCount never drops below zero for orders placed before it was tracked.
const adjustProduct = (productId, delta) => {
  const newStock = { $add: ['$stock', delta] };
  return Product.updateOne(
    { _id: productId, ...(delta < 0 ? { stock: { $gte: -delta } } : {}) },
    [{
      $set: {
        stock: newStock,
        soldCount: { $max: [0, { $subtract: [{ $ifNull: ['$soldCount', 0] }, delta] }] },
        stockStatus: {
          $cond: [
            { $lte: [newStock, 0] }, 'out_of_stock',
            { $cond: [{ $eq: ['$stockStatus', 'out_of_stock'] }, 'in_stock', '$stockStatus'] },
          ],
        },
      },
    }]
  );
};

// Take one line's stock, all or nothing.
const takeLine = async (line) => {
  if (!(await adjustProduct(line.product, -line.quantity)).modifiedCount) return false;
  const taken = [];
  for (const target of line.stockTargets || []) {
    if (!(await adjustTarget(line.product, target, -line.quantity)).modifiedCount) {
      for (const prev of taken) await adjustTarget(line.product, prev, line.quantity);
      await adjustProduct(line.product, line.quantity);
      return false;
    }
    taken.push(target);
  }
  return true;
};

const returnLine = async (line) => {
  await adjustProduct(line.product, line.quantity);
  for (const target of line.stockTargets || []) await adjustTarget(line.product, target, line.quantity);
};

// Reserve every line or none. Returns { ok, failedLine }.
const reserve = async (lines) => {
  const taken = [];
  for (const line of lines) {
    if (!(await takeLine(line))) {
      for (const prev of taken) await returnLine(prev);
      return { ok: false, failedLine: line };
    }
    taken.push(line);
  }
  return { ok: true };
};

const release = async (lines) => {
  for (const line of lines) await returnLine(line);
};

module.exports = { reserve, release };
