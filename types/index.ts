export type ProductTag = 'New' | 'Bestseller' | 'Low Stock' | 'Sale' | 'Featured' | string;

export interface ProductVariantOption {
  id: string;
  name: string;
  value: string;
  colorHex?: string;
  priceDelta?: number;
  stock: number;
  sku?: string;
  image?: string;
}

export interface ProductVariantGroup {
  id: string;
  name: 'Size' | 'Color' | 'Material' | 'Storage' | 'Style' | string;
  options: ProductVariantOption[];
}

export interface VariantCombination {
  id: string;
  sku: string;
  price: number;
  stock: number;
  weight?: number;
  barcode?: string;
  status?: 'active' | 'inactive';
  images?: string[];
  attributes: Record<string, string>;
}

export interface ProductAttribute {
  name: string;
  value: string;
  group?: string;
}

export interface ProductPricing {
  price: number;
  originalPrice?: number;
  costPrice?: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  taxRate?: number;
  currency: string;
}

export interface ProductInventory {
  stock: number;
  reservedStock?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  allowBackorders?: boolean;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  warehouse?: string;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface ProductMedia {
  id?: string;
  url: string;
  alt?: string;
  isPrimary?: boolean;
  type?: 'image' | 'video';
  sortOrder?: number;
}

export interface ProductSEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
}

export type SEOInfo = ProductSEO;

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface ProductShipping {
  estimate?: string;
  freeShipping?: boolean;
  expressShipping?: boolean;
  returnPolicy?: string;
  cost?: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  length?: number;
  width?: number;
  height?: number;
  shippingClass?: string;
  packagingType?: string;
  countryOfOrigin?: string;
  hsCode?: string;
}

export type ShippingInfo = ProductShipping;

export interface ProductReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  helpfulCount?: number;
  photos?: string[];
  videos?: string[];
}

export interface Product {
  id: string | number;
  title: string;
  name?: string;
  slug?: string;
  sku?: string;
  SKU?: string;
  barcode?: string;
  brand: string;
  category: string;
  categoryId?: string | number;
  subcategory?: string;
  subcategoryId?: string | number;
  tags?: ProductTag[];
  status?: 'draft' | 'published' | 'archived';
  visibility?: 'public' | 'private' | 'hidden';
  featured?: boolean;
  isFeatured?: boolean;
  trending?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  bestseller?: boolean;
  image?: string;
  price: number;
  originalPrice?: number;
  salePrice?: number;
  discountPercentage: number;
  tax?: number;
  currency?: string;
  costPrice?: number;
  stock: number;
  totalStock?: number;
  reservedStock?: number;
  lowStockThreshold?: number;
  warehouse?: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  maxOrderQuantity?: number;
  minOrderQuantity?: number;
  allowBackorders?: boolean;
  allowBackorder?: boolean;
  trackInventory?: boolean;

  pricing?: ProductPricing;
  inventory?: ProductInventory;
  media?: ProductMedia[];

  variants?: ProductVariantGroup[];
  variantCombinations?: VariantCombination[];
  attributes?: ProductAttribute[];
  images: string[];
  videos?: string[];
  thumbnail: string;
  description: string;
  shortDescription?: string;
  specifications?: Record<string, string>;
  shippingInfo?: ProductShipping;
  shipping?: ProductShipping;
  seo?: ProductSEO;
  relatedProducts?: (Product | string)[];
  bundles?: (Product | string)[];
  reviews?: ProductReview[];
  rating: number;
  reviewCount?: number;
  soldCount?: number;
  wishlistCount?: number;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
  ratingDistribution?: RatingDistribution;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: VariantCombination;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role?: 'customer' | 'admin';
  createdAt?: string;
  updatedAt?: string;
  addresses?: Address[];
  twoFactorEnabled?: boolean;
  wishlist?: any[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface Order {
  id: string;
  orderNumber?: string;
  user?: User | { name: string; email: string };
  items?: CartItem[];
  products?: { product: Product; quantity: number; price: number }[];
  subtotal?: number;
  shipping?: number;
  tax?: number;
  total: number;
  address?: Address;
  shippingAddress?: Address;
  paymentMethod: string;
  paymentStatus?: string;
  orderStatus?: string;
  createdAt: string;
}
