// The demo catalog must fill the storefront's "New in" and "Bestsellers" rails (8 products each).
// Needs no database:  node --test tests/catalog-data.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const products = require('../scripts/fashionProductsData');
const categories = require('../scripts/fashionCategories');
const { buildProduct } = require('../scripts/seedCatalog');

const RAIL_SIZE = 8;

test('catalog has enough New in and Bestseller products for both rails', () => {
  assert.ok(products.filter((p) => p.newArrival).length >= RAIL_SIZE, 'not enough newArrival products');
  assert.ok(products.filter((p) => p.bestSeller).length >= RAIL_SIZE, 'not enough bestSeller products');
});

test('a product is in only one rail, so the rails differ', () => {
  assert.equal(products.filter((p) => p.newArrival && p.bestSeller).length, 0);
});

test('slugs are unique and every product belongs to a seeded category', () => {
  const slugs = products.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  const known = new Set(categories.map((c) => c.slug));
  for (const p of products) assert.ok(known.has(p.category), `${p.slug}: unknown category ${p.category}`);
});

test('local product and category images exist in public/', () => {
  const publicDir = path.join(__dirname, '../../public');
  const local = [
    ...categories.map((c) => c.image),
    ...products.flatMap((p) => [p.thumbnail, p.productImage, p.modelWearingImage, ...p.images]),
  ].filter((src) => src && src.startsWith('/'));
  for (const src of local) assert.ok(fs.existsSync(path.join(publicDir, src)), `missing ${src}`);
});

test('buildProduct produces a valid Product document with a unique SKU', () => {
  const Product = require('../src/models/Product');
  const taken = new Set(['SC-TOP-1000']);
  const skus = new Set();
  products.forEach((p) => {
    const doc = buildProduct(p, taken);
    assert.ok(!skus.has(doc.SKU), `duplicate SKU ${doc.SKU}`);
    skus.add(doc.SKU);
    const error = new Product(doc).validateSync();
    assert.equal(error, undefined, `${p.slug}: ${error && error.message}`);
  });
  assert.ok(!skus.has('SC-TOP-1000'), 'reused a SKU that was already taken');
});
