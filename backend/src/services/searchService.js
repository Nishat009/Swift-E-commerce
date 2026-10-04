// FR-1.19: "did you mean" corrections (Levenshtein distance) and trending searches.
const Product = require('../models/Product');
const SearchTerm = require('../models/SearchTerm');

const LIVE = { active: true, status: 'published', visibility: 'public' };
const VOCAB_TTL_MS = 5 * 60 * 1000;
let vocabCache = { words: [], phrases: [], builtAt: 0 };

const normalize = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();

// Classic edit distance with an early exit once every cell in a row exceeds the limit
const levenshtein = (a, b, limit = Infinity) => {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, row[j]);
    }
    if (rowMin > limit) return limit + 1;
    prev = row;
  }
  return prev[b.length];
};

// Words and phrases customers can search for: titles, brands, categories, tags
const vocabulary = async () => {
  if (Date.now() - vocabCache.builtAt < VOCAB_TTL_MS && vocabCache.words.length) return vocabCache;
  const products = await Product.find(LIVE).select('title brand category subcategory tags').lean();
  const phrases = new Set();
  const words = new Set();
  for (const p of products) {
    for (const value of [p.title, p.brand, p.category, p.subcategory, ...(p.tags || [])]) {
      const phrase = normalize(value);
      if (!phrase) continue;
      phrases.add(phrase);
      phrase.split(' ').filter((w) => w.length >= 3).forEach((w) => words.add(w));
    }
  }
  vocabCache = { words: [...words], phrases: [...phrases], builtAt: Date.now() };
  return vocabCache;
};

const allowedDistance = (word) => (word.length <= 4 ? 1 : word.length <= 8 ? 2 : 3);

// Correct each word of the query to the closest known word; null when nothing changes
const didYouMean = async (query) => {
  const words = normalize(query).split(' ').filter(Boolean);
  if (!words.length) return null;
  const { words: known } = await vocabulary();
  if (!known.length) return null;

  let changed = false;
  const corrected = words.map((word) => {
    if (word.length < 3 || known.includes(word)) return word;
    const limit = allowedDistance(word);
    let best = null;
    let bestDistance = limit + 1;
    for (const candidate of known) {
      const d = levenshtein(word, candidate, limit);
      if (d < bestDistance) { best = candidate; bestDistance = d; }
    }
    if (best) { changed = true; return best; }
    return word;
  });
  return changed ? corrected.join(' ') : null;
};

// Autocomplete: product titles containing the query
const suggest = async (query, limit = 8) => {
  const q = normalize(query);
  if (q.length < 2) return [];
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const products = await Product.find({ ...LIVE, title: new RegExp(escaped, 'i') })
    .select('title slug thumbnail price')
    .sort({ soldCount: -1 })
    .limit(limit)
    .lean();
  return products.map((p) => ({ id: String(p._id), title: p.title, slug: p.slug, thumbnail: p.thumbnail, price: p.price }));
};

// Count storefront searches (best effort, never blocks the search)
const recordSearch = (query, resultCount) => {
  const term = normalize(query).slice(0, 80);
  if (term.length < 2) return;
  SearchTerm.updateOne(
    { term },
    { $inc: { count: 1 }, $set: { lastSearchedAt: new Date(), resultCount } },
    { upsert: true }
  ).catch(() => {});
};

// Most searched terms (with results) in the last 30 days; falls back to trending product tags
const trending = async (limit = 10) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const terms = await SearchTerm.find({ lastSearchedAt: { $gte: since }, resultCount: { $gt: 0 } })
    .sort({ count: -1 })
    .limit(limit)
    .lean();
  if (terms.length >= 3) return terms.map((t) => t.term);

  const tagged = await Product.aggregate([
    { $match: { ...LIVE, $or: [{ trending: true }, { bestSeller: true }] } },
    { $unwind: '$tags' },
    { $group: { _id: { $toLower: '$tags' }, n: { $sum: 1 } } },
    { $sort: { n: -1 } },
    { $limit: limit },
  ]);
  return [...new Set([...terms.map((t) => t.term), ...tagged.map((t) => t._id)])].slice(0, limit);
};

const resetVocabulary = () => { vocabCache = { words: [], phrases: [], builtAt: 0 }; };

module.exports = { levenshtein, didYouMean, suggest, recordSearch, trending, resetVocabulary };
