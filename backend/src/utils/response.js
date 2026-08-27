/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object|Array} data - Data to send in response
 * @param {number} statusCode - HTTP status code
 */
const sendSuccess = (res, message, data = {}, statusCode = 200) => {
  return res.status(200).json({
    success: true,
    code: 200,
    status: 200,
    message,
    data,
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
  const code = 422;
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
