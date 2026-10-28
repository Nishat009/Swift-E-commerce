// Builds the catalog query (filters, sort, page) from GET /api/products query parameters,
// so productController only handles the request and the response.
const { tagCondition, escapeRegex, exactMatch } = require('../utils/productBadges');

const PUBLIC_FILTER = { active: true, status: 'published', visibility: 'public' };
const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'price', 'title', 'rating', 'soldCount', 'stock'];
// Shoppers page through the catalog; the admin tables load it in one go
const MAX_PAGE_SIZE = { public: 200, admin: 500 };

// What the shopper pays: list price minus the product-level discount (same formula as utils/pricing.js)
const EFFECTIVE_PRICE = {
  $multiply: ['$price', { $subtract: [1, { $divide: [{ $ifNull: ['$discountPercentage', 0] }, 100] }] }]
};
// One entry of a comma separated list such as "XS, S, M" (so "S" doesn't match "XS")
const listEntry = (value) => new RegExp(`(^|,)\\s*${escapeRegex(value)}\\s*(,|$)`, 'i');
const csv = (value) => String(value).split(',').map((v) => v.trim()).filter(Boolean);
const isTrue = (value) => value === 'true' || value === true;

/** MongoDB filter for the catalog. adminView may include drafts, hidden and inactive products. */
const buildFilter = (params, adminView) => {
  const { category, subcategory, search, priceMin, priceMax, brand, rating, availability, status, visibility, stockStatus, color, size, tag } = params;
  const query = adminView ? {} : { ...PUBLIC_FILTER };
  // Filters that need their own $or / $expr are AND-ed together at the end
  const andClauses = [];

  if (adminView && status && status !== 'all') query.status = status;
  if (adminView && visibility && visibility !== 'all') query.visibility = visibility;
  if (category && category !== 'all') query.category = String(category).toLowerCase();
  if (subcategory && subcategory !== 'all') query.subcategory = String(subcategory).toLowerCase();
  if (stockStatus && stockStatus !== 'all') query.stockStatus = stockStatus;

  // Search across title, brand, category, SKU, barcode, tags and description
  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), 'i');
    query.$or = ['title', 'brand', 'category', 'subcategory', 'sku', 'SKU', 'barcode', 'description', 'tags']
      .map((field) => ({ [field]: searchRegex }));
  }

  // Price bounds apply to the discounted price the shopper actually pays
  const priceBounds = [];
  if (priceMin !== undefined && priceMin !== '' && Number.isFinite(Number(priceMin))) priceBounds.push({ $gte: [EFFECTIVE_PRICE, Number(priceMin)] });
  if (priceMax !== undefined && priceMax !== '' && Number.isFinite(Number(priceMax))) priceBounds.push({ $lte: [EFFECTIVE_PRICE, Number(priceMax)] });
  if (priceBounds.length) andClauses.push({ $expr: { $and: priceBounds } });

  if (brand) {
    const brands = csv(brand);
    if (brands.length) query.brand = brands.length > 1 ? { $in: brands } : brands[0];
  }

  // Tag / badge filter (comma separated, matches any)
  if (tag) {
    const tags = csv(tag);
    if (tags.length) andClauses.push({ $or: tags.map(tagCondition) });
  }

  if (rating) query.rating = { $gte: Number(rating) };

  // Color: the specification or a Color variant option
  if (color) {
    const colors = csv(color).map(exactMatch);
    if (colors.length) {
      andClauses.push({ $or: [
        { 'specifications.ColorName': { $in: colors } },
        { variants: { $elemMatch: { name: /^colou?r$/i, 'options.value': { $in: colors } } } },
      ] });
    }
  }

  // Size: an entry of the Sizes specification or a Size variant option
  if (size) {
    const sizes = csv(size);
    if (sizes.length) {
      andClauses.push({ $or: [
        { 'specifications.Sizes': { $in: sizes.map(listEntry) } },
        { variants: { $elemMatch: { name: /^size$/i, 'options.value': { $in: sizes.map(exactMatch) } } } },
      ] });
    }
  }

  if (availability === 'in-stock') query.stock = { $gt: 0 };
  else if (availability === 'out-of-stock') query.stock = 0;

  if (isTrue(params.featured)) query.featured = true;
  if (isTrue(params.trending)) query.trending = true;
  if (isTrue(params.newArrival)) query.newArrival = true;
  if (isTrue(params.bestSeller)) query.bestSeller = true;

  if (andClauses.length) query.$and = andClauses;
  return query;
};

/** Sort order; price sorts follow the discounted price (effectivePriceOrder 1 / -1). */
const buildSort = ({ newest, sortBy, sort, order }) => {
  if (newest === 'true') return { sort: { createdAt: -1 }, effectivePriceOrder: 0 };
  if (sortBy) {
    if (sortBy === 'price-asc') return { sort: {}, effectivePriceOrder: 1 };
    if (sortBy === 'price-desc') return { sort: {}, effectivePriceOrder: -1 };
    if (sortBy === 'rating') return { sort: { rating: -1 }, effectivePriceOrder: 0 };
    if (sortBy === 'sold') return { sort: { soldCount: -1 }, effectivePriceOrder: 0 };
  } else if (sort && SORTABLE_FIELDS.includes(sort)) {
    return { sort: { [sort]: order === 'desc' ? -1 : 1 }, effectivePriceOrder: 0 };
  }
  return { sort: { createdAt: -1 }, effectivePriceOrder: 0 };
};

/** Page window: `skip` wins over `page`; the size is capped per audience. */
const buildPage = ({ page = 1, limit = 12, skip }, adminView) => {
  const pageNum = Math.max(1, Math.floor(Number(page)) || 1);
  const max = adminView ? MAX_PAGE_SIZE.admin : MAX_PAGE_SIZE.public;
  const limitNum = Math.min(max, Math.max(1, Math.floor(Number(limit)) || 12));
  const skipNum = skip !== undefined ? Math.max(0, Math.floor(Number(skip)) || 0) : (pageNum - 1) * limitNum;
  return { pageNum, limitNum, skipNum };
};

module.exports = { PUBLIC_FILTER, EFFECTIVE_PRICE, MAX_PAGE_SIZE, buildFilter, buildSort, buildPage };
