const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors to a simplified map
    const errorMap = {};
    errors.array().forEach((err) => {
      errorMap[err.path || err.param] = err.msg;
    });

    return sendError(res, 'Validation error', 400, errorMap);
  }
  next();
};

module.exports = { validate };
