import { Product } from '@/types';
import apiClient from './apiClient';

export const fetchProducts = async (params?: {
  limit?: number;
  skip?: number;
  category?: string;
  search?: string;
  sortBy?: string;
  priceMin?: number;
  priceMax?: number;
  color?: string;
  size?: string;
  tag?: string;
  brand?: string;
}): Promise<{ products: Product[]; total: number; skip: number; limit: number }> => {
  const response = await apiClient.get('/products', { params });
  if (!response.data || !Array.isArray(response.data.products)) {
    throw new Error('Invalid product response from server');
  }
  return {
    products: response.data.products,
    total: response.data.total ?? response.data.products.length,
    skip: response.data.skip ?? 0,
    limit: response.data.limit ?? response.data.products.length,
  };
};

export const fetchProductById = async (id: string | number): Promise<Product> => {
  const response = await apiClient.get(`/products/${id}`);
  const product = response.data?.data ?? (response.data?.title ? response.data : null);
  if (!product) {
    throw new Error(`Product not found with id: ${id}`);
  }
  return product;
};

export const fetchCategories = async (): Promise<string[]> => {
  const response = await apiClient.get('/categories', { params: { format: 'names' } });
  if (Array.isArray(response.data)) {
    return response.data;
  }
  if (Array.isArray(response.data?.data)) {
    return response.data.data.map((c: any) => c.slug || c.name || c);
  }
  return [];
};

export const searchProducts = async (query: string): Promise<{ products: Product[]; total: number }> => {
  const response = await apiClient.get('/products', { params: { search: query } });
  const products: Product[] = response.data?.products ?? [];
  return { products, total: response.data?.total ?? products.length };
};
