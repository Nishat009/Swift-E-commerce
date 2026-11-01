'use client';

import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/ui/ProductCard';
import { Truck, RotateCcw, ShieldCheck, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchProducts } from '@/lib/api';
import { Product } from '@/types';
import { motion } from 'framer-motion';
import apiClient from '@/lib/apiClient';

import AIPicksForYou from '@/features/ai/recommendation/AIPicksForYou';
import ZaraLookbookSection from '@/components/ui/ZaraLookbookSection';
import CinematicFashionHero from '@/components/ui/CinematicFashionHero';

// Tabs for the "New in" grid: each picks products from the catalog already loaded on the page
const WARDROBE_TABS: { id: string; label: string; pick: (p: Product) => boolean }[] = [
  { id: 'all', label: 'All', pick: () => true },
  { id: 'new', label: 'New in', pick: (p) => Boolean(p.newArrival) },
  { id: 'bestseller', label: 'Bestsellers', pick: (p) => Boolean(p.bestSeller) },
  { id: 'tops', label: 'Tops', pick: (p) => p.category === 'top' },
  { id: 'dresses', label: 'Dresses', pick: (p) => p.category === 'dress' },
  { id: 'pants', label: 'Trousers', pick: (p) => p.category === 'pants' },
  { id: 'outerwear', label: 'Outerwear', pick: (p) => p.category === 'jacket' },
  { id: 'shoes', label: 'Shoes', pick: (p) => p.category === 'shoes' },
  { id: 'accessories', label: 'Accessories', pick: (p) => ['bag', 'jewelry', 'hat', 'glasses'].includes(p.category) },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

const eyebrow = 'text-[11px] uppercase tracking-[0.22em] text-stone-500';
const sectionTitle = 'font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl';

export default function ShopHome() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allProductsRes, catsRes] = await Promise.all([
          fetchProducts({ limit: 100 }).catch(() => ({ products: [], total: 0, skip: 0, limit: 100 })),
          apiClient.get('/categories').catch(() => ({ data: { success: false, data: [] } }))
        ]);

        const prods = allProductsRes?.products || [];
        if (prods.length > 0) {
          setCatalogProducts(prods);
          setFeaturedProducts(prods.filter(p => p.featured).slice(0, 8));

          // Derive all system categories from catalog products
          const categoryMap = new Map();
          prods.forEach((p) => {
            if (p.category && !categoryMap.has(p.category.toLowerCase())) {
              categoryMap.set(p.category.toLowerCase(), {
                name: p.category.charAt(0).toUpperCase() + p.category.slice(1),
                description: `Explore our curated collection of ${p.category}.`,
                image: p.thumbnail || p.images?.[0] || '/images/dress-room/camel-wool-trench-model.jpg',
                slug: p.category,
              });
            }
          });
          const derivedCats = Array.from(categoryMap.values());
          // Admin categories that have products in the catalog (empty or legacy ones are skipped)
          const apiCategories = Array.isArray(catsRes.data?.data) ? catsRes.data.data : [];
          const stockedCategories = apiCategories.filter((category: any) =>
            typeof category === 'object' && category?.name && category?.slug && categoryMap.has(String(category.slug).toLowerCase()));
          if (catsRes.data?.success && stockedCategories.length > 0) {
            // Categories without their own image borrow one from their products
            setDynamicCategories(stockedCategories.map((c: any) => ({ ...c, image: c.image || categoryMap.get(String(c.slug).toLowerCase())?.image })));
          } else {
            setDynamicCategories(derivedCats);
          }
        }
      } catch (error) {
        console.error('Error loading products or categories:', error);
      }
    };

    loadData();
  }, []);

  const tab = WARDROBE_TABS.find((t) => t.id === activeTab) ?? WARDROBE_TABS[0];
  const wardrobe = (catalogProducts.length > 0 ? catalogProducts : featuredProducts).filter(tab.pick).slice(0, 8);
  const visibleTabs = WARDROBE_TABS.filter((t) => t.id === 'all' || catalogProducts.some(t.pick));
  const categoryTiles = dynamicCategories.filter((c) => c.image).slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <CinematicFashionHero />

      {/* Shop by category */}
      {categoryTiles.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 pb-4 pt-24 sm:px-6 lg:px-10">
          <motion.div {...fadeUp} className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className={`${eyebrow} mb-3`}>Shop by category</p>
              <h2 className={sectionTitle}>Find your next piece</h2>
            </div>
            <Link href="/products" className="hidden text-sm text-ink underline underline-offset-4 sm:inline">
              View all
            </Link>
          </motion.div>
          <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {categoryTiles.map((c, i) => (
              <motion.div key={c.slug} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.05 }} className="w-[42vw] shrink-0 snap-start sm:w-auto">
                <Link href={'/products?category=' + encodeURIComponent(c.slug)} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-stone-100 dark:bg-stone-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image} alt="" className="size-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]" />
                  </div>
                  <p className="mt-3 flex items-center justify-between text-sm text-ink">
                    {c.name}
                    <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* New in */}
      <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 sm:py-24 lg:px-10">
        <motion.div {...fadeUp} className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className={`${eyebrow} mb-3`}>The wardrobe</p>
            <h2 className={sectionTitle}>New this season</h2>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto px-4 md:mx-0 md:px-0" role="tablist">
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}
                className={`shrink-0 border-b pb-1.5 text-[13px] tracking-wide transition-colors cursor-pointer ${
                  activeTab === t.id ? 'border-ink text-ink' : 'border-transparent text-stone-500 hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </motion.div>

        {wardrobe.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {wardrobe.map((product, idx) => (
              <ProductCard key={`${activeTab}-${product.id}`} product={product} index={idx} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4" aria-hidden>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-[3/4] rounded-sm bg-stone-200/70 dark:bg-stone-800" />
                <div className="h-3 w-1/3 rounded bg-stone-200/70 dark:bg-stone-800" />
                <div className="h-3 w-2/3 rounded bg-stone-200/70 dark:bg-stone-800" />
              </div>
            ))}
          </div>
        )}

        <div className="mt-14 text-center">
          <Link href="/products">
            <Button variant="outline" size="lg">
              Shop all{catalogProducts.length > 0 ? ` ${catalogProducts.length} pieces` : ''}
            </Button>
          </Link>
        </div>
      </section>

      {/* Editorial pair */}
      <section className="mx-auto max-w-[1440px] px-4 pb-24 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            { image: '/hero-fashion.jpg', alt: 'Women’s tailored coats and silks', eyebrow: 'Women', title: 'Tailored coats & silks', copy: 'Wool overcoats, fluid trousers and knitwear made to last.', href: '/products?category=dress', cta: 'Shop women' },
            { image: '/banner-apparel.jpg', alt: 'Contemporary outerwear', eyebrow: 'Men', title: 'Contemporary outerwear', copy: 'Oversized blazers, leather and structured layers.', href: '/products?category=jacket', cta: 'Shop outerwear' },
          ].map((b, i) => (
            <motion.div key={b.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}>
              <Link href={b.href} className="group relative block aspect-[4/5] overflow-hidden rounded-sm bg-stone-200 dark:bg-stone-900 sm:aspect-[5/6]">
                <Image src={b.image} alt={b.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-top transition-transform duration-[1200ms] group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/80">{b.eyebrow}</p>
                  <h3 className="mt-2 font-serif text-3xl font-medium sm:text-4xl">{b.title}</h3>
                  <p className="mt-2 max-w-sm text-sm text-white/80">{b.copy}</p>
                  <span className="mt-5 inline-flex items-center gap-2 border-b border-white/70 pb-0.5 text-xs font-medium uppercase tracking-[0.14em] transition-colors group-hover:border-white">
                    {b.cta} <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Lookbook */}
      <ZaraLookbookSection />

      {/* 3D dressing room feature */}
      <section className="mx-auto max-w-[1440px] px-4 py-24 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20">
          {/* The piece on its own, then the same piece worn */}
          <motion.div {...fadeUp} className="grid grid-cols-5 items-end gap-3 sm:gap-4">
            <div className="relative col-span-2 aspect-[3/4] overflow-hidden rounded-sm bg-stone-100 dark:bg-stone-900">
              <Image src="/images/dress-room/camel-wool-trench-product.jpg" alt="Camel wool trench coat" fill sizes="(max-width: 1024px) 40vw, 20vw" className="object-cover" />
            </div>
            <div className="relative col-span-3 aspect-[3/4] overflow-hidden rounded-sm bg-stone-100 dark:bg-stone-900">
              <Image src="/images/dress-room/camel-wool-trench-model.jpg" alt="The camel trench coat styled and worn" fill sizes="(max-width: 1024px) 60vw, 30vw" className="object-cover object-top" />
            </div>
          </motion.div>
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="max-w-lg">
            <p className={`${eyebrow} mb-4 flex items-center gap-2`}>
              <Sparkles className="size-3.5 text-[#8b6f47] dark:text-[#c9a96b]" /> Virtual dressing room
            </p>
            <h2 className={sectionTitle}>Try it on before it arrives</h2>
            <p className="mt-5 text-base leading-relaxed text-stone-600 dark:text-stone-400">
              Build an avatar with your measurements, then see colours, sizes and complete outfits on it in 3D. Fewer returns, more pieces you love.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-stone-700 dark:text-stone-300">
              {['Your measurements, your avatar', 'Mix pieces into complete outfits', 'Compare sizes and colours side by side'].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="h-px w-5 bg-stone-400" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dressing-room">
                <Button size="lg">Enter the dressing room</Button>
              </Link>
              <Link href="/products">
                <Button size="lg" variant="ghost">Browse first</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recommendations */}
      <div className="mx-auto max-w-[1440px] border-t border-line px-4 sm:px-6 lg:px-10">
        <AIPicksForYou products={catalogProducts} />
      </div>

      {/* Runway banner */}
      <section className="relative overflow-hidden bg-stone-950 text-white">
        <Image src="/banner-runway.jpg" alt="SwiftCart runway collection" fill sizes="100vw" className="object-cover object-center opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        <motion.div {...fadeUp} className="relative mx-auto max-w-[1440px] px-4 py-28 sm:px-6 sm:py-36 lg:px-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">Autumn / Winter 2026</p>
          <h2 className="mt-4 max-w-2xl font-serif text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            The runway edit
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/80">
            Architectural tailoring, fluid silk and statement outerwear, ready to fit on your avatar in 3D.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/products">
              <Button size="lg" className="bg-white text-stone-950 hover:bg-white/90">Shop the edit</Button>
            </Link>
            <Link href="/dressing-room">
              <Button size="lg" variant="outline" className="border-white/50 text-white hover:border-white hover:bg-white hover:text-stone-950">
                Try on in 3D
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Service promises */}
      <section>
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-y-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-10">
          {[
            { icon: Truck, title: 'Free shipping', desc: 'On orders of $100 or more' },
            { icon: RotateCcw, title: '30-day returns', desc: 'Changed your mind? Send it back' },
            { icon: ShieldCheck, title: 'Secure payment', desc: 'Cards, bKash or cash on delivery' },
            { icon: MessageCircle, title: 'Personal styling', desc: 'Ask our AI stylist anytime' },
          ].map((f) => (
            <div key={f.title} className="flex flex-col items-center px-2 text-center">
              <f.icon className="mb-4 size-5 text-stone-500" strokeWidth={1.5} />
              <h3 className="font-sans text-sm font-medium text-ink">{f.title}</h3>
              <p className="mt-1 text-xs text-stone-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
