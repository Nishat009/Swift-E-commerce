import apiClient from '@/lib/apiClient';
import { mockProducts } from '@/data/mockData';
import { Product } from '@/types';
import { normalizeProduct } from '@/utils/productUtils';

const STORAGE_KEY = 'swiftcart_products_dataset_v1';

export interface GetProductsParams {
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  stockStatus?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  newArrival?: boolean;
  bestseller?: boolean;
  sortBy?:
    | 'newest'
    | 'oldest'
    | 'price-asc'
    | 'price-desc'
    | 'name-asc'
    | 'name-desc'
    | 'popular'
    | 'stock-asc';
  page?: number;
  limit?: number;
}

export interface GetProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalProducts: number;
    publishedCount: number;
    draftCount: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
}

// Local dataset helper for offline fallback & session persistence
function getLocalDataset(): Product[] {
  if (typeof window === 'undefined') {
    return mockProducts.map(normalizeProduct);
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: Product[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeProduct);
      }
    }
  } catch (err) {
    console.error('Failed to parse local product dataset:', err);
  }
  const initial = mockProducts.map(normalizeProduct);
  saveLocalDataset(initial);
  return initial;
}

function saveLocalDataset(products: Product[]): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (err) {
      console.error('Failed to save product dataset to localStorage:', err);
    }
  }
}

