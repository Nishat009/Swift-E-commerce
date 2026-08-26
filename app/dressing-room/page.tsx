'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AvatarViewer from '@/components/dressing-room/AvatarViewer';
import AvatarControls from '@/components/dressing-room/AvatarControls';
import ClosetBuilder from '@/components/dressing-room/ClosetBuilder';
import SmartStylist from '@/components/dressing-room/SmartStylist';
import StyleChallenges from '@/components/dressing-room/StyleChallenges';
import ChatAssistant from '@/components/dressing-room/ChatAssistant';
import AIStudio from '@/components/dressing-room/AIStudio';
import { Sparkles, MessageSquare, Award, Shirt, Sliders, ChevronRight, Bot } from 'lucide-react';
import Link from 'next/link';

import DressRoomViewer from '@/components/dressing-room/DressRoomViewer';
import { fashionProducts } from '@/data/fashionCatalog';
import { Product } from '@/types';

function DressingRoomContent() {
  const searchParams = useSearchParams();
  const [sidebarTab, setSidebarTab] = useState<'customizer' | 'challenges' | 'chat' | 'aistudio'>('customizer');
  const [shopTab, setShopTab] = useState<'closet' | 'stylist'>('closet');
  const [selectedSpotlightProduct, setSelectedSpotlightProduct] = useState<Product>(fashionProducts[0]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const productId = searchParams?.get('product');
    const category = searchParams?.get('category');
    if (productId) {
      const match = fashionProducts.find((p) => String(p.id) === String(productId));
      if (match) {
        setSelectedSpotlightProduct(match);
        if (category && category !== 'all') {
          setActiveCategoryFilter(category);
        }
      }
    }
  }, [searchParams]);

  const filteredSpotlightProducts = activeCategoryFilter === 'all'
    ? fashionProducts
    : activeCategoryFilter === 'accessories'
    ? fashionProducts.filter((p) => ['jewelry', 'glasses', 'hat'].includes(p.category.toLowerCase()))
    : fashionProducts.filter((p) => p.category.toLowerCase() === activeCategoryFilter.toLowerCase());

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-gray-950">
      {/* Premium Studio Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-background via-cream/30 to-[#8b6f47]/5 py-6 border-b border-gray-200/50 dark:border-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-1">
              <Link href="/" className="hover:text-gray-600 dark:hover:text-gray-200">Store</Link>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className="text-[#8b6f47] dark:text-[#c9a96b]">Interactive Studio</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-[#f5f1eb] tracking-tight">
              Virtual Dressing Room
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
              Switch between studio product views and editorial model wearing looks, customize your 3D runway avatar, and curate your wardrobe.
            </p>
          </div>

          {/* Quick Stats / Points bubble */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-2.5 px-4 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#8b6f47]/10 flex items-center justify-center text-[#8b6f47] dark:text-[#c9a96b]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold">Dress Room Engine</span>
                <span className="text-xs font-black text-gray-800 dark:text-gray-250">Dual Product & Model View</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* 
        ====================================================================================
        [UPPER 3D AVATAR WORKSPACE - TEMPORARILY COMMENTED OUT FOR LATER DEVELOPMENT]
        Includes: 3D Avatar Runway Visualizer, Avatar Customizer, Challenges, AI Stylist, Closet Racks
        ====================================================================================
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/ * COLUMN 1: Avatar Settings / Achievements / AI Chat (4 Columns) * /}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full">
            {/ * Sidebar Tab Triggers * /}
            <div className="grid grid-cols-4 bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl border border-gray-200/55 dark:border-gray-850">
              <button
                onClick={() => setSidebarTab('customizer')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  sidebarTab === 'customizer'
                    ? 'bg-white dark:bg-gray-850 text-[#8b6f47] dark:text-[#c9a96b] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Avatar
              </button>
              <button
                onClick={() => setSidebarTab('challenges')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  sidebarTab === 'challenges'
                    ? 'bg-white dark:bg-gray-850 text-[#8b6f47] dark:text-[#c9a96b] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Challenges
              </button>
              <button
                onClick={() => setSidebarTab('chat')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  sidebarTab === 'chat'
                    ? 'bg-white dark:bg-gray-850 text-[#8b6f47] dark:text-[#c9a96b] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Assistant
              </button>
              <button
                onClick={() => setSidebarTab('aistudio')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  sidebarTab === 'aistudio'
                    ? 'bg-white dark:bg-gray-850 text-[#8b6f47] dark:text-[#c9a96b] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                Studio
              </button>
            </div>

            {/ * Sidebar Active Panel * /}
            <div className="min-h-[500px]">
              {sidebarTab === 'customizer' && <AvatarControls />}
              {sidebarTab === 'challenges' && <StyleChallenges />}
              {sidebarTab === 'chat' && <ChatAssistant />}
              {sidebarTab === 'aistudio' && <AIStudio />}
            </div>
          </div>

          {/ * COLUMN 2: Large Viewport Visualizer (4 Columns) * /}
          <div className="lg:col-span-4 h-full min-h-[500px]">
            <AvatarViewer />
          </div>

          {/ * COLUMN 3: E-commerce Closet Inventory / Stylist scoring (4 Columns) * /}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full">
            {/ * Shop Drawer Tab Triggers * /}
            <div className="grid grid-cols-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl border border-gray-200/55 dark:border-gray-850">
              <button
                onClick={() => setShopTab('closet')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  shopTab === 'closet'
                    ? 'bg-white dark:bg-gray-850 text-[#8b6f47] dark:text-[#c9a96b] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Shirt className="w-3.5 h-3.5" />
                Closet Racks
              </button>
              <button
                onClick={() => setShopTab('stylist')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  shopTab === 'stylist'
                    ? 'bg-white dark:bg-gray-850 text-[#8b6f47] dark:text-[#c9a96b] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Stylist
              </button>
            </div>

            {/ * Shop Active Panel * /}
            <div className="min-h-[500px]">
              {shopTab === 'closet' && <ClosetBuilder onProductSelect={(p) => setSelectedSpotlightProduct(p)} />}
              {shopTab === 'stylist' && <SmartStylist />}
            </div>
          </div>

        </div>
        ====================================================================================
        */}

        {/* SECTION 2: DRESS ROOM DEDICATED SPOTLIGHT VIEWER */}
        <div className="pt-8 border-t border-stone-200/70 dark:border-zinc-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Interactive Dress Room Spotlight
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                Garment & Model View Studio
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
                Click any outfit below to test instantaneous switching between high-resolution flat-lay product photography and editorial model looks.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-stone-200/60 dark:border-zinc-800">
              {[
                { label: 'All Pieces (30)', key: 'all' },
                { label: 'Tops & Shirts', key: 'top' },
                { label: 'Dresses', key: 'dress' },
                { label: 'Outerwear', key: 'jacket' },
                { label: 'Trousers & Denim', key: 'pants' },
                { label: 'Footwear', key: 'shoes' },
                { label: 'Bags & Leather', key: 'bag' },
                { label: 'Jewelry & Accessories', key: 'accessories' }
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategoryFilter(cat.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeCategoryFilter === cat.key
                      ? 'bg-white dark:bg-zinc-800 text-[#8b6f47] dark:text-[#c9a96b] shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Interactive Stage */}
          <div className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-3xl border border-stone-200/80 dark:border-zinc-800 shadow-md">
            <DressRoomViewer
              product={selectedSpotlightProduct}
              onProductChange={(p) => setSelectedSpotlightProduct(p)}
              showDetails={true}
            />
          </div>

          {/* Outfit Carousel / Rack Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Select Garment to Inspect ({filteredSpotlightProducts.length} items)
              </h3>
              <span className="text-[11px] text-zinc-400">
                Items with gold badge include Model Wearing previews
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {filteredSpotlightProducts.map((p) => {
                const isSelected = selectedSpotlightProduct.id === p.id;
                const hasModel = Boolean(p.modelWearingImage);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedSpotlightProduct(p)}
                    className={`relative p-2 rounded-2xl border text-left transition-all duration-300 group cursor-pointer overflow-hidden ${
                      isSelected
                        ? 'border-[#8b6f47] dark:border-[#c9a96b] bg-[#8b6f47]/5 dark:bg-[#8b6f47]/10 ring-2 ring-[#8b6f47]/30 shadow-md scale-[1.02]'
                        : 'border-stone-200 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-900/50 hover:border-stone-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 dark:bg-zinc-950 mb-2">
                      <img
                        src={p.productImage || p.thumbnail}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {hasModel && (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-extrabold uppercase tracking-wide bg-black/80 backdrop-blur-xs text-[#c9a96b] border border-[#c9a96b]/30">
                          Model
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 line-clamp-1">
                      {p.brand}
                    </p>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">
                      {p.title}
                    </h4>
                    <p className="text-[11px] font-extrabold text-[#8b6f47] dark:text-[#c9a96b] mt-0.5">
                      ${p.price.toFixed(0)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

export default function DressingRoomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-500">Loading Dressing Room...</div>}>
      <DressingRoomContent />
    </Suspense>
  );
}
