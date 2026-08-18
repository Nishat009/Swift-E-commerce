const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/response');

// Helper to find product by ObjectId, numeric ID, SKU, or slug
const findProductFlexible = async (id) => {
  if (!id) return null;
  const idStr = String(id);
  if (idStr.match(/^[0-9a-fA-F]{24}$/)) {
    const prod = await Product.findById(idStr);
    if (prod) return prod;
  }

  // Check slug, SKU, or exact title
  let prod = await Product.findOne({
    $or: [
      { slug: idStr },
      { sku: idStr },
      { SKU: idStr },
      { barcode: idStr },
      { title: new RegExp(`^${idStr.replace(/-/g, ' ')}$`, 'i') }
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
      prod = await Product.findOne({ title: catalogTitleMap[numId] });
      if (prod) return prod;
    }
  }
  return null;
};

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
    const product = await findProductFlexible(productId);
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

    const itemIndex = cart.products.findIndex((item) => item.product && item.product.toString() === product._id.toString());

    if (itemIndex > -1) {
      cart.products[itemIndex].quantity += Number(quantity);
    } else {
      cart.products.push({ product: product._id, quantity: Number(quantity) });
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
    const product = await findProductFlexible(productId);
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

    const itemIndex = cart.products.findIndex((item) => item.product && item.product.toString() === product._id.toString());

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

    const product = await findProductFlexible(productId);
    const targetIdStr = product ? product._id.toString() : String(productId);

    cart.products = cart.products.filter((item) => item.product && item.product.toString() !== targetIdStr);

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
