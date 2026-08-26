const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true },
    sku: { type: String, sparse: true },
    SKU: { type: String, sparse: true }, // Keep SKU for backward compatibility
    barcode: { type: String, default: '' },
    description: { type: String, required: true },
    shortDescription: { type: String, default: '' },
    category: { type: String, required: true },
    subcategory: { type: String, default: '' },
    brand: { type: String, required: true, trim: true },
    tags: [{ type: String }],
    
    // Status & Visibility
    status: { 
      type: String, 
      enum: ['draft', 'published', 'archived'], 
      default: 'published' 
    },
    visibility: { 
      type: String, 
      enum: ['public', 'private', 'hidden'], 
      default: 'public' 
    },
    
    // Badges / Flags
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    active: { type: Boolean, default: true },

    // Pricing & Tax
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    salePrice: { type: Number, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    costPrice: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 },

    // Inventory & Warehousing
    stock: { type: Number, required: true, min: 0, default: 0 },
    totalStock: { type: Number, min: 0 },
    reservedStock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    warehouse: { type: String, default: 'Main Warehouse' },
    stockStatus: { 
      type: String, 
      enum: ['in_stock', 'out_of_stock', 'backorder'], 
      default: 'in_stock' 
    },
    maxOrderQuantity: { type: Number, default: 10 },
    minOrderQuantity: { type: Number, default: 1 },
    allowBackorders: { type: Boolean, default: false },
    trackInventory: { type: Boolean, default: true },

    // Media
    images: [{ type: String }],
    videos: [{ type: String }],
    thumbnail: { type: String, required: true },
    productImage: { type: String }, // Conceptual alias for primary storefront image
    modelWearingImage: { type: String, default: null }, // Dedicated image of a model wearing this exact product for Dress Room

    // Specifications & Attributes
    specifications: {
      type: Map,
      of: String,
      default: {}
    },
    attributes: [
      {
        name: { type: String, required: true },
        value: { type: String, required: true },
        group: { type: String, default: 'General' }
      }
    ],

    // Variants Definition & Combinations Matrix
    variants: [
      {
        id: String,
        name: String,
        options: [
          {
            id: String,
            name: String,
            value: String,
            colorHex: String,
            priceDelta: Number,
            stock: Number,
            sku: String,
            image: String
          }
        ]
      }
    ],
    variantCombinations: [
      {
        id: String,
        sku: String,
        price: Number,
        stock: Number,
        weight: Number,
        barcode: String,
        status: { type: String, default: 'active' },
        images: [String],
        attributes: { type: Map, of: String }
      }
    ],

    // Shipping Parameters
    shippingInfo: {
      estimate: { type: String, default: 'Standard Delivery (2 - 4 Business Days)' },
      freeShipping: { type: Boolean, default: true },
      expressShipping: { type: Boolean, default: false },
      returnPolicy: { type: String, default: '30-Day Hassle-Free Returns' },
      cost: { type: Number, default: 0 },
      weight: { type: Number, default: 0.5 },
      dimensions: {
        length: { type: Number, default: 10 },
        width: { type: Number, default: 10 },
        height: { type: Number, default: 10 }
      },
      shippingClass: { type: String, default: 'Standard' },
      packagingType: { type: String, default: 'Box' },
      countryOfOrigin: { type: String, default: 'United States' },
      hsCode: { type: String, default: '' }
    },

    // SEO Parameters
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      keywords: [{ type: String }],
      canonicalUrl: { type: String, default: '' },
      ogImage: { type: String, default: '' }
    },

    // Related Products / Bundles
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    bundles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    // Social & Rating Metrics
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    ratingDistribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    },

    // Customer Reviews List
    reviews: [
      {
        id: String,
        userId: String,
        userName: String,
        userAvatar: String,
        rating: Number,
        comment: String,
        date: String,
        verified: Boolean,
        helpfulCount: { type: Number, default: 0 },
        photos: [String],
        videos: [String]
      }
    ]
  },
  { timestamps: true }
);

// Slugify product title & calculate derived pricing metrics before validation
ProductSchema.pre('validate', function (next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  if (!this.sku && this.SKU) {
    this.sku = this.SKU;
  }
  if (!this.SKU && this.sku) {
    this.SKU = this.sku;
  }
  
  if (this.originalPrice && this.originalPrice > this.price) {
    this.discountAmount = this.originalPrice - this.price;
    this.discountPercentage = Math.round((this.discountAmount / this.originalPrice) * 100);
  } else if (this.price && this.salePrice) {
    this.discountAmount = this.price - this.salePrice;
    this.discountPercentage = Math.round((this.discountAmount / this.price) * 100);
  }

  if (this.costPrice && this.price) {
    const profit = this.price - this.costPrice;
    this.profitMargin = this.price > 0 ? Math.round((profit / this.price) * 100) : 0;
  }

  if (this.stock <= 0) {
    this.stockStatus = 'out_of_stock';
  } else {
    this.stockStatus = 'in_stock';
  }
  
  if (!this.productImage && (this.thumbnail || (this.images && this.images.length > 0))) {
    this.productImage = this.thumbnail || this.images[0];
  }

  next();
});

ProductSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.productImage = ret.productImage || ret.thumbnail || (ret.images && ret.images[0]) || '';
    ret.modelWearingImage = ret.modelWearingImage || null;
    return ret;
  }
});

ProductSchema.index({ active: 1, createdAt: -1 });
ProductSchema.index({ category: 1, active: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ featured: 1, active: 1 });
ProductSchema.index({ trending: 1, active: 1 });
ProductSchema.index({ title: 'text', brand: 'text', category: 'text', description: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
