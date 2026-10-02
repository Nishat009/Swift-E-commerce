import apiClient from '@/lib/apiClient';
import { Product } from '@/types';
import { normalizeProduct } from '@/utils/productUtils';

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

const errMessage = (err: any, fallback: string): string => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (!err?.response) return 'Cannot reach the server. Check that the backend is running and try again.';
  return err?.message || fallback;
};

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
      // Pull the full catalogue (including drafts/archived) page by page; filtering/sorting is done client side
      const pageSize = 200;
      let fetchedPage = 1;
      let pages = 1;
      do {
        const res = await apiClient.get('/products', {
          params: { all: true, limit: pageSize, page: fetchedPage },
        });
        if (!res.data?.products || !Array.isArray(res.data.products)) {
          throw new Error('Unexpected response while loading products');
        }
        allProducts.push(...res.data.products.map(normalizeProduct));
        pages = Number(res.data.pages) || 1;
        fetchedPage += 1;
      } while (fetchedPage <= pages);
    } catch (err: any) {
      throw new Error(errMessage(err, 'Failed to fetch products from server'));
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
      return null;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw new Error(errMessage(err, `Failed to fetch product ${id}`));
    }
  },

  /**
   * Creates a new product and persists it.
   */
  async createProduct(productData: Partial<Product>): Promise<Product> {
    try {
      const payload: Record<string, any> = { ...productData };
      delete payload.id;
      delete payload._id;
      delete payload.createdAt;
      delete payload.updatedAt;
      const res = await apiClient.post('/products', payload);
      if (res.data?.data) {
        return normalizeProduct(res.data.data);
      }
      throw new Error(res.data?.message || 'Failed to create product');
    } catch (err: any) {
      throw new Error(errMessage(err, 'Error creating product on server'));
    }
  },

  /**
   * Updates an existing product by ID.
   */
  async updateProduct(id: string | number, productData: Partial<Product>): Promise<Product> {
    try {
      const res = await apiClient.put(`/products/${id}`, productData);
      if (res.data?.data) {
        return normalizeProduct(res.data.data);
      }
      throw new Error(res.data?.message || 'Failed to update product');
    } catch (err: any) {
      throw new Error(errMessage(err, 'Error updating product on server'));
    }
  },

  /**
   * Deletes a product by ID.
   */
  async deleteProduct(id: string | number): Promise<boolean> {
    try {
      await apiClient.delete(`/products/${id}`);
      return true;
    } catch (err: any) {
      throw new Error(errMessage(err, 'Error deleting product on server'));
    }
  },

  /**
   * Duplicates a product on the server (copy is created as a draft with a fresh SKU).
   */
  async duplicateProduct(id: string | number): Promise<Product | null> {
    try {
      const res = await apiClient.post(`/products/${id}/duplicate`);
      return res.data?.data ? normalizeProduct(res.data.data) : null;
    } catch (err: any) {
      throw new Error(errMessage(err, 'Error duplicating product on server'));
    }
  },

  /**
   * Executes bulk actions (delete = archive, publish, archive) on multiple products.
   */
  async bulkAction(action: 'delete' | 'publish' | 'archive', ids: (string | number)[]): Promise<boolean> {
    try {
      await apiClient.post('/products/bulk', { productIds: ids.map((id) => String(id)), action });
      return true;
    } catch (err: any) {
      throw new Error(errMessage(err, 'Error executing bulk operation on server'));
    }
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
   * Imports product records from a JSON array by creating each one on the server.
   * Returns how many were created and the per-record failures.
   */
  async importProducts(jsonText: string): Promise<{ created: number; failed: { title: string; message: string }[] }> {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) {
      throw new Error('Import data must be a JSON array of products.');
    }
    let created = 0;
    const failed: { title: string; message: string }[] = [];
    for (const raw of parsed) {
      try {
        const item: Record<string, any> = { ...raw };
        delete item.id;
        delete item._id;
        delete item.slug;
        delete item.createdAt;
        delete item.updatedAt;
        await this.createProduct(item);
        created += 1;
      } catch (err: any) {
        failed.push({ title: String(raw?.title || raw?.name || 'Untitled'), message: err.message });
      }
    }
    return { created, failed };
  },
};
