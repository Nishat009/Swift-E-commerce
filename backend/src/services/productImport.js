// FR-1.4: bulk product import from a JSON array or CSV text, plus the field whitelist used
// whenever an admin creates or edits a product.

// Counters the store maintains itself; never accepted from a request body
const PROTECTED_FIELDS = [
  '_id', 'id', '__v', 'createdAt', 'updatedAt',
  'rating', 'totalReviews', 'reviewCount', 'ratingDistribution', 'reviews',
  'soldCount', 'wishlistCount', 'viewCount',
];

const pickProductFields = (body) => {
  const data = { ...(body || {}) };
  PROTECTED_FIELDS.forEach((field) => delete data[field]);
  return data;
};

// Minimal RFC 4180 CSV parser: quoted fields, escaped quotes ("") and newlines inside quotes
const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  return rows;
};

const LIST_FIELDS = ['images', 'tags', 'videos'];
const NUMBER_FIELDS = ['price', 'originalPrice', 'salePrice', 'discountPercentage', 'tax', 'costPrice', 'stock', 'lowStockThreshold', 'maxOrderQuantity', 'minOrderQuantity'];
const BOOLEAN_FIELDS = ['featured', 'trending', 'newArrival', 'bestSeller', 'active', 'allowBackorders', 'trackInventory'];

// CSV header row names the fields. Lists use "|" between values (images, tags).
const csvToProducts = (text) => {
  const [header, ...rows] = parseCsv(text);
  if (!header) return [];
  const keys = header.map((h) => h.trim());
  return rows.map((cells) => {
    const item = {};
    keys.forEach((key, i) => {
      const raw = (cells[i] ?? '').trim();
      if (!key || raw === '') return;
      if (LIST_FIELDS.includes(key)) item[key] = raw.split('|').map((v) => v.trim()).filter(Boolean);
      else if (NUMBER_FIELDS.includes(key)) item[key] = Number(raw);
      else if (BOOLEAN_FIELDS.includes(key)) item[key] = ['true', '1', 'yes'].includes(raw.toLowerCase());
      else item[key] = raw;
    });
    return item;
  });
};

// Fill what a spreadsheet row usually leaves out
const prepareImported = (raw) => {
  const item = pickProductFields(raw);
  delete item.slug;
  if (!item.thumbnail && Array.isArray(item.images) && item.images.length) item.thumbnail = item.images[0];
  if (!item.images && item.thumbnail) item.images = [item.thumbnail];
  if (!item.sku) item.sku = `SKU-${Math.floor(100000 + Math.random() * 900000)}`;
  if (!item.status) item.status = 'draft';
  return item;
};

module.exports = { PROTECTED_FIELDS, pickProductFields, parseCsv, csvToProducts, prepareImported };
