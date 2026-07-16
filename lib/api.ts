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
}): Promise<{ products: Product[]; total: number; skip: number; limit: number }> => {
  const response = await apiClient.get('/products', { params });
  return {
    products: response.data.products,
    total: response.data.total,
    skip: response.data.skip,
    limit: response.data.limit,
  };
};

export const fetchProductById = async (id: string | number): Promise<Product> => {
  const response = await apiClient.get(`/products/${id}`);
  return response.data.data;
};

export const fetchCategories = async (): Promise<string[]> => {
  // Use format=names query parameter to return array of strings for frontend compatibility
  const response = await apiClient.get('/categories', { params: { format: 'names' } });
  return response.data;
};

export const searchProducts = async (query: string): Promise<{ products: Product[]; total: number }> => {
  const response = await apiClient.get('/products', { params: { search: query } });
  return {
    products: response.data.products,
    total: response.data.total,
  };
};

