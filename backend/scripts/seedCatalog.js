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

const seedCatalog = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

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

    console.log(`Added ${addedCategories} categories and ${missing.length} products (${existingSlugs.size} products already existed).`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Catalog seed failed:', error);
    process.exit(1);
  }
};

if (require.main === module) seedCatalog();

module.exports = { buildProduct };
