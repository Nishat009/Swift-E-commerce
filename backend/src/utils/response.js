/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object|Array} data - Data to send in response
 * @param {number} statusCode - HTTP status code
 */
const sendSuccess = (res, message, data = {}, statusCode = 200, meta = null) => {
  return res.status(statusCode).json({
    success: true,
    code: statusCode,
    status: statusCode,
    message,
    data,
    ...(meta && typeof meta === 'object' ? meta : {}),
  });
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object|Array} errors - Detailed errors (e.g. validation errors)
 */
const sendError = (res, message, statusCode = 422, errors = null) => {
  const code = statusCode;
  const response = {
    success: false,
    code,
    status: code,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(code).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
};
