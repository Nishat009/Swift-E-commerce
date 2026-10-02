import { Product, ProductTag, ProductVariantGroup, RatingDistribution, ShippingInfo, ProductReview } from '@/types';

/**
 * Calculates total stock across product base stock and all variant option stocks.
 */
export function calculateTotalStock(product: Partial<Product>): number {
  if (product.variants && product.variants.length > 0) {
    // If variants exist, calculate sum of option stocks for the main variant dimension (e.g. Size or Color)
    const primaryGroup = product.variants[0];
    if (primaryGroup && primaryGroup.options && primaryGroup.options.length > 0) {
      return primaryGroup.options.reduce((acc, opt) => acc + (opt.stock || 0), 0);
    }
  }
  return product.stock ?? 0;
}

/**
 * Dynamically derives product tags based on stock, sale price, and creation status.
 */
export function deriveProductTags(product: Partial<Product>): ProductTag[] {
  const tags: Set<ProductTag> = new Set(product.tags || []);
  const totalStock = calculateTotalStock(product);

  if (totalStock > 0 && totalStock <= 10) {
    tags.add('Low Stock');
  }

  if (product.salePrice && product.salePrice < (product.price || 0)) {
    tags.add('Sale');
  }

  if ((product.rating || 0) >= 4.7 && (product.reviewCount || 0) >= 10) {
    tags.add('Bestseller');
  }

  return Array.from(tags);
}

/**
 * Normalizes a raw/partial product payload to guarantee all rich attributes, fallbacks,
 * variant defaults, rating distributions, and shipping details exist without runtime errors.
 */
export function normalizeProduct(raw: Partial<Product>): Product {
  const stock = raw.stock ?? 0;
  const price = raw.price ?? 0;
  const rating = raw.rating ?? 0;
  const reviews: ProductReview[] = raw.reviews || [];

  const reviewCount = raw.reviewCount ?? (raw as any).totalReviews ?? reviews.length;

  const defaultRatingDistribution: RatingDistribution = raw.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  const defaultShippingInfo: ShippingInfo = raw.shippingInfo || {
    estimate: 'Standard Delivery (2 - 4 Business Days)',
    freeShipping: price > 50,
    returnPolicy: '30-Day Hassle-Free Returns & Money-Back Guarantee',
    cost: price > 50 ? 0 : 5.99,
  };

  const images = raw.images && raw.images.length > 0 ? raw.images : [raw.thumbnail || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop'];

  const normalized: Product = {
    id: raw.id ?? 'unknown-id',
    title: raw.title || 'Untitled Product',
    description: raw.description || '',
    shortDescription: raw.shortDescription || (raw.description ? raw.description.slice(0, 120) + '...' : ''),
    price,
    salePrice: raw.salePrice,
    discountPercentage: raw.discountPercentage ?? (raw.salePrice ? Math.round(((price - raw.salePrice) / price) * 100) : 0),
    rating,
    stock,
    totalStock: raw.totalStock ?? calculateTotalStock(raw),
    brand: raw.brand || '',
    category: raw.category || 'General',
    thumbnail: raw.thumbnail || images[0],
    productImage: raw.productImage || raw.thumbnail || images[0],
    modelWearingImage: raw.modelWearingImage || null,
    images,
    specifications: raw.specifications || {},
    variants: raw.variants || [],
    reviewCount,
    ratingDistribution: defaultRatingDistribution,
    tags: raw.tags || deriveProductTags({ ...raw, stock, rating, reviewCount }),
    shippingInfo: defaultShippingInfo,
    reviews,
  };

  return normalized;
}
