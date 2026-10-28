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
  /** Storefront badges computed by the API (backend/src/utils/productBadges.js), e.g. ['Sale', 'New'] */
  badges?: string[];
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
  productImage?: string;
  modelWearingImage?: string | null;
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
  googleConnected?: boolean;
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
  products?: { product: Product; quantity: number; price: number; variant?: { id?: string; name?: string; sku?: string } }[];
  coupon?: string;
  subtotal?: number;
  shipping?: number;
  deliveryZone?: '' | 'inside_dhaka' | 'outside_dhaka';
  tax?: number;
  total: number;
  refund?: { amount?: number; at?: string; by?: string; byName?: string; reference?: string; note?: string };
  returnRequest?: ReturnRequest;
  /** Last day the customer may ask to return a delivered order (null otherwise) */
  returnDeadline?: string | null;
  deliveredAt?: string | null;
  address?: Address;
  shippingAddress?: Address;
  paymentMethod: string;
  paymentStatus?: string;
  orderStatus?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReturnRequest {
  /** Requested -> Proposed (refund offer) -> Accepted | Declined -> Approved (refund paid); Rejected at any open step */
  status: '' | 'Requested' | 'Proposed' | 'Accepted' | 'Declined' | 'Approved' | 'Rejected';
  reason?: string;
  details?: string;
  requestedAt?: string;
  decidedAt?: string;
  decidedByName?: string;
  /** Staff reply shown to the customer */
  response?: string;
  proposal?: RefundProposal;
}

/** The refund offered for a return: product price only, less a handling charge for a late return */
export interface RefundProposal {
  productAmount: number;
  /** Delivery charge, never refunded */
  shippingExcluded: number;
  deduction: number;
  amount: number;
  remarks?: string;
  late?: boolean;
  daysAfterDelivery?: number;
  proposedAt?: string;
  proposedByName?: string;
  respondedAt?: string;
  customerNote?: string;
}

/** Same as the server's FULL_REFUND_DAYS: a return asked for within this many days of delivery gets the full product price back */
export const FULL_REFUND_DAYS = 3;

/** Same list as the server's RETURN_REASONS */
export const RETURN_REASONS = ['Wrong size or fit', 'Damaged or defective', 'Not as described', 'Wrong item received', 'Changed my mind', 'Other'] as const;
