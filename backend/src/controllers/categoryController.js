const Category = require('../models/Category');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/response');
const { logActivity, logAudit } = require('../utils/activityLog');

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
    if (!name || !String(name).trim()) {
      return sendError(res, 'Category name is required', 400);
    }
    if (!image || !String(image).trim()) {
      return sendError(res, 'Category image is required', 400);
    }
    const categoryExists = await Category.findOne({ name: String(name).trim() }).collation({ locale: 'en', strength: 2 });
    if (categoryExists) {
      return sendError(res, 'Category already exists', 400);
    }

    const category = await Category.create({ name, image, featured });
    await logAudit(req, 'Category', category._id, `Created category "${category.name}"`, {}, { name: category.name, image: category.image, featured: category.featured });
    await logActivity(req, 'Category Created', `Created category "${category.name}"`);
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

    const oldName = category.name;
    const previous = { name: category.name, image: category.image, featured: category.featured };
    const { name, image, featured } = req.body;
    if (name !== undefined) category.name = String(name).trim();
    if (image !== undefined) category.image = image;
    if (featured !== undefined) category.featured = !!featured;
    if (name !== undefined && category.name.toLowerCase() !== oldName.toLowerCase()) {
      category.slug = undefined; // regenerate from the new name
    }
    const updatedCategory = await category.save();

    // Keep products attached to the renamed category
    if (oldName.toLowerCase() !== updatedCategory.name.toLowerCase()) {
      await Product.updateMany(
        { category: oldName.toLowerCase() },
        { category: updatedCategory.name.toLowerCase() }
      );
    }
    await logAudit(req, 'Category', updatedCategory._id, `Updated category "${oldName}"`, previous,
      { name: updatedCategory.name, image: updatedCategory.image, featured: updatedCategory.featured });
    await logActivity(req, 'Category Updated', `Updated category "${oldName}" -> "${updatedCategory.name}"`);
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

    const inUse = await Product.countDocuments({ category: category.name.toLowerCase(), active: true });
    if (inUse > 0) {
      return sendError(res, `Cannot delete: ${inUse} active product(s) still use this category. Move or archive them first.`, 400);
    }

    await Category.findByIdAndDelete(id);
    await logAudit(req, 'Category', category._id, `Deleted category "${category.name}"`, { name: category.name, image: category.image }, { deleted: true });
    await logActivity(req, 'Category Deleted', `Deleted category "${category.name}"`);
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
