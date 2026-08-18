'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { useCompareStore } from '@/stores/compareStore';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useCurrencyStore } from '@/stores/currencyStore';
import apiClient from '@/lib/apiClient';
import Modal from './Modal';
import Button from './Button';
import HighlightText from './HighlightText';
import { ShoppingBag, Heart, Star, Eye, Scale, ArrowRight, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  index?: number;
  searchQuery?: string;
}

export default function ProductCard({ product, viewMode = 'grid', index = 0, searchQuery }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const { symbol: currencySymbol, rate: currencyRate } = useCurrencyStore();
  
  const formatPrice = (amount: number) => {
    const converted = amount * currencyRate;
    return `${currencySymbol}${converted.toFixed(2)}`;
  };

  const discountedPrice = product.discountPercentage > 0 
    ? product.price * (1 - product.discountPercentage / 100)
    : product.price;
  
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Compare Store
  const { toggleCompare, isInCompare } = useCompareStore();
  const isCompared = isInCompare(product.id);

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = toggleCompare(product);
    if (!success) {
      toast.error('Maximum 3 products can be compared at a time.');
    } else {
      if (!isCompared) {
        toast.info(`Added ${product.title} to comparison`);
      }
    }
  };

  useEffect(() => {
    if (user && user.wishlist) {
      const wishlistIds = user.wishlist.map((item: any) => String(item._id || item.id || item));
      setIsWishlisted(wishlistIds.includes(String(product.id)));
    } else {
      setIsWishlisted(false);
    }
  }, [user, product.id]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addItem(product);
      toast.success(`Added "${product.title}" to bag.`);
    } catch (err) {
      toast.error('Failed to add item to bag.');
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please log in to manage your wishlist.');
      return;
    }

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        const res = await apiClient.delete(`/wishlist/${product.id}`);
        if (res.data?.success) {
          setIsWishlisted(false);
          toast.success(`Removed from wishlist.`);
          await refreshUser();
        }
      } else {
        const res = await apiClient.post('/wishlist', { productId: product.id });
        if (res.data?.success) {
          setIsWishlisted(true);
          toast.success(`Saved to wishlist.`);
          await refreshUser();
        }
      }
    } catch (err: any) {
      toast.error('Failed to update wishlist.');
    } finally {
      setWishlistLoading(false);
    }
  };

  const mockReviewCount = Math.floor((Number(String(product.id).charCodeAt(0)) % 30) + 8);
  const mainImage = product.thumbnail || (product.images && product.images[0]) || '';

  // Extract color swatches from variants or specifications
  const colorVariant = product.variants?.find(v => v.name.toLowerCase().includes('color'));
  const colorOptions = colorVariant?.options || [];
  const primaryColorHex = product.specifications?.Color?.startsWith('#') ? product.specifications.Color : null;
  const materialTag = product.specifications?.Material?.split(',')[0] || product.specifications?.Fabric?.split(',')[0] || `${product.category} collection`;

  // List View Mode
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3 }}
        className="group relative bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-5 items-center shadow-xs hover:shadow-md transition-all duration-300"
      >
        {/* Image Box */}
        <Link href={`/product/${product.id}`} className="relative w-full sm:w-48 h-56 sm:h-48 rounded-xl overflow-hidden bg-[#F6F5F3] dark:bg-zinc-950 flex-shrink-0">
          <Image
            src={mainImage}
            alt={product.title}
            fill
            className="object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {product.discountPercentage > 0 && (
            <span className="absolute top-2.5 left-2.5 bg-black text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              -{product.discountPercentage}%
            </span>
          )}
        </Link>

        {/* Content */}
        <div className="flex-grow space-y-1.5 w-full text-left">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#8b6f47] dark:text-[#c9a96b]">
              {product.brand || 'Swift Atelier'}
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              {product.category}
            </span>
          </div>

          <Link href={`/product/${product.id}`}>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 hover:text-[#8b6f47] transition-colors line-clamp-1">
              <HighlightText text={product.title} query={searchQuery} />
            </h3>
          </Link>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-light line-clamp-1">
            {materialTag}
          </p>

          <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed font-light pt-1">
            <HighlightText text={product.description || ''} query={searchQuery} />
          </p>
          
          <div className="flex items-center gap-3 pt-2">
            <span className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {formatPrice(discountedPrice)}
            </span>
            {product.discountPercentage > 0 && (
              <span className="font-mono text-xs text-zinc-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              • In Stock
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
          <button
            onClick={handleAddToCart}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-zinc-950 hover:bg-[#8b6f47] text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Add to Bag
          </button>
          <button
            onClick={handleWishlistToggle}
            className="p-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-red-500 transition-colors flex items-center justify-center"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        </div>
      </motion.div>
    );
  }

  // Grid View Mode (Clean Minimalist Luxury Card with Smooth Transitions)
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="group flex flex-col h-full text-left transition-all duration-500 ease-out hover:-translate-y-2"
      >
        {/* 1. Image Container (Single authentic image with subtle luxury zoom & glow on hover) */}
        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-[#F6F5F3] dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/80 transition-all duration-500 ease-out group-hover:border-[#8b6f47]/40 dark:group-hover:border-[#c9a96b]/40 group-hover:shadow-[0_16px_36px_-12px_rgba(139,111,71,0.18)] dark:group-hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.6)]">
          
          {/* Product Image Link with smooth zoom */}
          <Link href={`/product/${product.id}`} className="block w-full h-full relative cursor-pointer">
            <Image
              src={mainImage}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-108"
            />
          </Link>

          {/* Minimalist Badges (Top Left) */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none transition-transform duration-300 group-hover:translate-x-0.5">
            {product.discountPercentage > 0 && (
              <span className="bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs">
                -{product.discountPercentage}%
              </span>
            )}
            {product.stock <= 5 && product.stock > 0 && (
              <span className="bg-[#8b6f47] text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                Low Stock
              </span>
            )}
          </div>

          {/* Floating Action Cluster (Top Right - Smooth Staggered Slide In) */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className="w-8 h-8 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 hover:text-red-500 hover:scale-110 transition-all shadow-sm cursor-pointer"
              title="Wishlist"
            >
              <Heart className={`w-3.5 h-3.5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleCompareToggle}
              className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center border transition-all hover:scale-110 shadow-sm cursor-pointer ${
                isCompared
                  ? 'bg-[#8b6f47] text-white border-[#8b6f47]'
                  : 'bg-white/95 dark:bg-zinc-900/95 text-zinc-800 dark:text-zinc-200 border-zinc-200/80 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800'
              }`}
              title={isCompared ? 'Remove Compare' : 'Add Compare'}
            >
              <Scale className="w-3.5 h-3.5" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsQuickViewOpen(true);
              }}
              className="w-8 h-8 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 hover:scale-110 transition-all shadow-sm cursor-pointer"
              title="Quick View"
            >
              <Eye className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* Quick Add Slide-up Bar (Bottom of Image - Smooth Spring-like Slide Up) */}
          <div className="absolute inset-x-3 bottom-3 z-10 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 ease-out">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-zinc-950/95 dark:bg-white/95 hover:bg-[#8b6f47] dark:hover:bg-[#c9a96b] text-white dark:text-zinc-950 dark:hover:text-zinc-950 backdrop-blur-md py-2.5 px-4 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 shadow-md cursor-pointer border-0 active:scale-[0.98]"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {product.stock === 0 ? 'Out of Stock' : 'Quick Add to Bag'}
            </button>
          </div>

        </div>

        {/* 2. Defined Product Details (Clean Ately/Zara Typography Beneath Image) */}
        <div className="pt-3 pb-1 space-y-1.5 flex flex-col flex-grow justify-between">
          <div>
            {/* Row 1: Brand & Category + Color Swatches */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b]">
                  {product.brand || 'Swift Atelier'}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700 text-[10px]">•</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {product.category}
                </span>
              </div>

              {/* Color Swatch Dots */}
              {colorOptions.length > 0 ? (
                <div className="flex items-center gap-1">
                  {colorOptions.slice(0, 3).map((opt) => (
                    <span
                      key={opt.id}
                      title={opt.value}
                      className="w-2.5 h-2.5 rounded-full border border-zinc-300 dark:border-zinc-700 shadow-2xs inline-block transition-transform hover:scale-125"
                      style={{ backgroundColor: opt.colorHex || '#d4cbbe' }}
                    />
                  ))}
                  {colorOptions.length > 3 && (
                    <span className="text-[9px] text-zinc-400 font-mono">+{colorOptions.length - 3}</span>
                  )}
                </div>
              ) : primaryColorHex ? (
                <span
                  className="w-2.5 h-2.5 rounded-full border border-zinc-300 dark:border-zinc-700 shadow-2xs inline-block transition-transform hover:scale-125"
                  style={{ backgroundColor: primaryColorHex }}
                />
              ) : null}
            </div>

            {/* Row 2: Product Title (Single clean line with smooth hover transition) */}
            <Link href={`/product/${product.id}`} className="block group-hover:text-[#8b6f47] dark:group-hover:text-[#c9a96b] transition-colors duration-300 mt-0.5">
              <h3 className="font-serif text-[15px] sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-snug">
                <HighlightText text={product.title} query={searchQuery} />
              </h3>
            </Link>

            {/* Row 3: Material / Fabric Descriptor */}
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-light truncate">
              {materialTag}
            </p>
          </div>

          {/* Row 4: Pricing, Discount Tag, and Rating/Stock Status */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-900 mt-1">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50">
                {formatPrice(discountedPrice)}
              </span>
              {product.discountPercentage > 0 && (
                <span className="font-mono text-xs text-zinc-400 line-through font-normal">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Rating / Stock Status */}
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 font-mono">
                {product.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

      </motion.div>

      {/* Quick View Modal (Spacious Luxury Dialog) */}
      <Modal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        size="2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 p-2 sm:p-6 text-left items-center">
          
          {/* Modal Image Box (Wide & High Impact) */}
          <div className="md:col-span-6 relative aspect-[3/4] min-h-[380px] sm:min-h-[480px] rounded-2xl overflow-hidden bg-[#F6F5F3] dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <Image
              src={mainImage}
              alt={product.title}
              fill
              className="object-cover object-top"
            />
            {product.discountPercentage > 0 && (
              <div className="absolute top-4 left-4 bg-zinc-950 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                -{product.discountPercentage}% OFF
              </div>
            )}
          </div>

          {/* Modal Details (Spacious Typography & CTAs) */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b]">
                  {product.brand || 'Swift Atelier'}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {product.category}
                </span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-white leading-tight">
                {product.title}
              </h3>
              
              <p className="text-xs sm:text-sm font-medium text-[#8b6f47] dark:text-[#c9a96b]">
                {materialTag}
              </p>

              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-light pt-1">
                {product.description}
              </p>

              {/* Color Swatch in Modal */}
              {colorOptions.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 block mb-2">
                    Available Colors:
                  </span>
                  <div className="flex items-center gap-2">
                    {colorOptions.map((opt) => (
                      <span
                        key={opt.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-250 dark:border-zinc-700 text-xs font-medium bg-stone-50 dark:bg-zinc-900"
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-zinc-300 shadow-2xs inline-block"
                          style={{ backgroundColor: opt.colorHex || '#d4cbbe' }}
                        />
                        {opt.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing in Modal */}
              <div className="flex items-baseline gap-4 pt-4 border-t border-zinc-200/80 dark:border-zinc-800">
                <span className="font-mono text-3xl font-black text-zinc-900 dark:text-white">
                  {formatPrice(discountedPrice)}
                </span>
                {product.discountPercentage > 0 && (
                  <span className="font-mono text-base text-zinc-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold ml-auto flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> In Stock & Ready to Ship
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3.5 pt-4">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-zinc-950 hover:bg-[#8b6f47] text-white rounded-full font-bold py-3.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-0 shadow-lg"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Bag
              </Button>

              <Link
                href={`/product/${product.id}`}
                onClick={() => setIsQuickViewOpen(false)}
                className="flex-1"
              >
                <Button
                  variant="outline"
                  className="w-full rounded-full font-bold py-3.5 text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border-zinc-300 dark:border-zinc-700 hover:bg-stone-100"
                >
                  View Full Details <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </Modal>
    </>
  );
}
