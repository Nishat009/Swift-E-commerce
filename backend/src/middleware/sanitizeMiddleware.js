// Refuses request bodies that carry MongoDB operator keys ("$ne", "$gt", "$where", ...) or
// prototype keys ("__proto__", "constructor", "prototype") at any depth. The validation rules
// already force types on the fields each route reads; this is the global backstop for a
// controller that passes a body value into a filter or an update.
const { sendError } = require('../utils/response');

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_DEPTH = 32;

// The path of the first forbidden key, or null when the value is clean
const findForbiddenKey = (value, path = '', depth = 0) => {
  if (value === null || typeof value !== 'object' || Buffer.isBuffer(value)) return null;
  if (depth > MAX_DEPTH) return path || '(body)';
  for (const key of Object.keys(value)) {
    const here = path ? `${path}.${key}` : key;
    if (key.startsWith('$') || FORBIDDEN_KEYS.has(key)) return here;
    const nested = findForbiddenKey(value[key], here, depth + 1);
    if (nested) return nested;
  }
  return null;
};

const rejectOperatorKeys = (req, res, next) => {
  const bad = findForbiddenKey(req.body);
  if (bad) return sendError(res, `Invalid field "${bad}" in the request body`, 422);
  next();
};

module.exports = { rejectOperatorKeys, findForbiddenKey };
