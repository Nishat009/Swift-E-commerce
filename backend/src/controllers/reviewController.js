const Review = require('../models/Review');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/response');

// Helper to update product ratings and review count
const updateProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId });
  const totalReviews = reviews.length;
  
  let rating = 4.5; // default fallback
  if (totalReviews > 0) {
    const sum = reviews.reduce((acc, item) => acc + item.rating, 0);
    rating = Number((sum / totalReviews).toFixed(1));
  }

  await Product.findByIdAndUpdate(productId, {
    rating,
    totalReviews
  });
};

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res, next) => {
  const { product, rating, review } = req.body;

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
      return sendError(res, 'You have already reviewed this product', 400);
    }

    const newReview = await Review.create({
      product,
      user: req.user.id,
      userName: req.user.name,
      rating: Number(rating),
      review,
      verified: true // Assume verified because they are logged in and bought or can review
    });

    // Update Product average ratings and count
    await updateProductRating(product);

    return sendSuccess(res, 'Review submitted successfully', newReview, 201);
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
    const reviews = await Review.find({ product: productId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Reviews retrieved successfully', reviews);
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

module.exports = {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
};
