// Storefront badges, defined once. The API sends each product's badges (Product toJSON adds
// `badges`), and the catalog filter (?tag=Sale) uses the matching database conditions below, so
// the frontend never re-implements these rules.
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactMatch = (value) => new RegExp(`^${escapeRegex(value)}$`, 'i');

const DEFAULT_LOW_STOCK = 5;

// name -> { applies(product), condition() as a MongoDB filter }
const BADGES = {
  Sale: {
    applies: (p) => (Number(p.discountPercentage) || 0) > 0,
    condition: () => ({ discountPercentage: { $gt: 0 } }),
  },
  'Low Stock': {
    applies: (p) => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? DEFAULT_LOW_STOCK),
    condition: () => ({
      $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', DEFAULT_LOW_STOCK] }] }] },
    }),
  },
  Featured: {
    applies: (p, tags) => Boolean(p.featured) || tags.has('featured'),
    condition: () => ({ $or: [{ featured: true }, { tags: exactMatch('Featured') }] }),
  },
  Bestseller: {
    applies: (p, tags) => Boolean(p.bestSeller) || tags.has('bestseller'),
    condition: () => ({ $or: [{ bestSeller: true }, { tags: exactMatch('Bestseller') }] }),
  },
  New: {
    applies: (p, tags) => Boolean(p.newArrival) || tags.has('new'),
    condition: () => ({ $or: [{ newArrival: true }, { tags: exactMatch('New') }] }),
  },
};

const BADGE_BY_KEY = Object.fromEntries(Object.entries(BADGES).map(([name, badge]) => [name.toLowerCase(), badge]));

/** Badge names a product carries, e.g. ['Sale', 'New']. */
const badgesFor = (product) => {
  const tags = new Set((product.tags || []).map((t) => String(t).toLowerCase()));
  return Object.entries(BADGES).filter(([, badge]) => badge.applies(product, tags)).map(([name]) => name);
};

/** Filter for ?tag=: a badge name uses its rule, any other value matches the product's tags. */
const tagCondition = (tag) => {
  const badge = BADGE_BY_KEY[String(tag).toLowerCase()];
  return badge ? badge.condition() : { tags: exactMatch(tag) };
};

module.exports = { BADGE_NAMES: Object.keys(BADGES), badgesFor, tagCondition, escapeRegex, exactMatch };
