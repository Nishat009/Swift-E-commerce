import { Product } from '@/types';
import apiClient from './apiClient';
import { fashionProducts } from '@/data/fashionCatalog';

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
  try {
    const response = await apiClient.get('/products', { params });
    if (response.data && response.data.products) {
      return {
        products: response.data.products,
        total: response.data.total ?? response.data.products.length,
        skip: response.data.skip ?? 0,
        limit: response.data.limit ?? response.data.products.length,
      };
    }
  } catch (error) {
    console.warn('Backend /products failed, falling back to local catalog:', error);
  }
  return {
    products: fashionProducts,
    total: fashionProducts.length,
    skip: 0,
    limit: fashionProducts.length,
  };
};

export const fetchProductById = async (id: string | number): Promise<Product> => {
  try {
    const response = await apiClient.get(`/products/${id}`);
    if (response.data?.data) {
      return response.data.data;
    }
    if (response.data?.title) {
      return response.data;
    }
  } catch (error) {
    console.warn(`Product ID ${id} not found on backend API, checking local catalog fallback.`);
  }

  // Fallback to local catalog by ID or slug/title
  const found = fashionProducts.find(
    (p) =>
      String(p.id) === String(id) ||
      String(p.title).toLowerCase().replace(/[^a-z0-9]+/g, '-') === String(id).toLowerCase()
  );
  if (found) {
    return found;
  }

  throw new Error(`Product not found with id: ${id}`);
};

export const fetchCategories = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get('/categories', { params: { format: 'names' } });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data.map((c: any) => c.slug || c.name || c);
    }
  } catch (e) {
    console.warn('Falling back to local categories');
  }
  return ['top', 'pants', 'dress', 'jacket', 'shoes', 'bag', 'jewelry', 'hat', 'glasses'];
};

export const searchProducts = async (query: string): Promise<{ products: Product[]; total: number }> => {
  try {
    const response = await apiClient.get('/products', { params: { search: query } });
    if (response.data?.products) {
      return {
        products: response.data.products,
        total: response.data.total ?? response.data.products.length,
      };
    }
  } catch (e) {
    console.warn('Search fallback to local catalog');
  }
  const filtered = fashionProducts.filter(
    (p) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase()) ||
      p.description?.toLowerCase().includes(query.toLowerCase())
  );
  return {
    products: filtered,
    total: filtered.length,
  };
};

