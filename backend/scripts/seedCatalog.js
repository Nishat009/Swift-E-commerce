// Adds the fashion demo catalog (categories + products) WITHOUT deleting anything.
// Unlike seed.js it is safe to run against a live database: categories and products that already
// exist (matched by slug or name) are skipped, so running it twice changes nothing.
//   npm --prefix backend run seed:catalog
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const fashionProductsData = require('./fashionProductsData');
const fashionCategories = require('./fashionCategories');
const { deriveFilterSpecs } = require('./filterMetadata');

// SKUs are unique in the database, so skip any number that is already taken.
const nextSku = (category, taken) => {
  const prefix = `SC-${category.toUpperCase().slice(0, 3)}-`;
  let n = 1000;
  while (taken.has(prefix + n)) n += 1;
  taken.add(prefix + n);
  return prefix + n;
};

const buildProduct = (product, taken = new Set()) => {
  const specs = { ...product.specifications };
  Object.assign(specs, deriveFilterSpecs({ title: product.title, category: product.category, specifications: specs }));
  return {
    ...product,
    SKU: nextSku(product.category, taken),
    specifications: new Map(Object.entries(specs)),
    totalReviews: 0,
    active: true,
  };
};

// Insert the categories and products that are missing; needs an open connection
const addMissingCatalog = async () => {
  let addedCategories = 0;
  for (const category of fashionCategories) {
    const exists = await Category.exists({ $or: [{ slug: category.slug }, { name: category.name }] });
    if (!exists) {
      await Category.create(category);
      addedCategories += 1;
    }
  }

  const existingSlugs = new Set(
    (await Product.find({ slug: { $in: fashionProductsData.map((p) => p.slug) } }).select('slug').lean()).map((p) => p.slug)
  );
  const takenSkus = new Set((await Product.distinct('SKU')).filter(Boolean));
  const missing = fashionProductsData
    .filter((product) => !existingSlugs.has(product.slug))
    .map((product) => buildProduct(product, takenSkus));
  if (missing.length) await Product.create(missing);

  return { addedCategories, addedProducts: missing.length, existingProducts: existingSlugs.size };
};

const PUBLIC_PRODUCT = { active: true, status: 'published', visibility: 'public' };

// Server start: a store with no product a shopper can see gets the demo catalog, so /shop and
// /products are never empty. Demo products that are present but hidden are published again.
// A store with at least one public product is left alone. AUTO_SEED_CATALOG=false turns this off.
const ensureCatalog = async () => {
  if (String(process.env.AUTO_SEED_CATALOG).toLowerCase() === 'false') return null;
  if (await Product.exists(PUBLIC_PRODUCT)) return null;
  const result = await addMissingCatalog();
  const restored = await Product.updateMany({ slug: { $in: fashionProductsData.map((p) => p.slug) } }, { $set: PUBLIC_PRODUCT });
  console.log(`[catalog] The store had no public products: added ${result.addedCategories} categories and ${result.addedProducts} products, published ${restored.modifiedCount} hidden ones.`);
  return { ...result, published: restored.modifiedCount };
};

const seedCatalog = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const { addedCategories, addedProducts, existingProducts } = await addMissingCatalog();
    console.log(`Added ${addedCategories} categories and ${addedProducts} products (${existingProducts} products already existed).`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Catalog seed failed:', error);
    process.exit(1);
  }
};

if (require.main === module) seedCatalog();

module.exports = { buildProduct, addMissingCatalog, ensureCatalog };
