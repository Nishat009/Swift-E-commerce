'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types';
import { fetchProducts } from '@/lib/api';
import { normalizeProduct } from '@/utils/productUtils';

// One shared request for the whole page: every component that needs the live
// catalog (dressing room, AI stylist, search suggestions...) reads the same DB data.
let catalogPromise: Promise<Product[]> | null = null;
let catalogCache: Product[] | null = null;

export const loadCatalog = (force = false): Promise<Product[]> => {
  if (force) {
    catalogPromise = null;
    catalogCache = null;
  }
  if (!catalogPromise) {
    // The public API returns at most 200 products per request (enough for the whole demo catalog)
    catalogPromise = fetchProducts({ limit: 200 })
      .then((res) => {
        catalogCache = res.products.map(normalizeProduct);
        return catalogCache;
      })
      .catch((err) => {
        catalogPromise = null; // allow retry on next mount
        throw err;
      });
  }
  return catalogPromise;
};

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>(catalogCache || []);
  const [loading, setLoading] = useState(!catalogCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadCatalog()
      .then((list) => {
        if (active) {
          setProducts(list);
          setError(null);
        }
      })
      .catch(() => {
        if (active) setError('Could not load products from the store. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { products, loading, error };
}
