const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Get all products with search, filter, pagination, sorting
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      skip,
      category,
      search,
      priceMin,
      priceMax,
      brand,
      rating,
      availability,
      featured,
      newest,
      sort,
      order,
      sortBy
    } = req.query;

    const query = { active: true };

    // 1. Category Filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // 2. Full-Text Search or Regex Match (Title, Brand, Category, Tags, Description)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ];
    }

    // 3. Price Filtering
    if (priceMin !== undefined || priceMax !== undefined) {
      query.price = {};
      if (priceMin !== undefined) query.price.$gte = Number(priceMin);
      if (priceMax !== undefined) query.price.$lte = Number(priceMax);
    }

    // 4. Brand Filter
    if (brand) {
      query.brand = brand;
    }

    // 5. Rating Filter
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // 6. Availability Filter
    if (availability === 'in-stock') {
      query.stock = { $gt: 0 };
    } else if (availability === 'out-of-stock') {
      query.stock = 0;
    }

    // 7. Featured Filter
    if (featured === 'true' || featured === true) {
      query.featured = true;
    }

    // Sorting definition
    let sortOptions = {};

    if (newest === 'true') {
      sortOptions = { createdAt: -1 };
    } else if (sortBy) {
      // Handles frontend format like price-asc, price-desc, rating
      if (sortBy === 'price-asc') sortOptions = { price: 1 };
      else if (sortBy === 'price-desc') sortOptions = { price: -1 };
      else if (sortBy === 'rating') sortOptions = { rating: -1 };
      else sortOptions = { createdAt: -1 };
    } else if (sort) {
      // Handles standard sort/order query params
      const sortOrder = order === 'desc' ? -1 : 1;
      sortOptions[sort] = sortOrder;
    } else {
      sortOptions = { createdAt: -1 };
    }

    // Pagination calculations
    const pageNum = Number(page);
    const limitNum = Number(limit);
    // Support either explicit skip or page/limit calculations
    const skipNum = skip !== undefined ? Number(skip) : (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skipNum)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      products,
      total,
      skip: skipNum,
      limit: limitNum,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID or slug
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  const { id } = req.params;
  try {
    let product;
    // Check if ID is a valid MongoDB ObjectID, else query by slug
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    } else {
      product = await Product.findOne({ slug: id });
    }

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    return sendSuccess(res, 'Product retrieved successfully', product);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    return sendSuccess(res, 'Product created successfully', product, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    return sendSuccess(res, 'Product updated successfully', updatedProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product (soft delete by setting active to false)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    product.active = false;
    await product.save();

    return sendSuccess(res, 'Product deleted (deactivated) successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
