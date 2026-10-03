const mongoose = require('mongoose');

// FR-1.18: named folders inside the wishlist. A product can sit in several collections;
// `products` stays the full list of saved items.
const CollectionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
});

// Per-product alert preferences. Products without an entry use both alerts on.
const AlertPrefSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  priceDrop: { type: Boolean, default: true },
  backInStock: { type: Boolean, default: true },
}, { _id: false });

const WishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    collections: { type: [CollectionSchema], default: [] },
    alerts: { type: [AlertPrefSchema], default: [] },
    // Public read-only share link (/wishlist/shared/:token); empty when sharing is off
    shareToken: { type: String, default: undefined, index: { unique: true, sparse: true } },
  },
  { timestamps: true }
);

WishlistSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Wishlist', WishlistSchema);
