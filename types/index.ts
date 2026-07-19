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
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
  specifications?: Record<string, string>;
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

