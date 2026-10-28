const mongoose = require('mongoose');
const Product = require('../models/Product');
const { unitPrice, normalizeVariant } = require('../utils/pricing');
const { evaluateCoupon, CouponError } = require('./couponService');

// Store pricing rules (FR-1.20). Thresholds use the merchandise subtotal before discounts.
const PRICING = {
  taxRate: 0.1,
  shippingFee: 10,
  freeShippingMin: 100,
  promoMin: 300,
  promoAmount: 30,
  maxQuantityPerLine: 50,
};

// Cash-on-delivery delivery charges by zone. EDIT THESE to change the owner's rates.
// Amounts are in Bangladeshi Taka; the store prices everything in USD (the base currency), so the
// charge is converted with BDT_PER_USD (default 120, same as the payment gateway conversion).
// Override per deployment with COD_FEE_INSIDE_DHAKA_BDT / COD_FEE_OUTSIDE_DHAKA_BDT.
// The free-shipping rule still applies: a merchandise subtotal of freeShippingMin ($100, about
// 12,000 Taka) or more ships free in every zone. Card / bKash orders keep the flat shippingFee.
const envFee = (name, fallback) => (process.env[name] !== undefined && process.env[name] !== '' && Number(process.env[name]) >= 0 ? Number(process.env[name]) : fallback);
const DELIVERY_ZONES = {
  inside_dhaka: { label: 'Inside Dhaka', feeBdt: envFee('COD_FEE_INSIDE_DHAKA_BDT', 60) },
  outside_dhaka: { label: 'Outside Dhaka', feeBdt: envFee('COD_FEE_OUTSIDE_DHAKA_BDT', 120) },
};
const { bdtPerUsd } = require('./paymentSettings');
const isDeliveryZone = (zone) => Object.prototype.hasOwnProperty.call(DELIVERY_ZONES, zone);

// Does this address city count as Dhaka? ("Inside Dhaka" is only accepted for Dhaka addresses)
const isDhakaCity = (city) => /dhaka|ঢাকা/i.test(String(city || ''));

// Shipping charge in USD for a merchandise subtotal, payment method and (COD only) zone
const shippingFor = (subtotal, paymentMethod, zone) => {
  if (subtotal >= PRICING.freeShippingMin) return 0;
  if (paymentMethod === 'cod' && isDeliveryZone(zone)) return Number((DELIVERY_ZONES[zone].feeBdt / bdtPerUsd()).toFixed(2));
  return PRICING.shippingFee;
};

class QuoteError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const round = (n) => Number(n.toFixed(2));

const isLive = (p) => p && p.active !== false && p.status === 'published' && p.visibility === 'public';

// Server-side price calculation shared by the checkout preview and order creation.
// Returns order-ready lines (with variant stock targets) and the totals breakdown.
const quoteOrder = async (products, userId, couponCode, options = {}) => {
  const paymentMethod = options.paymentMethod || '';
  if (options.deliveryZone && !isDeliveryZone(options.deliveryZone)) throw new QuoteError('Choose Inside Dhaka or Outside Dhaka for delivery.');
  // The zone only matters for cash on delivery
  const deliveryZone = paymentMethod === 'cod' ? options.deliveryZone || '' : '';
  if (!Array.isArray(products) || !products.length) throw new QuoteError('Your cart is empty.');
  if (products.length > 100) throw new QuoteError('Too many items in one order.');

  const docs = new Map();
  const perProduct = new Map(); // total quantity per product across variant lines
  const perVariant = new Map(); // total quantity per product + variant stock target
  const lines = [];
  let subtotal = 0;

  for (const item of products) {
    const productId = String(item?.product?.id || item?.product || '');
    const quantity = Number(item?.quantity);
    if (!mongoose.isValidObjectId(productId)) throw new QuoteError('A product in your cart is no longer available.', 404);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > PRICING.maxQuantityPerLine) {
      throw new QuoteError(`Quantity must be a whole number between 1 and ${PRICING.maxQuantityPerLine}.`);
    }

    if (!docs.has(productId)) docs.set(productId, await Product.findById(productId));
    const product = docs.get(productId);
    if (!isLive(product)) throw new QuoteError('A product in your cart is no longer available.', 404);

    const variant = item.variant || item.selectedVariant || {};
    const unit = unitPrice(product, variant);

    const productQty = (perProduct.get(productId) || 0) + quantity;
    perProduct.set(productId, productQty);
    if (product.stock < productQty) {
      throw new QuoteError(`Insufficient stock for ${product.title}. Available: ${product.stock}.`);
    }
    if (unit.optionStock !== null) {
      const variantKey = `${productId}:${JSON.stringify(unit.stockTargets)}`;
      const variantQty = (perVariant.get(variantKey) || 0) + quantity;
      perVariant.set(variantKey, variantQty);
      if (unit.optionStock < variantQty) {
        throw new QuoteError(`Only ${unit.optionStock} left of ${product.title} in the selected option.`);
      }
    }

    const lineTotal = round(unit.price * quantity);
    subtotal += lineTotal;
    lines.push({
      product: product._id,
      title: product.title,
      quantity,
      unitPrice: unit.price,
      lineTotal,
      variant: normalizeVariant(product, variant),
      stockTargets: unit.stockTargets,
    });
  }
  subtotal = round(subtotal);

  let couponResult = null;
  if (couponCode) {
    try {
      couponResult = await evaluateCoupon(couponCode, userId, subtotal);
    } catch (err) {
      if (err instanceof CouponError) throw new QuoteError(err.message, err.status);
      throw err;
    }
  }
  const couponDiscount = round(couponResult?.discount || 0);
  const promoDiscount = subtotal >= PRICING.promoMin ? Math.min(PRICING.promoAmount, Math.max(0, subtotal - couponDiscount)) : 0;
  const discounted = Math.max(0, subtotal - couponDiscount - promoDiscount);
  const tax = round(discounted * PRICING.taxRate);
  const shipping = shippingFor(subtotal, paymentMethod, deliveryZone);
  const deliveryOptions = Object.entries(DELIVERY_ZONES).map(([zone, z]) => ({ zone, label: z.label, charge: shippingFor(subtotal, 'cod', zone) }));

  return {
    lines,
    subtotal,
    discount: couponDiscount,
    promoDiscount: round(promoDiscount),
    tax,
    shipping,
    deliveryZone,
    deliveryOptions,
    total: round(discounted + tax + shipping),
    coupon: couponResult?.coupon.code || '',
    couponDoc: couponResult?.coupon || null,
  };
};

// Shape sent to the browser (no internal stock targets or coupon document)
const publicQuote = (quote) => ({
  lines: quote.lines.map(({ stockTargets, variant, ...line }) => ({ ...line, product: String(line.product) })),
  subtotal: quote.subtotal,
  discount: quote.discount,
  promoDiscount: quote.promoDiscount,
  tax: quote.tax,
  shipping: quote.shipping,
  deliveryZone: quote.deliveryZone,
  deliveryOptions: quote.deliveryOptions,
  total: quote.total,
  coupon: quote.coupon,
});

module.exports = { quoteOrder, publicQuote, QuoteError, PRICING, DELIVERY_ZONES, isDeliveryZone, isDhakaCity };