export const productService = {
  /**
   * Retrieves products with search, multi-faceted filtering, sorting, and pagination.
   */
  async getProducts(params: GetProductsParams = {}): Promise<GetProductsResponse> {
    const {
      search = '',
      category = 'all',
      brand = 'all',
      status = 'all',
      stockStatus = 'all',
      minPrice = 0,
      maxPrice = 10000,
      featured = false,
      newArrival = false,
      bestseller = false,
      sortBy = 'newest',
      page = 1,
      limit = 10,
    } = params;

    let allProducts: Product[] = [];

    try {
      const res = await apiClient.get('/products', {
        params: { all: true, limit: 200 },
      });
      if (res.data?.products && Array.isArray(res.data.products)) {
        allProducts = res.data.products.map(normalizeProduct);
        saveLocalDataset(allProducts);
      } else {
        allProducts = getLocalDataset();
      }
    } catch (err) {
      allProducts = getLocalDataset();
    }

    // Calculate Summary Stats from complete dataset
    const summary = {
      totalProducts: allProducts.length,
      publishedCount: allProducts.filter((p) => (p.status || 'published') === 'published').length,
      draftCount: allProducts.filter((p) => p.status === 'draft').length,
      lowStockCount: allProducts.filter((p) => p.stock > 0 && p.stock <= (p.lowStockThreshold || 10)).length,
      outOfStockCount: allProducts.filter((p) => p.stock <= 0).length,
    };

    // Apply Search across Title, SKU, Brand, Category, Tags
    let filtered = [...allProducts];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const titleMatch = (p.title || p.name || '').toLowerCase().includes(q);
        const skuMatch = (p.sku || p.SKU || '').toLowerCase().includes(q);
        const brandMatch = (p.brand || '').toLowerCase().includes(q);
        const categoryMatch = (p.category || '').toLowerCase().includes(q);
        const tagMatch = p.tags?.some((t) => t.toLowerCase().includes(q));
        return titleMatch || skuMatch || brandMatch || categoryMatch || tagMatch;
      });
    }

    // Category Filter
    if (category !== 'all') {
      filtered = filtered.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Brand Filter
    if (brand !== 'all') {
      filtered = filtered.filter(
        (p) => p.brand.toLowerCase() === brand.toLowerCase()
      );
    }

    // Status Filter
    if (status !== 'all') {
      filtered = filtered.filter((p) => (p.status || 'published') === status);
    }

    // Stock Status Filter
    if (stockStatus !== 'all') {
      filtered = filtered.filter((p) => {
        const currentStock = p.stock ?? 0;
        const threshold = p.lowStockThreshold || 10;
        if (stockStatus === 'in_stock') return currentStock > threshold;
        if (stockStatus === 'low_stock') return currentStock > 0 && currentStock <= threshold;
        if (stockStatus === 'out_of_stock') return currentStock <= 0;
        return true;
      });
    }

    // Price Range Filter
    filtered = filtered.filter((p) => p.price >= minPrice && p.price <= maxPrice);

    // Toggles
    if (featured) filtered = filtered.filter((p) => p.featured || p.isFeatured);
    if (newArrival) filtered = filtered.filter((p) => p.newArrival);
    if (bestseller) filtered = filtered.filter((p) => p.bestSeller || p.bestseller);

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'name-desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'popular':
          return (b.rating || 0) * (b.reviewCount || 0) - (a.rating || 0) * (a.reviewCount || 0);
        case 'stock-asc':
          return a.stock - b.stock;
        default:
          return 0;
      }
    });

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (currentPage - 1) * limit;
    const paginatedProducts = filtered.slice(startIndex, startIndex + limit);

    return {
      products: paginatedProducts,
      total,
      page: currentPage,
      limit,
      totalPages,
      summary,
    };
  },

  /**
   * Fetches a single product by ID.
   */
  async getProductById(id: string | number): Promise<Product | null> {
    try {
      const res = await apiClient.get(`/products/${id}`);
      if (res.data?.data) {
        return normalizeProduct(res.data.data);
      }
      if (res.data?.product) {
        return normalizeProduct(res.data.product);
      }
    } catch (err) {
      console.warn('API fetch failed for product ID, checking local dataset:', id);
    }
    const local = getLocalDataset();
    const found = local.find((p) => String(p.id) === String(id));
    return found ? normalizeProduct(found) : null;
  },

  /**
   * Creates a new product and persists it.
   */
  async createProduct(productData: Partial<Product>): Promise<Product> {
    const newProduct: Product = normalizeProduct({
      ...productData,
      id: `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    try {
      const res = await apiClient.post('/products', newProduct);
      if (res.data?.data) {
        const created = normalizeProduct(res.data.data);
        const dataset = getLocalDataset();
        saveLocalDataset([created, ...dataset]);
        return created;
      }
    } catch (err) {
      console.warn('API create product offline fallback activated');
    }

    const dataset = getLocalDataset();
    const updatedDataset = [newProduct, ...dataset];
    saveLocalDataset(updatedDataset);
    return newProduct;
  },

  /**
   * Updates an existing product by ID.
   */
  async updateProduct(id: string | number, productData: Partial<Product>): Promise<Product> {
    let updatedProduct: Product;

    try {
      const res = await apiClient.put(`/products/${id}`, productData);
      if (res.data?.data) {
        updatedProduct = normalizeProduct(res.data.data);
      } else {
        updatedProduct = normalizeProduct({ ...productData, id, updatedAt: new Date().toISOString() });
      }
    } catch (err) {
      console.warn('API update product offline fallback activated');
      updatedProduct = normalizeProduct({ ...productData, id, updatedAt: new Date().toISOString() });
    }

    const dataset = getLocalDataset();
    const index = dataset.findIndex((p) => String(p.id) === String(id));
    if (index !== -1) {
      dataset[index] = { ...dataset[index], ...updatedProduct };
      saveLocalDataset(dataset);
    } else {
      saveLocalDataset([updatedProduct, ...dataset]);
    }
    return updatedProduct;
  },

  /**
   * Deletes a product by ID.
   */
  async deleteProduct(id: string | number): Promise<boolean> {
    try {
      await apiClient.delete(`/products/${id}`);
    } catch (err) {
      console.warn('API delete product offline fallback activated');
    }

    const dataset = getLocalDataset();
    const filtered = dataset.filter((p) => String(p.id) !== String(id));
    saveLocalDataset(filtered);
    return true;
  },

  /**
   * Duplicates an existing product with new ID, generated SKU, draft status, and zero stock.
   */
  async duplicateProduct(id: string | number): Promise<Product | null> {
    const existing = await this.getProductById(id);
    if (!existing) return null;

    const newSku = `COPY-${existing.sku || existing.SKU || 'SKU'}-${Math.floor(1000 + Math.random() * 9000)}`;

    const duplicatePayload: Partial<Product> = {
      ...existing,
      id: `prod_dup_${Date.now()}`,
      title: `${existing.title} (Copy)`,
      name: `${existing.title} (Copy)`,
      sku: newSku,
      SKU: newSku,
      status: 'draft',
      stock: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.createProduct(duplicatePayload);
  },

  /**
   * Executes bulk actions (delete, publish, archive) on multiple products.
   */
  async bulkAction(action: 'delete' | 'publish' | 'archive', ids: (string | number)[]): Promise<boolean> {
    const stringIds = ids.map((id) => String(id));
    try {
      await apiClient.post('/products/bulk', { productIds: stringIds, action });
    } catch (err) {
      console.warn('API bulk operation offline fallback activated');
    }

    const dataset = getLocalDataset();
    let updated: Product[];

    if (action === 'delete') {
      updated = dataset.filter((p) => !stringIds.includes(String(p.id)));
    } else {
      const targetStatus = action === 'publish' ? 'published' : 'archived';
      updated = dataset.map((p) =>
        stringIds.includes(String(p.id)) ? { ...p, status: targetStatus, updatedAt: new Date().toISOString() } : p
      );
    }

    saveLocalDataset(updated);
    return true;
  },

  /**
   * Exports products list to JSON downloadable file.
   */
  exportProducts(products: Product[]): void {
    const jsonStr = JSON.stringify(products, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swiftcart_products_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Imports product records from JSON string.
   */
  importProducts(jsonText: string): Product[] {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) {
      throw new Error('Import data must be a JSON array of products.');
    }
    const importedProducts = parsed.map(normalizeProduct);
    const existing = getLocalDataset();
    const merged = [...importedProducts, ...existing];
    saveLocalDataset(merged);
    return merged;
  },
};
