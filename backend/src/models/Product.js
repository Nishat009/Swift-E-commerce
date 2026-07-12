const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: '' },
    category: { type: String, required: true }, // Store category as string for frontend category matching (e.g. 'sofa', 'chair')
    brand: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 }, // Keep discountPercentage for frontend compatibility
    stock: { type: Number, required: true, min: 0, default: 0 },
    SKU: { type: String, unique: true, sparse: true },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    images: [{ type: String }],
    thumbnail: { type: String, required: true },
    specifications: {
      type: Map,
      of: String,
      default: {}
    },
    tags: [{ type: String }],
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Slugify product title before validation
ProductSchema.pre('validate', function (next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  
  // Calculate discount percentage if sale price is provided
  if (this.price && this.salePrice) {
    this.discountPercentage = Math.round(((this.price - this.salePrice) / this.price) * 100);
  }
  
  next();
});

ProductSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Product', ProductSchema);
