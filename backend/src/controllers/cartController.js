const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/response');
const { unitPrice, normalizeVariant } = require('../utils/pricing');

// Only live products can be added to a cart
const LIVE = { active: true, status: 'published', visibility: 'public' };
const MAX_LINE_QTY = 50;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Helper to find product by ObjectId, numeric ID, SKU, or slug
const findProductFlexible = async (id) => {
  if (!id) return null;
  const idStr = String(id);
  if (idStr.match(/^[0-9a-fA-F]{24}$/)) {
    const prod = await Product.findOne({ _id: idStr, ...LIVE });
    if (prod) return prod;
  }

  // Check slug, SKU, or exact title
  let prod = await Product.findOne({
    ...LIVE,
    $or: [
      { slug: idStr },
      { sku: idStr },
      { SKU: idStr },
      { barcode: idStr },
      { title: new RegExp(`^${escapeRegex(idStr.replace(/-/g, ' '))}$`, 'i') }
    ]
  });
  if (prod) return prod;

  // Numeric catalog mapping
  if (/^\d+$/.test(idStr)) {
    const numId = parseInt(idStr, 10);
    const catalogTitleMap = {
      101: 'Cropped Ribbed Knit Tank',
      102: 'Cozy Cable Knit Sweater',
      103: 'High-Rise Denim Jeans',
      104: 'Tailored Linen Trouser',
      105: 'Floral Silk Slip Dress',
      106: 'Oversized Classic Trench Coat',
      107: 'Minimalist Leather Shoulder Bag',
      108: 'Gold Hoop Earrings & Necklace Set',
      201: 'Premium Heavyweight Cotton Tee',
      202: 'Relaxed Oxford Cotton Shirt',
      203: 'Streetwear Cargo Utility Pants',
      204: 'Classic Relaxed Chino',
      205: 'Eco-Leather Bomber Jacket',
      206: 'Retro Denim Trucker Jacket',
      207: 'Air Platform Sneakers',
      208: 'Classic Leather Chelsea Boots',
      301: 'Premium Wool Felt Fedora',
      302: 'Canvas Sport Baseball Cap',
      303: 'Retro Oval Acetate Sunglasses',
    };
    if (catalogTitleMap[numId]) {
      prod = await Product.findOne({ ...LIVE, title: catalogTitleMap[numId] });
      if (prod) return prod;
    }
  }
  return null;
};

// Whole number between 1 and MAX_LINE_QTY, else null
const parseQuantity = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= MAX_LINE_QTY ? n : null;
};

const variantIdOf = (variant) => (variant && typeof variant === 'object' ? String(variant.id || '') : (typeof variant === 'string' ? variant : ''));

const sameLine = (item, productId, variantId) =>
  item.product && item.product.toString() === productId && (item.variant?.id || '') === variantId;

// How many of this product / variant can be held. Variant options with their own stock limit it further.
const availableFor = (product, variant) => {
  const { optionStock } = unitPrice(product, variant);
  return optionStock === null ? product.stock : Math.min(product.stock, optionStock);
};

const recalculate = async (cart) => {
  await cart.populate('products.product');
  // Drop lines whose product was deleted
  cart.products = cart.products.filter((item) => item.product);
  const subtotal = cart.products.reduce((sum, item) => sum + unitPrice(item.product, item.variant).price * item.quantity, 0);
  cart.subtotal = Number(subtotal.toFixed(2));
};

// Load, change and save the cart; concurrent writes (two tabs, guest sync) retry instead of failing
const mutateCart = async (userId, change) => {
  for (let attempt = 0; ; attempt++) {
    const cart = (await Cart.findOne({ user: userId })) || new Cart({ user: userId, products: [], subtotal: 0 });
    const problem = await change(cart);
    if (problem) return { problem };
    await recalculate(cart);
    try {
      cart.depopulate('products.product');
      await cart.save();
      await cart.populate('products.product');
      return { cart };
    } catch (err) {
      const retryable = err.name === 'VersionError' || err.code === 11000;
      if (!retryable || attempt >= 3) throw err;
    }
  }
};

const respond = (res, message, result) => (result.problem
  ? sendError(res, result.problem.message, result.problem.status || 400)
  : sendSuccess(res, message, result.cart));

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('products.product');
    if (!cart) {
      cart = await Cart.findOneAndUpdate(
        { user: req.user.id },
        { $setOnInsert: { products: [], subtotal: 0 } },
        { upsert: true, new: true }
      );
    }
    return sendSuccess(res, 'Cart retrieved successfully', cart);
  } catch (error) {
    next(error);
  }
};

