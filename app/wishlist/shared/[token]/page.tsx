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
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-16">
        <EmptyState icon={Heart} title="Wishlist not available" description={error} actionText="Browse Shop" actionLink="/products" />
      </div>
    );
  }

  const collection = data?.collections.find((c) => c.name === active);
  const products = data ? (collection ? data.products.filter((p) => collection.productIds.includes(String(p.id))) : data.products) : [];

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-10 sm:py-14 space-y-8">
      <div className="border-b border-line pb-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400 mb-3">Shared wishlist</p>
        <h1 className="text-4xl sm:text-5xl font-serif font-medium tracking-tight text-ink">
          {data ? `${data.owner}'s wishlist` : 'Shared wishlist'}
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-3">A read-only list of saved products.</p>
      </div>

      {data && data.collections.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {['all', ...data.collections.map((c) => c.name)].map((name) => (
            <button
              key={name}
              onClick={() => setActive(name)}
              className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors cursor-pointer ${active === name
                ? 'bg-ink text-paper border-ink'
                : 'text-stone-600 dark:text-stone-300 border-line hover:border-ink'}`}
            >
              {name === 'all' ? 'All' : name}
            </button>
          ))}
        </div>
      )}

      {!data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
          <ProductSkeleton />
          <ProductSkeleton />
          <ProductSkeleton />
          <ProductSkeleton />
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon={Heart} title="Nothing here yet" description="This wishlist has no available products right now." actionText="Browse Shop" actionLink="/products" />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
