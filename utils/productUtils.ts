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
 * Price the shopper pays: list price minus the product-level discount.
 */
export function getEffectivePrice(product: Pick<Product, 'price' | 'discountPercentage'>): number {
  return (product.price || 0) * (1 - (product.discountPercentage || 0) / 100);
}

export const BADGE_FILTERS = ['Bestseller', 'New', 'Low Stock', 'Sale', 'Featured'] as const;

/**
 * Whether a product carries a storefront badge. The API computes the badges (one set of rules in
 * backend/src/utils/productBadges.js, also used by the ?tag= filter), so the counts shown next to
 * the filters always match the filtered results.
 */
export function matchesBadge(product: Product, badge: string): boolean {
  return (product.badges || []).includes(badge);
}

/**
 * Sizes a product comes in, from its "Sizes" specification ("XS, S, M") or its Size variant options.
 */
export function getProductSizes(product: Product): string[] {
  const fromSpec = String(product.specifications?.Sizes || '').split(',');
  const fromVariants = (product.variants || [])
    .filter((group) => /^size$/i.test(group.name))
    .flatMap((group) => group.options.map((opt) => opt.value || opt.name));
  return Array.from(new Set([...fromSpec, ...fromVariants].map((s) => String(s).trim().toUpperCase()).filter(Boolean)));
}

/**
 * Colour family used by the colour filter (specifications.ColorName or Color variant options).
 */
export function getProductColors(product: Product): string[] {
  const fromSpec = product.specifications?.ColorName ? [product.specifications.ColorName] : [];
  const fromVariants = (product.variants || [])
    .filter((group) => /^colou?r$/i.test(group.name))
    .flatMap((group) => group.options.map((opt) => opt.value || opt.name));
  return Array.from(new Set([...fromSpec, ...fromVariants].map((c) => String(c).trim()).filter(Boolean)));
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

  // Keep every field the API sent (sku, slug, status, visibility, ...) and fill in safe defaults on top
  const normalized: Product = {
    ...(raw as Product),
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
