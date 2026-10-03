'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import EmptyState from '@/components/ui/EmptyState';
import { ProductSkeleton } from '@/components/ui/Skeleton';
import { normalizeProduct } from '@/utils/productUtils';
import { Heart } from 'lucide-react';

type SharedWishlist = {
  owner: string;
  products: Product[];
  collections: { name: string; productIds: string[] }[];
};

// Read-only view of a wishlist someone shared (FR-1.18)
export default function SharedWishlistPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedWishlist | null>(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState('all');

  useEffect(() => {
    apiClient.get(`/wishlist/shared/${token}`)
      .then((res) => setData({ ...res.data.data, products: res.data.data.products.map(normalizeProduct) }))
      .catch((err) => setError(err?.response?.data?.message || 'This wishlist link is not valid.'));
  }, [token]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState icon={Heart} title="Wishlist not available" description={error} actionText="Browse Shop" actionLink="/products" />
      </div>
    );
  }

  const collection = data?.collections.find((c) => c.name === active);
  const products = data ? (collection ? data.products.filter((p) => collection.productIds.includes(String(p.id))) : data.products) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif text-gray-900 dark:text-white">
          {data ? `${data.owner}'s wishlist` : 'Shared wishlist'}
        </h1>
        <p className="text-xs text-text-muted mt-1">A read-only list of saved products.</p>
      </div>

      {data && data.collections.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {['all', ...data.collections.map((c) => c.name)].map((name) => (
            <button
              key={name}
              onClick={() => setActive(name)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${active === name
                ? 'bg-[#8b6f47] text-white border-[#8b6f47]'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
            >
              {name === 'all' ? 'All' : name}
            </button>
          ))}
        </div>
      )}

      {!data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProductSkeleton />
          <ProductSkeleton />
          <ProductSkeleton />
          <ProductSkeleton />
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon={Heart} title="Nothing here yet" description="This wishlist has no available products right now." actionText="Browse Shop" actionLink="/products" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
