// Fills specifications.Sizes / specifications.ColorName on existing products so the
// storefront size and colour filters have data. Safe to re-run: only changed products are saved.
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const { deriveFilterSpecs } = require('./filterMetadata');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart');
  const products = await Product.find({});
  console.log(`Found ${products.length} products.`);

  let updated = 0;
  for (const product of products) {
    const derived = deriveFilterSpecs(product);
    const changed = Object.entries(derived).filter(([key, value]) => product.specifications?.get(key) !== value);
    if (!changed.length) continue;
    // Direct $set so the save hooks don't recompute unrelated fields (pricing, stock status)
    await Product.updateOne(
      { _id: product._id },
      { $set: Object.fromEntries(changed.map(([key, value]) => [`specifications.${key}`, value])) }
    );
    updated++;
  }

  console.log(`Filter metadata updated on ${updated} products.`);
  await mongoose.connection.close();
};

run().catch(async (err) => {
  console.error(`Migration failed: ${err.message}`);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
