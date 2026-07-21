const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate('products');
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, products: [] });
    }
    // Filter out null values in case products were removed
    const validProducts = (wishlist.products || []).filter(Boolean);
    return sendSuccess(res, 'Wishlist retrieved successfully', validProducts);
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return sendError(res, 'Product ID is required', 400);
  }

  try {
    let product = null;
    if (mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId);
    }
    
    if (!product) {
      // Fallback search by title or string match if catalog was seeded with mock items
      product = await Product.findOne({
        $or: [{ title: new RegExp(String(productId), 'i') }]
      });
    }

    if (!product) {
      return sendError(res, 'Product not found in store database', 404);
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, products: [] });
    }

    const realId = product._id;

    if (wishlist.products.some(id => id.toString() === realId.toString())) {
      return sendError(res, 'Product already in wishlist', 400);
    }

    wishlist.products.push(realId);
    await wishlist.save();
    await wishlist.populate('products');

    return sendSuccess(res, 'Product added to wishlist successfully', wishlist.products);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res, next) => {
  const { productId } = req.params;

  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return sendError(res, 'Wishlist not found', 404);
    }

    wishlist.products = wishlist.products.filter((id) => id.toString() !== String(productId));
    await wishlist.save();
    await wishlist.populate('products');

    return sendSuccess(res, 'Product removed from wishlist successfully', wishlist.products);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
