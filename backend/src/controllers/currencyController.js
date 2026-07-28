const Currency = require('../models/Currency');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Get all currencies
// @route   GET /api/currencies
// @access  Public
const getCurrencies = async (req, res, next) => {
  try {
    const currencies = await Currency.find().sort({ code: 1 });
    return sendSuccess(res, 'Currencies retrieved successfully', currencies);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a currency (Admin)
// @route   POST /api/currencies
// @access  Private/Admin
const createCurrency = async (req, res, next) => {
  const { code, symbol, rate, isDefault } = req.body;
  try {
    if (!code || !symbol || rate === undefined) {
      return sendError(res, 'Please provide code, symbol and rate', 400);
    }

    const currencyExists = await Currency.findOne({ code: code.toUpperCase() });
    if (currencyExists) {
      return sendError(res, 'Currency code already exists', 400);
    }

    // If setting as default, unset previous default
    if (isDefault) {
      await Currency.updateMany({}, { isDefault: false });
    }

    const currency = await Currency.create({
      code: code.toUpperCase(),
      symbol,
      rate,
      isDefault: !!isDefault,
    });

    return sendSuccess(res, 'Currency created successfully', currency, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a currency (Admin)
// @route   PUT /api/currencies/:id
// @access  Private/Admin
const updateCurrency = async (req, res, next) => {
  const { id } = req.params;
  const { symbol, rate, isDefault } = req.body;
  try {
    const currency = await Currency.findById(id);
    if (!currency) {
      return sendError(res, 'Currency not found', 404);
    }

    if (symbol) currency.symbol = symbol;
    if (rate !== undefined) currency.rate = rate;
    
    if (isDefault !== undefined) {
      if (isDefault) {
        await Currency.updateMany({ _id: { $ne: id } }, { isDefault: false });
      }
      currency.isDefault = !!isDefault;
    }

    await currency.save();
    return sendSuccess(res, 'Currency updated successfully', currency);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a currency (Admin)
// @route   DELETE /api/currencies/:id
// @access  Private/Admin
const deleteCurrency = async (req, res, next) => {
  const { id } = req.params;
  try {
    const currency = await Currency.findById(id);
    if (!currency) {
      return sendError(res, 'Currency not found', 404);
    }

    if (currency.isDefault) {
      return sendError(res, 'Cannot delete the default currency', 400);
    }

    await Currency.findByIdAndDelete(id);
    return sendSuccess(res, 'Currency deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
};
