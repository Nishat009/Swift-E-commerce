// Replaces demo placeholders left in an existing database by older seed runs:
//  - the Marble Cutting Board pointed at an Unsplash photo that now returns 404
//  - campaigns carried a w3schools sample clip as their "winner review" video
// Safe to re-run.
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Campaign = require('../src/models/Campaign');

const BROKEN_IMAGE = /images\.unsplash\.com\/photo-1594794112455-6e3e57f2a15f/;
const MARBLE_BOARD_IMAGE = '/images/products/marble-cutting-board.jpg';
const PLACEHOLDER_VIDEO = /w3schools\.com\//i;

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart');

  const products = await Product.find({
    $or: [{ thumbnail: BROKEN_IMAGE }, { images: BROKEN_IMAGE }, { productImage: BROKEN_IMAGE }]
  });
  for (const product of products) {
    const swap = (url) => (BROKEN_IMAGE.test(url || '') ? MARBLE_BOARD_IMAGE : url);
    await Product.updateOne(
      { _id: product._id },
      {
        $set: {
          thumbnail: swap(product.thumbnail),
          productImage: swap(product.productImage),
          images: [...new Set((product.images || []).map(swap))],
        }
      }
    );
  }
  console.log(`Replaced the broken image on ${products.length} product(s).`);

  const videos = await Campaign.updateMany({ winnerVideoUrl: PLACEHOLDER_VIDEO }, { $set: { winnerVideoUrl: null } });
  console.log(`Removed the sample winner video from ${videos.modifiedCount} campaign(s).`);

  await mongoose.connection.close();
};

run().catch(async (err) => {
  console.error(`Fix failed: ${err.message}`);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
