'use client';

import React, { useState } from 'react';
import ProductCard from '@/components/ui/ProductCard';
import { useAIRecommendation } from '@/hooks/useAIRecommendation';
import { useCatalog } from '@/hooks/useCatalog';
import { Product } from '@/types';

type Tab = 'for-you' | 'look' | 'viewed' | 'trending';

/** Recommendation rail for the shop home: one grid, with a tab per recommendation group. */
export default function AIPicksForYou({ products }: { products?: Product[] }) {
  const { products: catalogProducts } = useCatalog();
  const {
    recommendedForYou,
    completeTheLook,
    becauseYouViewed,
    trendingForStyle,
  } = useAIRecommendation(products ?? catalogProducts);
  const [tab, setTab] = useState<Tab>('for-you');

  const tabs: { id: Tab; label: string; items: Product[] }[] = ([
    { id: 'for-you', label: 'Picked for you', items: recommendedForYou },
    { id: 'look', label: 'Complete the look', items: completeTheLook },
    { id: 'viewed', label: 'More to explore', items: becauseYouViewed },
    { id: 'trending', label: 'Trending now', items: trendingForStyle },
  ] as { id: Tab; label: string; items: Product[] }[]).filter((t) => t.items.length > 0);

  if (tabs.length === 0) return null;
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];

  return (
    <section className="space-y-8 py-20 sm:py-24">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-stone-500">Curated by our stylist</p>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Chosen for you</h2>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto px-4 md:mx-0 md:px-0" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active.id === t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 border-b pb-1.5 text-[13px] tracking-wide transition-colors cursor-pointer ${
                active.id === t.id ? 'border-ink text-ink' : 'border-transparent text-stone-500 hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
        {active.items.slice(0, 4).map((product, idx) => (
          <ProductCard key={`${active.id}-${product.id}`} product={product} index={idx} />
        ))}
      </div>
    </section>
  );
}
