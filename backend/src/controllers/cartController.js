const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/response');

// Helper to recalculate cart subtotal
const recalculateCart = async (cart) => {
  let subtotal = 0;
  
  // Populate products to get prices
  await cart.populate('products.product');

  cart.products.forEach((item) => {
    if (item.product) {
      const price = item.product.price;
      const discount = item.product.discountPercentage || 0;
      const finalPrice = price * (1 - discount / 100);
      subtotal += finalPrice * item.quantity;
    }
  });

  cart.subtotal = Number(subtotal.toFixed(2));
  return cart.save();
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('products.product');
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, products: [], subtotal: 0 });
    }
    return sendSuccess(res, 'Cart retrieved successfully', cart);
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    if (product.stock < quantity) {
      return sendError(res, `Insufficient stock. Only ${product.stock} items available.`, 400);
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, products: [], subtotal: 0 });
    }

    const itemIndex = cart.products.findIndex((item) => item.product.toString() === productId);

    if (itemIndex > -1) {
      cart.products[itemIndex].quantity += Number(quantity);
    } else {
      cart.products.push({ product: productId, quantity: Number(quantity) });
    }

    await recalculateCart(cart);
    // Populate before returning
    await cart.populate('products.product');

    return sendSuccess(res, 'Product added to cart successfully', cart);
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart
// @access  Private
const updateCartItem = async (req, res, next) => {
  const { productId, quantity } = req.body;

  if (quantity <= 0) {
    req.body.productId = productId;
    return removeFromCart(req, res, next);
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    if (product.stock < quantity) {
      return sendError(res, `Insufficient stock. Only ${product.stock} items available.`, 400);
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return sendError(res, 'Cart not found', 404);
    }

    const itemIndex = cart.products.findIndex((item) => item.product.toString() === productId);

    if (itemIndex > -1) {
      cart.products[itemIndex].quantity = Number(quantity);
      await recalculateCart(cart);
      await cart.populate('products.product');
      return sendSuccess(res, 'Cart updated successfully', cart);
    } else {
      return sendError(res, 'Product not found in cart', 404);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = async (req, res, next) => {
  const productId = req.params.productId || req.body.productId;

  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return sendError(res, 'Cart not found', 404);
    }

    cart.products = cart.products.filter((item) => item.product.toString() !== productId);

    await recalculateCart(cart);
    await cart.populate('products.product');

    return sendSuccess(res, 'Product removed from cart successfully', cart);
  } catch (error) {
    next(error);
  }
};

// @desc    Clear user cart
// @route   POST /api/cart/clear
// @access  Private
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.products = [];
      cart.subtotal = 0;
      await cart.save();
    }
    return sendSuccess(res, 'Cart cleared successfully', cart);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
