const Category = require('../models/Category');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    // Return simple array of names if query indicates frontend categories fetch compatibility
    const { format } = req.query;
    if (format === 'names') {
      return res.status(200).json(categories.map(c => c.name));
    }
    return sendSuccess(res, 'Categories retrieved successfully', categories);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category by ID or slug
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res, next) => {
  const { id } = req.params;
  try {
    let category;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findById(id);
    } else {
      category = await Category.findOne({ slug: id });
    }

    if (!category) {
      return sendError(res, 'Category not found', 404);
    }
    return sendSuccess(res, 'Category retrieved successfully', category);
  } catch (error) {
    next(error);
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res, next) => {
  const { name, image, featured } = req.body;
  try {
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return sendError(res, 'Category already exists', 400);
    }

    const category = await Category.create({ name, image, featured });
    return sendSuccess(res, 'Category created successfully', category, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res, next) => {
  const { id } = req.params;
  try {
    const category = await Category.findById(id);
    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });
    return sendSuccess(res, 'Category updated successfully', updatedCategory);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res, next) => {
  const { id } = req.params;
  try {
    const category = await Category.findById(id);
    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    await Category.findByIdAndDelete(id);
    return sendSuccess(res, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
