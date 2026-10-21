'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import { ProductSkeleton } from '@/components/ui/Skeleton';
import CategoryGrid, { CategoryTile } from '@/components/ui/CategoryGrid';
import CinematicFashionHero from '@/components/ui/CinematicFashionHero';
import { fetchProducts } from '@/lib/api';
import { cachedGet } from '@/lib/cachedGet';
import { Product } from '@/types';

const TABS = [
  { key: 'new', label: 'New in' },
  { key: 'best', label: 'Bestsellers' },
] as const;

const PERKS = [
  { icon: Truck, label: 'Fast delivery' },
  { icon: RotateCcw, label: 'Easy returns' },
  { icon: ShieldCheck, label: 'Secure payment' },
  { icon: Headphones, label: 'Real support' },
];

export default function ShopHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryTile[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('new');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    Promise.all([
      fetchProducts({ limit: 100 }).catch(() => null),
      cachedGet('/categories').catch(() => null),
    ]).then(([res, cats]) => {
      const prods = res?.products || [];
      setProducts(prods);
      setStatus(res ? 'ready' : 'error');
      const fromApi = Array.isArray(cats?.data)
        ? cats.data.filter((c: any) => c && typeof c === 'object' && c.name && c.slug)
        : [];
      if (fromApi.length) {
        setCategories(fromApi);
        return;
      }
      // No categories configured: one tile per category found in the catalog
      const seen = new Map<string, CategoryTile>();
      for (const p of prods) {
        const slug = p.category?.toLowerCase();
        if (slug && !seen.has(slug)) {
          seen.set(slug, { slug, name: p.category.charAt(0).toUpperCase() + p.category.slice(1), image: p.thumbnail || p.images?.[0] });
        }
      }
      setCategories(Array.from(seen.values()));
    });
  }, [attempt]);

  const picked = tab === 'new' ? products.filter((p) => p.newArrival) : products.filter((p) => p.bestSeller);
  const shown = (picked.length ? picked : products).slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <CinematicFashionHero />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-serif text-2xl text-gray-900 sm:text-3xl dark:text-white">Shop by category</h2>
          <Link href="/products" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <CategoryGrid categories={categories} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="flex gap-5">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-pressed={tab === t.key}
                className={`font-serif text-2xl transition-colors sm:text-3xl ${tab === t.key ? 'text-gray-900 dark:text-white' : 'text-gray-300 hover:text-gray-500 dark:text-gray-600'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Link href="/products" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
            Shop all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {status === 'loading' && (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4" aria-busy="true" aria-label="Loading products">
            {Array.from({ length: 4 }, (_, i) => <ProductSkeleton key={i} />)}
          </div>
        )}
        {status === 'error' && (
          <div className="rounded-2xl bg-[#f3f1ed] px-6 py-10 text-center dark:bg-gray-900">
            <p className="text-sm text-gray-600 dark:text-gray-400">We couldn’t load the products. The server may be waking up.</p>
            <button type="button" onClick={() => { setStatus('loading'); setAttempt((n) => n + 1); }} className="mt-4 rounded-full bg-gray-900 px-5 py-2.5 text-sm text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900">
              Try again
            </button>
          </div>
        )}
        {status === 'ready' && (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {shown.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <Link
          href="/dressing-room"
          className="group flex flex-col items-start justify-between gap-3 rounded-2xl bg-[#f3f1ed] px-6 py-6 sm:flex-row sm:items-center sm:px-8 dark:bg-gray-900"
        >
          <div>
            <h2 className="font-serif text-xl text-gray-900 sm:text-2xl dark:text-white">Not sure how it looks?</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Put any piece on our 3D mannequin before you buy.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-sm text-white transition-colors group-hover:bg-gray-700 dark:bg-white dark:text-gray-900">
            Open dressing room <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </section>

      <section className="border-t border-gray-200 dark:border-gray-800">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:grid-cols-4 sm:px-6 lg:px-8">
          {PERKS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Icon className="h-4 w-4" /> {label}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
