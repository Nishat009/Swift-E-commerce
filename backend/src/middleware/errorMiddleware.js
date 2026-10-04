const { sendError } = require('../utils/response');

// 404 handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle Mongoose cast errors
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for "${err.path}"`;
  }

  // Body larger than the JSON limit, or not valid JSON
  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request is too large';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body is not valid JSON';
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    statusCode = 422;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered: ${field}`;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  if (err.message === 'Not allowed by CORS') {
    statusCode = 403;
  }

  console.error('Error details:', err);

  const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  if (statusCode >= 500 && !isDev) {
    message = 'Something went wrong. Please try again.';
  }

  return sendError(res, message, statusCode, isDev ? { stack: err.stack } : null);
};

module.exports = {
  notFound,
  errorHandler,
};
