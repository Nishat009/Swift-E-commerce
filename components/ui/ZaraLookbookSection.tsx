'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, ShoppingBag, Wand2, Eye, X, Check } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/context/ToastContext';
import { useCurrencyStore } from '@/stores/currencyStore';

interface LookItem {
  id: string;
  lookNumber: string;
  category: 'all' | 'neutral' | 'linen' | 'shirting' | 'outerwear';
  title: string;
  subtitle: string;
  description: string;
  image: string;
  tag: string;
  price: number;
  items: { name: string; price: number; category: string }[];
  targetCategory: string;
}

const LOOKBOOK_ITEMS: LookItem[] = [
  {
    id: 'look-1',
    lookNumber: '01',
    category: 'outerwear',
    title: 'Camel Trench & Tailored Trousers',
    subtitle: 'Double-Breasted Wool Trench with Slim Black Trousers',
    description: 'A timeless belted trench in soft camel wool, styled with sharp black trousers and polished leather heels for city mornings.',
    image: '/images/dress-room/camel-wool-trench-model.jpg',
    tag: 'Outerwear',
    price: 240,
    items: [
      { name: 'Camel Wool Trench Coat', price: 160, category: 'jacket' },
      { name: 'Slim Tailored Trousers', price: 80, category: 'pants' },
    ],
    targetCategory: 'jacket',
  },
  {
    id: 'look-2',
    lookNumber: '02',
    category: 'shirting',
    title: 'Silk Shirt & Charcoal Trouser',
    subtitle: 'Crisp White Silk Shirt with Pleated Charcoal Trousers',
    description: 'Quiet luxury in its simplest form. A fluid white silk shirt worn open at the collar over high-waisted charcoal tailoring.',
    image: '/images/dress-room/white-silk-shirt-model.jpg',
    tag: 'Silk Shirting',
    price: 175,
    items: [
      { name: 'White Silk Shirt', price: 85, category: 'top' },
      { name: 'Pleated Charcoal Trouser', price: 90, category: 'pants' },
    ],
    targetCategory: 'top',
  },
  {
    id: 'look-3',
    lookNumber: '03',
    category: 'linen',
    title: 'Emerald Linen & Ivory Trouser',
    subtitle: 'Camp-Collar Linen Shirt with Pleated Ivory Pants',
    description: 'Breathable emerald linen with a relaxed camp collar, balanced by wide ivory trousers and a tan leather belt.',
    image: '/images/dress-room/emerald-linen-shirt-model.jpg',
    tag: 'Linen',
    price: 150,
    items: [
      { name: 'Emerald Linen Shirt', price: 60, category: 'top' },
      { name: 'Ivory Pleated Trouser', price: 90, category: 'pants' },
    ],
    targetCategory: 'top',
  },
  {
    id: 'look-4',
    lookNumber: '04',
    category: 'neutral',
    title: 'Burgundy Satin Slip Dress',
    subtitle: 'Bias-Cut Satin Midi with Side Slit',
    description: 'A deep burgundy satin slip with a cowl neckline and a fluid bias cut, made for evenings with strappy heels.',
    image: '/images/dress-room/floral-silk-dress-model.jpg',
    tag: 'Evening',
    price: 180,
    items: [
      { name: 'Burgundy Satin Slip Dress', price: 180, category: 'dress' },
    ],
    targetCategory: 'dress',
  },
  {
    id: 'look-5',
    lookNumber: '05',
    category: 'neutral',
    title: 'Noir Knit Column Dress',
    subtitle: 'Ribbed Square-Neck Midi in Black',
    description: 'Sculpted minimalism. A fitted ribbed knit column dress with a square neckline, finished with sleek black mules.',
    image: '/images/dress-room/noir-bodycon-dress-model.jpg',
    tag: 'Monochrome',
    price: 140,
    items: [
      { name: 'Noir Ribbed Midi Dress', price: 140, category: 'dress' },
    ],
    targetCategory: 'dress',
  },
  {
    id: 'look-6',
    lookNumber: '06',
    category: 'outerwear',
    title: 'Denim Trucker & Olive Cargo',
    subtitle: 'Classic Trucker Jacket over a White Tee',
    description: 'Washed indigo denim layered over a clean white tee with relaxed olive cargo pants and white sneakers.',
    image: '/images/dress-room/denim-trucker-jacket-model.jpg',
    tag: 'Casual Layers',
    price: 165,
    items: [
      { name: 'Denim Trucker Jacket', price: 95, category: 'jacket' },
      { name: 'Olive Cargo Pants', price: 70, category: 'pants' },
    ],
    targetCategory: 'jacket',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Looks' },
  { id: 'neutral', label: 'Minimal Neutrals' },
  { id: 'linen', label: 'Linen & Knits' },
  { id: 'shirting', label: 'Relaxed Shirting' },
  { id: 'outerwear', label: 'Tailored Outerwear' },
];

export default function ZaraLookbookSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeLook, setActiveLook] = useState<LookItem | null>(null);
  const [hoveredLookId, setHoveredLookId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const toast = useToast();
  const { symbol: currencySymbol, rate: currencyRate } = useCurrencyStore();

  const formatPrice = (amount: number) => {
    const converted = amount * currencyRate;
    return `${currencySymbol}${converted.toFixed(2)}`;
  };

  const filteredLooks = selectedCategory === 'all'
    ? LOOKBOOK_ITEMS
    : LOOKBOOK_ITEMS.filter((look) => look.category === selectedCategory);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -420 : 420;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleAddLookToCart = async (look: LookItem) => {
    try {
      // Add first primary item of the look
      await addItem({
        id: Number(look.id.replace('look-', '')) + 500,
        title: look.title,
        price: look.price,
        description: look.description,
        thumbnail: look.image,
        images: [look.image],
        category: look.targetCategory,
        rating: 4.9,
        stock: 20,
        brand: 'Swift Atelier',
        discountPercentage: 0,
      } as any);
      toast.success(`Added full look "${look.title}" to cart!`);
      setActiveLook(null);
    } catch (e) {
      toast.error('Failed to add look to cart.');
    }
  };

  return (
    <section className="relative py-16 sm:py-24 bg-[#FAF8F5] dark:bg-zinc-950 border-t border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
      
      {/* 1. Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8b6f47]/10 dark:bg-[#c9a96b]/10 border border-[#8b6f47]/20 dark:border-[#c9a96b]/20 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#8b6f47] dark:text-[#c9a96b]" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b]">
            Zara Style Editorial Lookbook
          </span>
        </div>

        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-zinc-900 dark:text-zinc-50 font-medium tracking-tight">
          Quiet Luxury & Architectural Silhouettes
        </h2>

        <p className="font-elegant text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mt-3 leading-relaxed">
          Clean neutral backgrounds, natural flax linen, and single-piece focus. Explore the full-length runway collection photographed in daylight.
        </p>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 pt-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-md scale-105'
                  : 'bg-white/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 border border-zinc-250 dark:border-zinc-800 hover:border-[#8b6f47]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interactive Horizontal Reel with Giant Watermark Typography */}
      <div className="relative w-full">
        
        {/* Navigation Arrows */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-xl border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center hover:bg-[#8b6f47] hover:text-white dark:hover:bg-[#c9a96b] dark:hover:text-zinc-950 transition-all cursor-pointer"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-xl border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center hover:bg-[#8b6f47] hover:text-white dark:hover:bg-[#c9a96b] dark:hover:text-zinc-950 transition-all cursor-pointer"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* The Scrollable Horizontal Strip Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-none scroll-smooth px-4 sm:px-8 md:px-12 py-4 relative z-10"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {filteredLooks.map((look, index) => {
            const isHovered = hoveredLookId === look.id;

            return (
              <motion.div
                key={look.id}
                onMouseEnter={() => setHoveredLookId(look.id)}
                onMouseLeave={() => setHoveredLookId(null)}
                onClick={() => setActiveLook(look)}
                style={{ scrollSnapAlign: 'start' }}
                className="relative flex-shrink-0 w-[260px] sm:w-[300px] md:w-[325px] h-[480px] sm:h-[560px] md:h-[610px] rounded-[28px] sm:rounded-[32px] overflow-hidden group cursor-pointer shadow-xl bg-stone-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 select-none"
              >
                {/* Full-Length Editorial Model Image */}
                <Image
                  src={look.image}
                  alt={look.title}
                  fill
                  sizes="(max-width: 768px) 300px, 325px"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  priority={index < 4}
                />

                {/* Subtle Luxury Gradient Overlay (Deep black at bottom for crisp text legibility) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 via-40% to-transparent pointer-events-none transition-opacity duration-300" />

                {/* Look Index Top-Left */}
                <div className="absolute top-4 left-4 z-20">
                  <span className="inline-block text-[11px] sm:text-xs font-bold uppercase tracking-[0.14em] px-4 py-1.5 rounded-full bg-white/95 text-zinc-900 shadow-md">
                    LOOK {look.lookNumber}
                  </span>
                </div>

                {/* Tag Top-Right */}
                <div className="absolute top-4 right-4 z-20">
                  <span className="inline-block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/95 bg-[#3a3a3a]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 shadow-md">
                    {look.tag.toUpperCase()}
                  </span>
                </div>

                {/* Bottom Outfit Caption Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 pb-6 z-20 text-white space-y-2 transform transition-transform duration-300">
                  <div>
                    <h3 className="font-serif text-xl sm:text-[22px] font-bold leading-[1.2] text-white drop-shadow-sm group-hover:text-[#dfb76c] transition-colors line-clamp-2">
                      {look.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-zinc-300 line-clamp-1 mt-1.5 font-normal tracking-normal">
                      {look.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-1">
                    <span className="text-base sm:text-lg font-black text-[#dfb76c] tracking-tight font-sans">
                      {formatPrice(look.price)}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveLook(look);
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider bg-white hover:bg-stone-100 text-zinc-900 px-4 py-2 rounded-full transition-all cursor-pointer shadow-lg active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-900" strokeWidth={2.2} />
                      <span>VIEW LOOK</span>
                    </button>
                  </div>

                  {/* Hover Action Strip */}
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={isHovered ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-1.5 pt-2 overflow-hidden"
                  >
                    <Link
                      href={`/products?category=${look.targetCategory}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1"
                    >
                      <span className="w-full text-[10px] font-bold uppercase tracking-wider bg-[#8b6f47] hover:bg-[#725a38] text-white py-2 rounded-full flex items-center justify-center gap-1 transition-colors shadow-sm">
                        <ShoppingBag className="w-3 h-3" /> Shop Items
                      </span>
                    </Link>

                    <Link
                      href="/dressing-room"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1"
                    >
                      <span className="w-full text-[10px] font-bold uppercase tracking-wider bg-white/20 hover:bg-white/30 backdrop-blur-md text-white py-2 rounded-full flex items-center justify-center gap-1 transition-colors border border-white/30">
                        <Wand2 className="w-3 h-3 text-[#dfb76c]" /> 3D Try On
                      </span>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 3. Signature Bold Serif Brand Watermark Overlay */}
        <div className="pointer-events-none absolute right-4 sm:right-12 bottom-2 z-20 select-none opacity-85 dark:opacity-90">
          <span
            className="font-serif font-black text-6xl sm:text-8xl md:text-9xl lg:text-[160px] tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
            style={{ fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)' }}
          >
            SWIFT
          </span>
        </div>
      </div>

      {/* 4. Detail Modal for Inspected Look */}
      <Modal
        isOpen={!!activeLook}
        onClose={() => setActiveLook(null)}
        title={activeLook ? `Look ${activeLook.lookNumber} • ${activeLook.title}` : ''}
        size="xl"
      >
        {activeLook && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-2 sm:p-4">
            
            {/* Left Column: Full length portrait */}
            <div className="md:col-span-5 relative h-[380px] sm:h-[460px] rounded-2xl overflow-hidden bg-stone-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <Image
                src={activeLook.image}
                alt={activeLook.title}
                fill
                className="object-cover object-top"
              />
              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                LOOK {activeLook.lookNumber}
              </div>
            </div>

            {/* Right Column: Look breakdown & items */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4 text-left">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b]">
                  {activeLook.tag} • Atelier Runway Drop
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mt-1">
                  {activeLook.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  {activeLook.description}
                </p>

                {/* Items in the outfit breakdown */}
                <div className="mt-5 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                    Pieces in This Outfit:
                  </h4>
                  <div className="space-y-2">
                    {activeLook.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#8b6f47]/10 dark:bg-[#c9a96b]/20 text-[#8b6f47] dark:text-[#c9a96b] text-[10px] font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Price */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Complete Ensemble Total
                  </span>
                  <span className="font-mono text-xl font-black text-[#8b6f47] dark:text-[#c9a96b]">
                    {formatPrice(activeLook.price)}
                  </span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
                <Button
                  onClick={() => handleAddLookToCart(activeLook)}
                  className="flex-1 w-full bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full font-bold py-3.5 px-4 sm:px-6 text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md border-0 whitespace-nowrap cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Add Look to Cart</span>
                </Button>

                <Link
                  href="/dressing-room"
                  onClick={() => setActiveLook(null)}
                  className="flex-1 w-full"
                >
                  <Button
                    variant="outline"
                    className="w-full rounded-full font-bold py-3.5 px-4 sm:px-6 text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-zinc-300 dark:border-zinc-700 hover:bg-stone-100 whitespace-nowrap cursor-pointer"
                  >
                    <Wand2 className="w-4 h-4 text-[#8b6f47] shrink-0" />
                    <span className="whitespace-nowrap">Try on 3D Avatar</span>
                  </Button>
                </Link>
              </div>

            </div>

          </div>
        )}
      </Modal>

    </section>
  );
}
