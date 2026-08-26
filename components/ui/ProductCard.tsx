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
import { ShoppingBag, Heart, Star, Eye, Scale, ArrowRight, Sparkles } from 'lucide-react';
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
  const [isHovered, setIsHovered] = useState(false);

  // Compare Store
  const { toggleCompare, isInCompare } = useCompareStore();
  const isCompared = isInCompare(product.id);

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompared) {
      toggleCompare(product);
      toast.info(`Removed "${product.title}" from comparison`);
    } else {
      const added = toggleCompare(product);
      if (added) {
        toast.info(`Added "${product.title}" to comparison`);
      } else {
        toast.error('Maximum 3 products can be compared at a time.');
      }
    }
  };

  useEffect(() => {
    if (user && user.wishlist) {
      const wishlistIds = user.wishlist.map((item: any) => String(item._id || item.id || item));
      setIsWishlisted(wishlistIds.includes(String(product.id)));
    } else if (typeof window !== 'undefined') {
      try {
        const guestWishlist = JSON.parse(localStorage.getItem('swiftcart_guest_wishlist') || '[]');
        setIsWishlisted(guestWishlist.includes(String(product.id)));
      } catch {
        setIsWishlisted(false);
      }
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

    // Guest wishlist support with localStorage
    if (!user) {
      if (typeof window !== 'undefined') {
        try {
          const guestWishlist: string[] = JSON.parse(localStorage.getItem('swiftcart_guest_wishlist') || '[]');
          const productIdStr = String(product.id);
          let updated: string[];
          if (guestWishlist.includes(productIdStr)) {
            updated = guestWishlist.filter((id) => id !== productIdStr);
            setIsWishlisted(false);
            toast.success(`Removed "${product.title}" from wishlist.`);
          } else {
            updated = [...guestWishlist, productIdStr];
            setIsWishlisted(true);
            toast.success(`Saved "${product.title}" to wishlist.`);
          }
          localStorage.setItem('swiftcart_guest_wishlist', JSON.stringify(updated));
        } catch {
          toast.error('Could not save to wishlist.');
        }
      }
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
  const displayImage = product.modelWearingImage || product.productImage || product.thumbnail || (product.images && product.images[0]) || '';

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

  // Grid View Mode (Quiet Luxury & Architectural Silhouettes Editorial Card Design)
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-full h-[500px] sm:h-[560px] md:h-[600px] rounded-[28px] sm:rounded-[32px] overflow-hidden group cursor-pointer shadow-xl hover:shadow-2xl bg-stone-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 select-none transition-all duration-500 ease-out flex flex-col justify-between"
      >
        {/* 1. Full-Length Editorial Visual */}
        <Link href={`/product/${product.id}`} className="absolute inset-0 block w-full h-full cursor-pointer z-0">
          <Image
            src={displayImage}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center sm:object-top transition-transform duration-700 ease-out group-hover:scale-105"
            priority={index < 3}
          />
        </Link>

        {/* 2. Top Vignette & Bottom Luxury Dark Gradient Overlay */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 via-40% to-transparent pointer-events-none z-10 transition-opacity duration-300" />

        {/* 3. Top Badges & Actions Strip */}
        <div className="relative z-20 flex items-center justify-between p-4 sm:p-5 pointer-events-none">
          {/* Top Left: Discount / Drop Pill */}
          <div className="flex items-center gap-1.5">
            {product.discountPercentage > 0 ? (
              <span className="inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] px-3.5 py-1.5 rounded-full bg-white/95 text-zinc-900 shadow-md backdrop-blur-xs">
                -{product.discountPercentage}% OFF
              </span>
            ) : (
              <span className="inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] px-3.5 py-1.5 rounded-full bg-white/95 text-zinc-900 shadow-md backdrop-blur-xs">
                PIECE {index + 1 < 10 ? `0${index + 1}` : index + 1}
              </span>
            )}
            {product.stock <= 5 && product.stock > 0 && (
              <span className="inline-block text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-white bg-amber-600/90 backdrop-blur-md px-3 py-1 rounded-full shadow-md">
                Low Stock
              </span>
            )}
          </div>

          {/* Top Right: Tag & Glass Action Cluster */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="inline-block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/95 bg-[#3a3a3a]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-md">
              {product.category.toUpperCase()}
            </span>

            {/* Quick Action Icons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-white text-white hover:text-red-500 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-300 shadow-md hover:scale-110 cursor-pointer"
                title="Wishlist"
              >
                <Heart className={`w-3.5 h-3.5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              </button>

              <button
                onClick={handleCompareToggle}
                className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center border transition-all duration-300 hover:scale-110 shadow-md cursor-pointer ${
                  isCompared
                    ? 'bg-[#8b6f47] text-white border-[#8b6f47]'
                    : 'bg-black/40 hover:bg-white text-white hover:text-zinc-900 border-white/20'
                }`}
                title={isCompared ? 'Remove Compare' : 'Add Compare'}
              >
                <Scale className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Bottom Editorial Outfit Caption Overlay */}
        <div className="relative z-20 p-5 sm:p-6 pb-6 text-white space-y-2 transform transition-transform duration-300">
          
          {/* Brand & Material Subhead */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#dfb76c]">
                {product.brand || 'Swift Atelier'}
              </span>
              <span className="text-zinc-400 text-xs">•</span>
              <span className="text-[10px] sm:text-[11px] font-medium tracking-wide text-zinc-300 line-clamp-1">
                {materialTag}
              </span>
            </div>

            {/* Color Swatches */}
            {colorOptions.length > 0 ? (
              <div className="flex items-center gap-1">
                {colorOptions.slice(0, 3).map((opt) => (
                  <span
                    key={opt.id}
                    title={opt.value}
                    className="w-2.5 h-2.5 rounded-full border border-white/40 shadow-xs inline-block transition-transform hover:scale-125"
                    style={{ backgroundColor: opt.colorHex || '#d4cbbe' }}
                  />
                ))}
              </div>
            ) : primaryColorHex ? (
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/40 shadow-xs inline-block"
                style={{ backgroundColor: primaryColorHex }}
              />
            ) : null}
          </div>

          {/* Product Title */}
          <Link href={`/product/${product.id}`}>
            <h3 className="font-serif text-xl sm:text-[22px] font-bold leading-[1.2] text-white drop-shadow-sm group-hover:text-[#dfb76c] transition-colors line-clamp-2">
              <HighlightText text={product.title} query={searchQuery} />
            </h3>
          </Link>

          {/* Subtitle / Short Description */}
          <p className="text-xs sm:text-[13px] text-zinc-300 line-clamp-1 mt-1 font-normal tracking-normal">
            {product.description || materialTag}
          </p>

          {/* Pricing, Rating & View Look Action Row */}
          <div className="flex items-center justify-between mt-3 pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-black text-[#dfb76c] tracking-tight font-sans">
                {formatPrice(discountedPrice)}
              </span>
              {product.discountPercentage > 0 && (
                <span className="text-xs text-zinc-400 line-through font-mono font-normal">
                  {formatPrice(product.price)}
                </span>
              )}
              <div className="flex items-center gap-1 text-[11px] text-amber-300 ml-2 font-mono">
                <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
            </div>

            <Link
              href={`/product/${product.id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider bg-white hover:bg-stone-100 text-zinc-900 px-4 py-2 rounded-full transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-900" strokeWidth={2.2} />
              <span>VIEW</span>
            </Link>
          </div>

          {/* 5. Hover Action Strip (Shop Bag + 3D Try On + Quick View) */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={isHovered ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="flex items-center gap-2 pt-2.5 overflow-hidden"
          >
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-[#8b6f47] hover:bg-[#725a38] text-white py-2.5 px-3 rounded-full flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{product.stock === 0 ? 'Out of Stock' : 'Add to Bag'}</span>
            </button>

            <Link
              href={`/dressing-room?product=${product.id}&category=${product.category || 'all'}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 shrink-0"
            >
              <span className="w-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-white/20 hover:bg-white/30 backdrop-blur-md text-white py-2.5 px-3 rounded-full flex items-center justify-center gap-1.5 transition-colors border border-white/30 active:scale-95 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5 text-[#dfb76c] shrink-0" /> <span className="whitespace-nowrap">3D Try On</span>
              </span>
            </Link>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsQuickViewOpen(true);
              }}
              className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Quick Inspector"
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick View Modal (Only mounted on demand) */}
      {isQuickViewOpen && (
        <Modal
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
          size="2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 p-2 sm:p-6 text-left items-center">
            
            {/* Modal Image Box */}
            <div className="md:col-span-6 relative aspect-[3/4] min-h-[380px] sm:min-h-[480px] rounded-2xl overflow-hidden bg-[#F6F5F3] dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <Image
                src={displayImage || mainImage}
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

            {/* Modal Details */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#8b6f47] dark:text-[#c9a96b]">
                    {product.brand || 'Swift Atelier'}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {product.category}
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
                  {product.title}
                </h3>
                
                <p className="text-xs sm:text-sm font-medium text-[#8b6f47] dark:text-[#c9a96b]">
                  {materialTag}
                </p>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
                  {product.description}
                </p>

                {/* Color Swatches */}
                {colorOptions.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 block mb-1.5">
                      Available Colors:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {colorOptions.map((opt) => (
                        <span
                          key={opt.id}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-zinc-250 dark:border-zinc-700 text-[11px] font-medium bg-stone-50 dark:bg-zinc-900"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-zinc-300 inline-block"
                            style={{ backgroundColor: opt.colorHex || '#d4cbbe' }}
                          />
                          {opt.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews & Stock */}
                <div className="flex items-center gap-2 pt-2 text-xs">
                  <div className="flex items-center text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="ml-1 font-bold text-zinc-800 dark:text-zinc-200">{product.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span className="text-zinc-500 font-light">{mockReviewCount} reviews</span>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span className={`font-semibold ${product.stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {product.stock > 0 ? `In Stock (${product.stock} left)` : 'Sold Out'}
                  </span>
                </div>
              </div>

              {/* Pricing in Modal */}
              <div className="flex items-baseline gap-3 py-2 border-y border-zinc-150 dark:border-zinc-800">
                <span className="font-mono text-2xl font-bold text-zinc-900 dark:text-white">
                  {formatPrice(discountedPrice)}
                </span>
                {product.discountPercentage > 0 && (
                  <>
                    <span className="font-mono text-sm text-zinc-400 line-through">
                      {formatPrice(product.price)}
                    </span>
                    <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      Save {product.discountPercentage}%
                    </span>
                  </>
                )}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-zinc-950 hover:bg-[#8b6f47] text-white rounded-full font-bold py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
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
                    className="w-full rounded-full font-bold py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border-zinc-300 dark:border-zinc-700 hover:bg-stone-100"
                  >
                    View Full Details <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </Modal>
      )}
    </>
  );
}
