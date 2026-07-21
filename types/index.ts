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
  name: 'Size' | 'Color' | 'Style' | string;
  options: ProductVariantOption[];
}

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface ShippingInfo {
  estimate: string;
  freeShipping: boolean;
  returnPolicy: string;
  cost?: number;
}

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
}

export interface Product {
  id: string | number;
  title: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  totalStock?: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
  specifications?: Record<string, string>;
  variants?: ProductVariantGroup[];
  reviewCount?: number;
  ratingDistribution?: RatingDistribution;
  tags?: ProductTag[];
  shippingInfo?: ShippingInfo;
  reviews?: ProductReview[];
}

export interface CartItem {
  product: Product;
  quantity: number;
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

