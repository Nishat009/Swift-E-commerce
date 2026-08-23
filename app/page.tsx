'use client';

import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/ui/ProductCard';
import CategoryDesignSlider from '@/components/ui/CategoryDesignSlider';
import { ShoppingBag, Truck, Shield, Star, Sparkles, ArrowRight, Mail, Heart, Shirt, Wand2, Eye, Play, X, Film } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchProducts } from '@/lib/api';
import { Product } from '@/types';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import apiClient from '@/lib/apiClient';

import AISmartSearch from '@/features/ai/search/AISmartSearch';
import AIPicksForYou from '@/features/ai/recommendation/AIPicksForYou';
import ZaraLookbookSection from '@/components/ui/ZaraLookbookSection';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [bestDeals, setBestDeals] = useState<Product[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showRunwayVideo, setShowRunwayVideo] = useState(false);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [featured, arrivals, allProducts, catsRes] = await Promise.all([
          fetchProducts({ limit: 8 }).catch(() => ({ products: [], total: 0, skip: 0, limit: 8 })),
          fetchProducts({ limit: 8, skip: 0 }).catch(() => ({ products: [], total: 0, skip: 0, limit: 8 })),
          fetchProducts({ limit: 50 }).catch(() => ({ products: [], total: 0, skip: 0, limit: 50 })),
          apiClient.get('/categories').catch(() => ({ data: { success: false, data: [] } }))
        ]);

        if (featured?.products) {
          setFeaturedProducts(featured.products);
        }
        if (arrivals?.products) {
          setNewArrivals(arrivals.products);
        }
        if (allProducts?.products && allProducts.products.length > 0) {
          setCatalogProducts(allProducts.products);
          const best = allProducts.products
            .filter(p => p.rating >= 4.5)
            .slice(0, 8);
          setBestsellers(best);

          const deals = allProducts.products
            .filter(p => p.discountPercentage > 0)
            .sort((a, b) => b.discountPercentage - a.discountPercentage)
            .slice(0, 3);
          setBestDeals(deals.length > 0 ? deals : allProducts.products.slice(0, 3));

          // Derive all system categories from catalog products
          const categoryMap = new Map();
          allProducts.products.forEach((p) => {
            if (p.category && !categoryMap.has(p.category.toLowerCase())) {
              categoryMap.set(p.category.toLowerCase(), {
                name: p.category.charAt(0).toUpperCase() + p.category.slice(1),
                description: `Explore our curated collection of ${p.category}.`,
                image: p.thumbnail || p.images?.[0] || 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&h=800&fit=crop',
                slug: p.category,
              });
            }
          });
          const derivedCats = Array.from(categoryMap.values());
          if (catsRes.data?.success && catsRes.data.data?.length > 0) {
            setDynamicCategories(catsRes.data.data);
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Improved Fashion & AI Hero Section with Editorial Background Image */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-12 lg:py-16 bg-[#FAF8F5] dark:bg-zinc-950">
        
        {/* Full-width Luxury Editorial Background Image Layer */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=85"
            alt="SwiftCart Atelier High Fashion Background"
            fill
            priority
            className="object-cover object-center opacity-30 dark:opacity-20 scale-105 transition-transform duration-1000"
          />
          {/* Subtle Directional Gradients for Crisp Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/85 to-transparent dark:from-zinc-950 dark:via-zinc-950/85 dark:to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] via-transparent to-[#FAF8F5]/50 dark:from-zinc-950 dark:via-transparent dark:to-zinc-950/50"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Brand Messaging, Dual CTAs & Search */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="lg:col-span-7 space-y-6 text-left"
            >
              <motion.div variants={itemVariants} className="inline-block">
                <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-widest text-[#8b6f47] dark:text-[#c9a96b] uppercase bg-[#8b6f47]/10 dark:bg-[#c9a96b]/10 px-4 py-2 rounded-full border border-[#8b6f47]/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI-Powered Fashion Platform
                </span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-[#2c2c2c] dark:text-[#f5f1eb] leading-[1.12]"
              >
                Your Fashion. Your Style.{' '}
                <br />
                <span className="text-[#8b6f47] dark:text-[#c9a96b] italic font-serif">Powered by AI.</span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="font-elegant text-lg sm:text-xl md:text-2xl text-[#6b6b6b] dark:text-gray-300 max-w-xl leading-relaxed"
              >
                Shop curated fashion, build complete outfits, and use our AI 3D virtual dressing room to discover styles made just for you.
              </motion.p>

              {/* Dual Action CTAs */}
              <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/products">
                  <Button
                    size="lg"
                    className="bg-[#8b6f47] hover:bg-[#6b5435] text-white px-8 py-4 rounded-full font-medium tracking-wide shadow-md hover:shadow-lg flex items-center gap-2.5 text-xs sm:text-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Shop Now
                  </Button>
                </Link>

                <Link href="/dressing-room">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-[#8b6f47] text-[#8b6f47] dark:text-[#c9a96b] dark:border-[#c9a96b] hover:bg-[#8b6f47] hover:text-white dark:hover:bg-[#c9a96b] dark:hover:text-zinc-950 px-7 py-4 rounded-full font-medium tracking-wide flex items-center gap-2.5 text-xs sm:text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Try AI Dressing Room
                  </Button>
                </Link>
              </motion.div>

              {/* AI Smart Search Bar */}
              <motion.div variants={itemVariants} className="pt-2 max-w-xl">
                <AISmartSearch />
              </motion.div>
            </motion.div>

            {/* Right Column: Fashion Visual Composition */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 relative flex justify-center items-center"
            >
              {/* Visual Card Container */}
              <div className="relative w-full max-w-[420px] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-[#e8e0d6]/80 dark:border-zinc-800 bg-stone-100 dark:bg-zinc-900 group">
                <Image
                  src="/hero-fashion.jpg"
                  alt="SwiftCart AI Fashion & Virtual Styling"
                  fill
                  priority
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />

                {/* Subtle gradient vignette overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/15 pointer-events-none" />

                {/* Floating AI Try-On Pill (Top Left) */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute top-4 left-4 z-20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-white/40 dark:border-zinc-700/50 flex items-center gap-2.5"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8b6f47] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#8b6f47]"></span>
                  </span>
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b6f47] dark:text-[#c9a96b]">AI Virtual Try-On</p>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Live 3D Fitting Ready</p>
                  </div>
                </motion.div>

                {/* Runway Film Trigger Pill (Top Right) */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowRunwayVideo(true)}
                  className="absolute top-4 right-4 z-20 bg-black/75 hover:bg-black/90 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl shadow-lg border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-[#c9a96b] text-zinc-950 flex items-center justify-center">
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  </div>
                  <span className="text-[11px] font-bold tracking-wide">Runway Film</span>
                </motion.button>

                {/* Bottom Overlay Info Tag */}
                <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/90 dark:bg-zinc-950/85 backdrop-blur-md p-4 rounded-2xl border border-white/40 dark:border-zinc-800 shadow-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b]">Curated Autumn Drop</span>
                    <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tailored Cashmere Ensemble</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowRunwayVideo(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold bg-zinc-800 hover:bg-zinc-700 text-white px-2.5 py-1.5 rounded-full transition-colors cursor-pointer"
                      title="Watch Runway Film"
                    >
                      <Film className="w-3 h-3" />
                    </button>
                    <Link href="/dressing-room">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#8b6f47] hover:bg-[#6b5435] text-white px-3 py-1.5 rounded-full transition-colors cursor-pointer shadow-sm">
                        <Wand2 className="w-3 h-3" />
                        Try On
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* AI Feature Highlight Banner: AI Virtual Dressing Room */}
      <section className="py-8 sm:py-10 bg-background border-y border-zinc-150/40 dark:border-zinc-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FAF8F5] via-[#F5F1EB] to-[#FAF8F5] dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-2 border-[#8b6f47]/30 dark:border-[#c9a96b]/30 p-6 sm:p-8 md:p-10 shadow-sm"
          >
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#8b6f47] to-[#c9a96b] flex items-center justify-center text-white shrink-0 shadow-md">
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="space-y-1 text-left">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b]">
                      Featured Innovation
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2c2c2c] dark:text-[#f5f1eb]">
                    AI Virtual Dressing Room
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-[#8b6f47] dark:text-[#c9a96b]">
                    See it. Style it. Wear it.
                  </p>
                  <p className="text-xs sm:text-sm text-[#6b6b6b] dark:text-gray-400 max-w-2xl pt-1">
                    Choose a product and see how different colors, sizes and complete outfits look with your interactive 3D AI avatar before making a purchase.
                  </p>
                </div>
              </div>

              <div className="shrink-0 w-full lg:w-auto">
                <Link href="/dressing-room" className="block w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-[#8b6f47] hover:bg-[#6b5435] text-white px-8 py-3.5 rounded-full font-bold text-xs sm:text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 border-0">
                    <Sparkles className="w-4 h-4" />
                    Enter Dressing Room
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Experience Explainer Row (Shop → AI Try-On → AI Style) */}
      <section className="py-10 bg-white dark:bg-gray-900 border-b border-zinc-150/40 dark:border-zinc-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          >
            {/* Experience 1: Shop */}
            <motion.div
              variants={itemVariants}
              className="flex items-start gap-4 p-5 rounded-2xl bg-[#FAF8F5]/80 dark:bg-zinc-950/60 border border-[#e8e0d6]/60 dark:border-zinc-800"
            >
              <div className="w-11 h-11 rounded-xl bg-[#8b6f47]/10 dark:bg-[#c9a96b]/20 flex items-center justify-center text-[#8b6f47] dark:text-[#c9a96b] shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-left">
                <h4 className="font-serif text-lg font-bold text-[#2c2c2c] dark:text-[#f5f1eb]">
                  1. Curated Fashion
                </h4>
                <p className="text-xs sm:text-sm text-[#6b6b6b] dark:text-gray-400">
                  Browse handcrafted, luxury collections and trendsetting fashion products.
                </p>
              </div>
            </motion.div>

            {/* Experience 2: AI Try-On */}
            <motion.div
              variants={itemVariants}
              className="flex items-start gap-4 p-5 rounded-2xl bg-[#FAF8F5]/80 dark:bg-zinc-950/60 border border-[#e8e0d6]/60 dark:border-zinc-800"
            >
              <div className="w-11 h-11 rounded-xl bg-[#8b6f47]/10 dark:bg-[#c9a96b]/20 flex items-center justify-center text-[#8b6f47] dark:text-[#c9a96b] shrink-0">
                <Shirt className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-left">
                <h4 className="font-serif text-lg font-bold text-[#2c2c2c] dark:text-[#f5f1eb]">
                  2. AI Try-On
                </h4>
                <p className="text-xs sm:text-sm text-[#6b6b6b] dark:text-gray-400">
                  Use the 3D Virtual Dressing Room to visualize styles on customized avatars.
                </p>
              </div>
            </motion.div>

            {/* Experience 3: AI Style */}
            <motion.div
              variants={itemVariants}
              className="flex items-start gap-4 p-5 rounded-2xl bg-[#FAF8F5]/80 dark:bg-zinc-950/60 border border-[#e8e0d6]/60 dark:border-zinc-800"
            >
              <div className="w-11 h-11 rounded-xl bg-[#8b6f47]/10 dark:bg-[#c9a96b]/20 flex items-center justify-center text-[#8b6f47] dark:text-[#c9a96b] shrink-0">
                <Wand2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-left">
                <h4 className="font-serif text-lg font-bold text-[#2c2c2c] dark:text-[#f5f1eb]">
                  3. AI Styling
                </h4>
                <p className="text-xs sm:text-sm text-[#6b6b6b] dark:text-gray-400">
                  Receive personalized outfit recommendations and automated style pairing.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 1. Zara-Style Editorial Lookbook Section ("Quiet Luxury & Architectural Silhouettes") */}
      <ZaraLookbookSection />

      {/* 2. Curated Editorial Collection Grid ("Curated Wardrobe") */}
      <section className="relative py-16 sm:py-24 bg-[#faf8f5] dark:bg-zinc-950 border-t border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
        
        {/* Luxury Architectural / Plaster Texture Background Image */}
        <div className="absolute inset-0 pointer-events-none select-none z-0">
          <Image
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80"
            alt="Atelier Background Texture"
            fill
            className="object-cover opacity-20 dark:opacity-15 mix-blend-multiply dark:mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#faf8f5]/60 dark:via-zinc-950/60 to-[#faf8f5] dark:to-zinc-950"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header & Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-[#8b6f47] dark:text-[#c9a96b]">
                The Atelier Drop
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-zinc-900 dark:text-zinc-50 mt-1">
                Curated Wardrobe
              </h2>
            </div>

            {/* Category / Collection Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {[
                { id: 'all', label: 'All Pieces' },
                { id: 'new', label: 'New Arrivals' },
                { id: 'bestseller', label: 'Bestsellers' },
                { id: 'tops', label: 'Tops & Shirts' },
                { id: 'pants', label: 'Trousers' },
                { id: 'outerwear', label: 'Jackets & Coats' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm scale-105'
                      : 'bg-stone-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clean 3-Column Wide Minimalist Grid */}
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10"
          >
            <AnimatePresence mode="popLayout">
              {(
                activeTab === 'new'
                  ? (catalogProducts.filter(p => p.tags?.includes('New') || p.id > 200).slice(0, 8))
                  : activeTab === 'bestseller'
                  ? (catalogProducts.filter(p => p.rating >= 4.7).slice(0, 8))
                  : activeTab === 'tops'
                  ? (catalogProducts.filter(p => p.category === 'top' || p.category === 'mens-shirts' || p.category === 'womens-dresses').slice(0, 8))
                  : activeTab === 'pants'
                  ? (catalogProducts.filter(p => p.category === 'pants').slice(0, 8))
                  : activeTab === 'outerwear'
                  ? (catalogProducts.filter(p => p.category === 'jacket').slice(0, 8))
                  : (catalogProducts.length > 0 ? catalogProducts.slice(0, 8) : featuredProducts.slice(0, 8))
              ).map((product, idx) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductCard product={product} index={idx} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Minimal View Full Catalog CTA */}
          <div className="text-center mt-12 sm:mt-16 pt-8 border-t border-zinc-150 dark:border-zinc-900">
            <Link href="/products">
              <span className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-zinc-950 hover:bg-[#8b6f47] dark:bg-white dark:hover:bg-[#c9a96b] text-white dark:text-zinc-950 dark:hover:text-zinc-950 text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md">
                Explore Full Catalog ({catalogProducts.length || '67'} Pieces) <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>

        </div>
      </section>

      {/* 3. Dynamic Semi-Circular Category Design Slider */}
      <section className="bg-background border-b border-zinc-150/30 dark:border-zinc-800/30">
        <CategoryDesignSlider
          categories={dynamicCategories}
          allProducts={catalogProducts}
        />
      </section>

      {/* 4. AI Recommendations Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AIPicksForYou />
      </div>

      {/* 5. Big Zara / Nike Style Runway Editorial Banner */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
        className="py-16 sm:py-20 md:py-24 relative overflow-hidden bg-black text-white"
      >
        {/* Background Visual / Video Layer */}
        <div className="absolute inset-0">
          <Image
            src="/banner-runway.jpg"
            alt="SwiftCart 2026 Fashion Runway Show"
            fill
            className="object-cover object-center opacity-70 scale-105 transition-transform duration-1000 hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#c9a96b] text-xs font-bold uppercase tracking-widest"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autumn / Winter 2026 Runway Edit</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]"
            >
              The Runway Edit.
              <br />
              <span className="italic font-serif text-[#c9a96b]">Wear the Future.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-elegant text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed max-w-2xl"
            >
              Architectural tailoring, flowing silk dresses, and statement outerwear. Designed for high fashion, fitted in 3D with your AI avatar.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-4"
            >
              <Link href="/products">
                <Button size="lg" className="bg-[#8b6f47] hover:bg-[#6b5435] text-white rounded-full px-8 py-4 text-xs sm:text-sm font-bold tracking-wider uppercase border-0 shadow-xl flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Shop The Runway
                </Button>
              </Link>

              <button
                onClick={() => setShowRunwayVideo(true)}
                className="bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/30 rounded-full px-7 py-3.5 text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current text-[#c9a96b]" />
                Watch Runway Film
              </button>

              <Link href="/dressing-room">
                <Button variant="outline" size="lg" className="border-2 border-white/80 text-white hover:bg-white hover:text-black rounded-full px-8 py-4 text-xs sm:text-sm font-bold tracking-wider uppercase backdrop-blur-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Try On in 3D Studio
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* 6. Nike / Zara Style Split Category Banners */}
      <section className="py-12 sm:py-16 bg-white dark:bg-gray-950 border-b border-gray-150/40 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Banner 1: Women's Luxury Ready-to-Wear */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative h-[480px] sm:h-[540px] rounded-3xl overflow-hidden group shadow-lg"
            >
              <Image
                src="/hero-fashion.jpg"
                alt="Women's Designer Collection"
                fill
                className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10 text-white space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#c9a96b]">
                  Women's Atelier Drop
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  Tailored Coats & Silks
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 max-w-md">
                  Premium wool overcoats, draped silk trousers, and timeless knit essentials.
                </p>
                <div className="pt-2">
                  <Link href="/products?category=womens-dresses">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white text-zinc-950 hover:bg-[#c9a96b] hover:text-white px-6 py-3 rounded-full transition-colors">
                      Shop Women's Drop <ArrowRight className="w-4 h-4" />
                    </span>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Banner 2: Men's Contemporary & Streetwear */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative h-[480px] sm:h-[540px] rounded-3xl overflow-hidden group shadow-lg"
            >
              <Image
                src="/banner-apparel.jpg"
                alt="Men's Contemporary Streetwear"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>

              <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10 text-white space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#c9a96b]">
                  Urban Luxury & Streetwear
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  Contemporary Outerwear
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 max-w-md">
                  Oversized blazers, leather jackets, streetwear layers, and structured pants.
                </p>
                <div className="pt-2">
                  <Link href="/products?category=mens-shirts">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white text-zinc-950 hover:bg-[#c9a96b] hover:text-white px-6 py-3 rounded-full transition-colors">
                      Shop Men's Drop <ArrowRight className="w-4 h-4" />
                    </span>
                  </Link>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Classic Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
        className="py-16 sm:py-20 md:py-24 bg-white dark:bg-gray-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-center text-[#2c2c2c] dark:text-[#f5f1eb] mb-12 sm:mb-16"
          >
            Why Choose Us
          </motion.h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12"
          >
            {[
              { icon: Truck, title: 'Fast Delivery', desc: 'Swift and secure shipping to your doorstep' },
              { icon: Shield, title: 'Secure Payment', desc: 'Your information is always protected' },
              { icon: Star, title: 'Quality Assured', desc: 'Only the finest products make it to you' },
              { icon: Heart, title: 'Customer Care', desc: 'Dedicated support for your satisfaction' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className="w-20 h-20 sm:w-24 sm:h-24 bg-[#8b6f47]/10 dark:bg-[#c9a96b]/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#8b6f47]/20 dark:group-hover:bg-[#c9a96b]/30 transition-colors"
                >
                  <feature.icon className="w-10 h-10 sm:w-12 sm:h-12 text-[#8b6f47] dark:text-[#c9a96b]" />
                </motion.div>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#2c2c2c] dark:text-[#f5f1eb] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[#6b6b6b] dark:text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Classic Newsletter Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
        className="py-16 sm:py-20 md:py-24 bg-white dark:bg-gray-900"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#f5f1eb] dark:bg-gray-950 rounded-2xl p-8 sm:p-12 md:p-16 border border-[#e8e0d6] dark:border-gray-800"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
              className="inline-block mb-6"
            >
              <Mail className="w-12 h-12 sm:w-16 sm:h-16 text-[#8b6f47] dark:text-[#c9a96b] mx-auto" />
            </motion.div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-[#2c2c2c] dark:text-[#f5f1eb] mb-4">
              Stay Connected
            </h2>
            <p className="font-elegant text-lg sm:text-xl text-[#6b6b6b] dark:text-gray-400 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Be the first to discover new arrivals, exclusive offers, and special collections
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-6 py-4 rounded-lg bg-white dark:bg-gray-900 border-2 border-[#e8e0d6] dark:border-gray-800 text-[#2c2c2c] dark:text-[#f5f1eb] placeholder-[#9b9b9b] focus:outline-none focus:border-[#8b6f47] dark:focus:border-[#c9a96b] transition-colors font-medium"
              />
              <Button
                type="submit"
                size="lg"
                className="bg-[#8b6f47] hover:bg-[#6b5435] text-white border-0 px-8 py-4 font-medium tracking-wide"
              >
                Subscribe
              </Button>
            </form>
          </motion.div>
        </div>
      </motion.section>
      {/* Luxury Runway Video Modal (Zara / Nike Style) */}
      {showRunwayVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fade-in">
          <div className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800/80 bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#c9a96b]/20 flex items-center justify-center text-[#c9a96b]">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                    Autumn / Winter 2026 Runway Show
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Live Catwalk & Couture Apparel Collection • High Fashion Editorial
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRunwayVideo(false)}
                className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewport */}
            <div className="relative w-full aspect-video bg-black overflow-hidden group">
              <Image
                src="/banner-runway.jpg"
                alt="Runway Show"
                fill
                className="object-cover animate-pulse"
              />
              
              {/* Overlay styling & Runway tag */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-6 sm:p-8">
                <div className="self-start px-3 py-1.5 rounded-full bg-red-600/90 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  RUNWAY LIVE EDIT
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#c9a96b]">Featured Looks</span>
                  <h4 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                    Structured Trench Coats, Velvet Tailoring & Silk Gowns
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-300 max-w-xl">
                    Every piece seen on the runway is available for purchase and ready for 3D fitting in our interactive dressing room.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-6 bg-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-zinc-400 text-center sm:text-left">
                Ready to try these outfits on your customized AI avatar?
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link href="/products" className="flex-1 sm:flex-initial" onClick={() => setShowRunwayVideo(false)}>
                  <Button className="w-full bg-[#8b6f47] hover:bg-[#6b5435] text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-0">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Shop All Outfits
                  </Button>
                </Link>
                <Link href="/dressing-room" className="flex-1 sm:flex-initial" onClick={() => setShowRunwayVideo(false)}>
                  <Button variant="outline" className="w-full border-zinc-700 text-zinc-200 hover:bg-white hover:text-black px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Try In Dressing Room
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
