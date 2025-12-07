import { Product } from '@/types';
import {
  mockProducts,
  mockCategories,
  getProductsByCategory,
  searchProducts as searchMockProducts,
  getProductById,
} from '@/data/mockData';

// Simulate API delay for realistic feel
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchProducts = async (params?: {
  limit?: number;
  skip?: number;
  category?: string;
  search?: string;
}): Promise<{ products: Product[]; total: number; skip: number; limit: number }> => {
  await delay(300); // Simulate network delay

  let products: Product[] = [];

  if (params?.search) {
    products = searchMockProducts(params.search);
  } else if (params?.category) {
    products = getProductsByCategory(params.category);
  } else {
    products = mockProducts;
  }

  const skip = params?.skip || 0;
  const limit = params?.limit || 12;
  const total = products.length;
  const paginatedProducts = products.slice(skip, skip + limit);

  return {
    products: paginatedProducts,
    total,
    skip,
    limit,
  };
};

export const fetchProductById = async (id: number): Promise<Product> => {
  await delay(200);
  const product = getProductById(id);
  if (!product) {
    throw new Error('Product not found');
  }
  return product;
};

export const fetchCategories = async (): Promise<string[]> => {
  await delay(100);
  return mockCategories.filter((cat) => cat !== 'all');
};

export const searchProducts = async (query: string): Promise<{ products: Product[]; total: number }> => {
  await delay(300);
  const products = searchMockProducts(query);
  return {
    products,
    total: products.length,
  };
};