// Add a quantity to a line, never beyond what is in stock
const addLine = (cart, product, variant, quantity) => {
  const variantId = variantIdOf(variant);
  const productId = product._id.toString();
  const existing = cart.products.find((item) => sameLine(item, productId, variantId));
  const wanted = (existing ? existing.quantity : 0) + quantity;
  const available = availableFor(product, variant);
  if (wanted > available) {
    const already = existing ? ` (you already have ${existing.quantity} in your cart)` : '';
    return { message: `Only ${available} of ${product.title} available${already}.` };
  }
  if (wanted > MAX_LINE_QTY) return { message: `You can order at most ${MAX_LINE_QTY} of one item.` };
  if (existing) {
    existing.quantity = wanted;
  } else {
    cart.products.push({
      product: product._id,
      quantity,
      variant: variant && typeof variant === 'object' ? { ...normalizeVariant(product, variant), id: variantId } : { id: variantId },
    });
  }
  return null;
};

// @desc    Add product to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res, next) => {
  const { productId, variant } = req.body;
  try {
    const quantity = parseQuantity(req.body.quantity ?? 1);
    if (!quantity) return sendError(res, `Quantity must be a whole number between 1 and ${MAX_LINE_QTY}.`, 400);

    const product = await findProductFlexible(productId);
    if (!product) return sendError(res, 'Product not found', 404);

    const result = await mutateCart(req.user.id, (cart) => addLine(cart, product, variant, quantity));
    return respond(res, 'Product added to cart successfully', result);
  } catch (error) {
    next(error);
  }
};

// @desc    Merge a guest cart after login. Idempotent: each line becomes max(server, guest) quantity,
//          so syncing the same browser cart twice never doubles it.
// @route   POST /api/cart/merge
// @access  Private
const mergeCart = async (req, res, next) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 100) : null;
    if (!items) return sendError(res, 'items must be an array', 400);

    const resolved = [];
    const skipped = [];
    for (const item of items) {
      const quantity = parseQuantity(item?.quantity);
      const product = quantity ? await findProductFlexible(item.productId) : null;
      if (product) resolved.push({ product, quantity, variant: item.variant });
      else skipped.push(String(item?.productId || ''));
    }

    const result = await mutateCart(req.user.id, (cart) => {
      for (const { product, quantity, variant } of resolved) {
        const variantId = variantIdOf(variant);
        const existing = cart.products.find((line) => sameLine(line, product._id.toString(), variantId));
        const target = Math.min(Math.max(existing ? existing.quantity : 0, quantity), availableFor(product, variant), MAX_LINE_QTY);
        if (target < 1) { skipped.push(product.id); continue; }
        if (existing) existing.quantity = target;
        else addLine(cart, product, variant, target);
      }
      return null;
    });
    const message = skipped.length ? 'Cart merged. Some items are no longer available.' : 'Cart merged';
    return sendSuccess(res, message, result.cart, 200, { skipped });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity (0 removes the line)
// @route   PUT /api/cart
// @access  Private
const updateCartItem = async (req, res, next) => {
  const { productId, variantId = '' } = req.body;
  try {
    const raw = Number(req.body.quantity);
    if (raw === 0) return removeFromCart(req, res, next);
    const quantity = parseQuantity(raw);
    if (!quantity) return sendError(res, `Quantity must be a whole number between 0 and ${MAX_LINE_QTY}.`, 400);

    const product = await findProductFlexible(productId);
    if (!product) return sendError(res, 'Product not found', 404);

    const result = await mutateCart(req.user.id, (cart) => {
      const pid = product._id.toString();
      const line = cart.products.find((item) => (variantId ? sameLine(item, pid, String(variantId)) : item.product?.toString() === pid));
      if (!line) return { message: 'Product not found in cart', status: 404 };
      const available = availableFor(product, line.variant);
      if (quantity > available) return { message: `Only ${available} of ${product.title} available.` };
      line.quantity = quantity;
      return null;
    });
    return respond(res, 'Cart updated successfully', result);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from cart (one variant when variantId is given)
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = async (req, res, next) => {
  const productId = req.params.productId || req.body.productId;
  const variantId = String(req.query.variantId || req.body.variantId || '');

  try {
    // An ObjectId is matched directly so unpublished products can still be removed
    const product = mongoose.isValidObjectId(String(productId)) ? null : await findProductFlexible(productId);
    const targetIdStr = product ? product._id.toString() : String(productId);

    const result = await mutateCart(req.user.id, (cart) => {
      cart.products = cart.products.filter((item) => {
        if (!item.product || item.product.toString() !== targetIdStr) return true;
        return variantId ? (item.variant?.id || '') !== variantId : false;
      });
      return null;
    });
    return respond(res, 'Product removed from cart successfully', result);
  } catch (error) {
    next(error);
  }
};

// @desc    Clear user cart
// @route   POST /api/cart/clear
// @access  Private
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate({ user: req.user.id }, { $set: { products: [], subtotal: 0 } }, { new: true });
    return sendSuccess(res, 'Cart cleared successfully', cart);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  mergeCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
