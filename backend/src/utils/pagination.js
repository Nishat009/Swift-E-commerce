// Reads ?page and ?limit from a query string, clamped to sane bounds
const parsePage = (query = {}, { defaultLimit = 50, maxLimit = 200 } = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(query.limit, 10) || defaultLimit), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
};

const pageMeta = ({ page, limit }, total) => ({ page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });

module.exports = { parsePage, pageMeta };
