const Language = require('../models/Language');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Get active languages list (Public)
// @route   GET /api/languages
// @access  Public
const getLanguages = async (req, res, next) => {
  try {
    const languages = await Language.find({ isActive: true }).sort({ isDefault: -1, code: 1 });
    return sendSuccess(res, 'Active languages retrieved successfully', languages);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all languages list (Admin)
// @route   GET /api/languages/admin/all
// @access  Private/Admin
const adminGetLanguages = async (req, res, next) => {
  try {
    const languages = await Language.find().sort({ isDefault: -1, code: 1 });
    return sendSuccess(res, 'All languages retrieved successfully', languages);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new language
// @route   POST /api/languages
// @access  Private/Admin
const createLanguage = async (req, res, next) => {
  const { code, name, flag, isDefault, isActive } = req.body;
  try {
    if (!code || !name || !flag) {
      return sendError(res, 'Code, name, and flag fields are required', 400);
    }

    const exists = await Language.findOne({ code: code.toLowerCase() });
    if (exists) {
      return sendError(res, `Language with code "${code}" already exists`, 400);
    }

    const language = await Language.create({
      code: code.toLowerCase(),
      name,
      flag,
      isDefault: !!isDefault,
      isActive: isActive !== undefined ? !!isActive : true,
    });

    return sendSuccess(res, 'Language created successfully', language, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a language configuration
// @route   PUT /api/languages/:id
// @access  Private/Admin
const updateLanguage = async (req, res, next) => {
  const { id } = req.params;
  const { name, flag, isDefault, isActive } = req.body;
  try {
    const language = await Language.findById(id);
    if (!language) {
      return sendError(res, 'Language not found', 404);
    }

    // If making default, it must be active
    if (isDefault) {
      language.isDefault = true;
      language.isActive = true;
    } else if (isDefault === false) {
      // Cannot unset default if it is currently default and there are no other defaults
      if (language.isDefault) {
        return sendError(res, 'Must have at least one default base language', 400);
      }
    }

    if (name) language.name = name;
    if (flag) language.flag = flag;
    if (isActive !== undefined) {
      // Cannot deactivate default language
      if (!isActive && language.isDefault) {
        return sendError(res, 'Cannot deactivate the default store language', 400);
      }
      language.isActive = !!isActive;
    }

    await language.save();
    return sendSuccess(res, 'Language updated successfully', language);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a language configuration
// @route   DELETE /api/languages/:id
// @access  Private/Admin
const deleteLanguage = async (req, res, next) => {
  const { id } = req.params;
  try {
    const language = await Language.findById(id);
    if (!language) {
      return sendError(res, 'Language not found', 404);
    }

    if (language.isDefault) {
      return sendError(res, 'Cannot delete the default base language', 400);
    }

    await Language.findByIdAndDelete(id);
    return sendSuccess(res, 'Language deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLanguages,
  adminGetLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
};
