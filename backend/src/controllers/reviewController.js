const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/response');

// Helper to update product ratings and review count
const updateProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId });
  const totalReviews = reviews.length;
  
  let rating = 0;
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
  });
  if (totalReviews > 0) {
    const sum = reviews.reduce((acc, item) => acc + item.rating, 0);
    rating = Number((sum / totalReviews).toFixed(1));
  }

  await Product.findByIdAndUpdate(productId, {
    rating,
    totalReviews,
    reviewCount: totalReviews,
    ratingDistribution
  });
};

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res, next) => {
  const { product, rating, review } = req.body;
  const images = Array.isArray(req.body.images)
    ? req.body.images.filter((u) => typeof u === 'string' && /^https?:[/][/]/i.test(u)).slice(0, 5)
    : [];

  try {
    const dbProduct = await Product.findById(product);
    if (!dbProduct) {
      return sendError(res, 'Product not found', 404);
    }

    // Optional: Check if user already reviewed
    const alreadyReviewed = await Review.findOne({
      product,
      user: req.user.id
    });

    if (alreadyReviewed) {
      return sendError(res, 'You have already reviewed this product', 409);
    }

    // Verified only when this user really bought the product in a non-cancelled order
    const hasPurchased = await Order.exists({
      user: req.user.id,
      'products.product': product,
      orderStatus: { $nin: ['Cancelled', 'Returned'] }
    });

    const newReview = await Review.create({
      product,
      user: req.user.id,
      userName: req.user.name,
      rating: Number(rating),
      review,
      images,
      verified: Boolean(hasPurchased)
    });

    // Update Product average ratings and count
    await updateProductRating(product);

    return sendSuccess(res, 'Review submitted successfully', newReview, 201);
  } catch (error) {
    // A double submit races past the check above; the unique index catches it
    if (error.code === 11000) return sendError(res, 'You have already reviewed this product', 409);
    next(error);
  }
};

// @desc    Mark a review as helpful (one vote per user)
// @route   POST /api/reviews/:id/helpful
// @access  Private
const markReviewHelpful = async (req, res, next) => {
  try {
    const updated = await Review.findOneAndUpdate(
      { _id: req.params.id, helpedBy: { $ne: req.user.id } },
      { $addToSet: { helpedBy: req.user.id }, $inc: { helpfulCount: 1 } },
      { new: true }
    );
    if (!updated) {
      const existing = await Review.findById(req.params.id);
      if (!existing) return sendError(res, 'Review not found', 404);
      return sendError(res, 'You already marked this review as helpful', 400);
    }
    return sendSuccess(res, 'Thanks for your feedback', { helpfulCount: updated.helpfulCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = async (req, res, next) => {
  const { productId } = req.params;
  try {
    if (!mongoose.isValidObjectId(productId)) return sendError(res, 'Product not found', 404);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const [reviews, total] = await Promise.all([
      Review.find({ product: productId })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Review.countDocuments({ product: productId }),
    ]);

    return sendSuccess(res, 'Reviews retrieved successfully', reviews, 200, {
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = async (req, res, next) => {
  const { id } = req.params;
  const { rating, review } = req.body;

  try {
    const dbReview = await Review.findById(id);
    if (!dbReview) {
      return sendError(res, 'Review not found', 404);
    }

    if (dbReview.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to update this review', 403);
    }

    dbReview.rating = rating !== undefined ? Number(rating) : dbReview.rating;
    dbReview.review = review || dbReview.review;
    if (Array.isArray(req.body.images)) {
      dbReview.images = req.body.images.filter((u) => typeof u === 'string' && /^https?:[/][/]/i.test(u)).slice(0, 5);
    }

    await dbReview.save();
    
    // Recalculate ratings
    await updateProductRating(dbReview.product);

    return sendSuccess(res, 'Review updated successfully', dbReview);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res, next) => {
  const { id } = req.params;

  try {
    const dbReview = await Review.findById(id);
    if (!dbReview) {
      return sendError(res, 'Review not found', 404);
    }

    if (dbReview.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to delete this review', 403);
    }

    const productId = dbReview.product;

    await Review.findByIdAndDelete(id);

    // Recalculate ratings
    await updateProductRating(productId);

    return sendSuccess(res, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Private/Admin
const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({})
      .populate('product', 'title thumbnail')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'All reviews retrieved successfully', reviews);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markReviewHelpful,
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  getAllReviews,
};
