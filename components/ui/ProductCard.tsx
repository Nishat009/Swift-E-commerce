'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import Card from './Card';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import apiClient from '@/lib/apiClient';
import Modal from './Modal';
import Button from './Button';
import { ShoppingCart, Heart, Star, Eye, Info, X } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  index?: number;
}

export default function ProductCard({ product, viewMode = 'grid', index = 0 }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const discountedPrice = product.price * (1 - product.discountPercentage / 100);
  
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Quick View Modal State
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Wishlist State
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    // Detect touchscreen devices to fall back safely
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    setIsTouchDevice(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (user && user.wishlist) {
      // In the database user.wishlist can contain raw IDs or objects
      const wishlistIds = user.wishlist.map((item: any) => String(item._id || item.id || item));
      setIsWishlisted(wishlistIds.includes(String(product.id)));
    } else {
      setIsWishlisted(false);
    }
  }, [user, product.id]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Dynamic spring-loaded tilt physical rotation values
  const springConfig = { stiffness: 150, damping: 25 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), springConfig);

  // Dynamic light glow overlay coordinates following mouse position
  const shineBackground = useTransform(
    [x, y],
    ([latestX, latestY]) => {
      const xPos = (Number(latestX) + 0.5) * 100;
      const yPos = (Number(latestY) + 0.5) * 100;
      return `radial-gradient(circle at ${xPos}% ${yPos}%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 55%)`;
    }
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const relativeX = (mouseX / width) - 0.5;
    const relativeY = (mouseY / height) - 0.5;

    x.set(relativeX);
    y.set(relativeY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addItem(product);
      toast.success(`Added "${product.title}" to your cart.`);
    } catch (err) {
      toast.error('Failed to add item to cart.');
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
          toast.success(`Removed "${product.title}" from wishlist.`);
          await refreshUser();
        }
      } else {
        const res = await apiClient.post('/wishlist', { productId: product.id });
        if (res.data?.success) {
          setIsWishlisted(true);
          toast.success(`Added "${product.title}" to wishlist.`);
          await refreshUser();
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update wishlist state.');
    } finally {
      setWishlistLoading(false);
    }
  };

  // Mock stats for recruits wow-factor
  const mockReviewCount = Math.floor((Number(String(product.id).charCodeAt(0)) % 40) + 12);
  const mockSoldCount = Math.floor((Number(String(product.id).charCodeAt(0)) % 250) + 30);
  const isBestSeller = mockSoldCount > 180;

  // Determine stock text and colors
  const getStockBadge = () => {
    if (product.stock === 0) {
      return <span className="bg-red-500/10 border border-red-500/20 text-red-500 rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">Out of Stock</span>;
    }
    if (product.stock <= 5) {
      return <span className="bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">Only {product.stock} Left!</span>;
    }
    return <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">In Stock</span>;
  };

  // Hover images
  const mainImage = product.thumbnail;
  const hoverImage = (product.images && product.images[1]) || (product.images && product.images[0]) || product.thumbnail;

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        whileHover={{ scale: 1.01 }}
      >
        <div className="block cursor-pointer">
          <Card className="p-4 flex flex-row gap-4 hover:shadow-md transition-shadow duration-300 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl relative">
            <Link href={`/product/${product.id}`}>
              <div className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-950">
                <Image
                  src={mainImage}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
                {product.discountPercentage > 0 && (
                  <div className="absolute bottom-2 left-2 bg-red-650 text-white px-2 py-0.5 rounded text-[8px] font-bold">
                    -{product.discountPercentage}%
                  </div>
                )}
              </div>
            </Link>
            
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="block text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">
                    {product.brand}
                  </span>
                  
                  {/* List Mode Wishlist toggle */}
                  <button
                    onClick={handleWishlistToggle}
                    disabled={wishlistLoading}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                </div>
                
                <Link href={`/product/${product.id}`}>
                  <h3 className="text-base font-serif font-semibold text-gray-900 dark:text-white mb-1 leading-tight hover:text-[#8b6f47]">
                    {product.title}
                  </h3>
                </Link>
                <p className="text-xs text-text-muted line-clamp-2">
                  {product.description}
                </p>
                
                <div className="flex items-center gap-2 mt-2">
                  {getStockBadge()}
                  <span className="text-[10px] text-text-muted">{mockSoldCount}+ sold</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 dark:border-gray-800">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm sm:text-base font-black text-gray-950 dark:text-white font-serif">
                    ${discountedPrice.toFixed(0)}
                  </span>
                  {product.discountPercentage > 0 && (
                    <span className="text-xs text-gray-400 line-through">
                      ${product.price.toFixed(0)}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsQuickViewOpen(true)}
                    className="p-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500"
                    title="Quick View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="text-[10px] font-bold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 py-1.5 px-4 rounded-full hover:scale-102 transition"
                  >
                    Buy
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ perspective: 1000 }}
        className="h-full"
      >
        <div className="block h-full cursor-pointer">
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={
              !isTouchDevice
                ? {
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                  }
                : {}
            }
            className="overflow-hidden group h-80 sm:h-96 flex flex-col justify-end bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-[32px] p-5 shadow-sm relative text-zinc-900 dark:text-zinc-100"
          >
            {/* Dynamic Shine Overlay */}
            {!isTouchDevice && (
              <motion.div
                style={{
                  background: shineBackground,
                }}
                className="absolute inset-0 pointer-events-none z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
            )}

            {/* Badges on Top-Left */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5">
              {isBestSeller && (
                <span className="bg-amber-500 text-white font-black px-2 py-0.5 rounded-lg text-[8px] shadow-sm uppercase tracking-wider text-center">
                  Bestseller
                </span>
              )}
              {product.discountPercentage > 0 && (
                <span className="bg-red-650 text-white font-black px-2 py-0.5 rounded-lg text-[8px] shadow-sm uppercase tracking-wider text-center">
                  -{product.discountPercentage}%
                </span>
              )}
            </div>

            {/* Wishlist Heart Button (Top-Right) */}
            <motion.button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              whileTap={{ scale: 0.8 }}
              className="absolute top-4 right-4 z-20 bg-white/70 dark:bg-gray-900/70 hover:bg-white/90 dark:hover:bg-gray-900/90 backdrop-blur-md text-gray-700 dark:text-white p-2.5 rounded-full shadow-md transition-colors border border-gray-200/50 dark:border-gray-800 flex items-center justify-center"
              title="Wishlist"
            >
              <Heart 
                className={`w-3.5 h-3.5 transition-colors ${
                  isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700 dark:text-white'
                }`} 
              />
            </motion.button>

            {/* Product Image Section (Cross-fade Hover Image Transition) */}
            <Link href={`/product/${product.id}`} className="absolute inset-0 w-full h-full z-0">
              <motion.div 
                style={!isTouchDevice ? { transformStyle: 'preserve-3d' } : {}}
                animate={isHovered ? { scale: 1.08, z: 20 } : { scale: 1.0, z: 0 }}
                transition={{ type: 'spring', stiffness: 150, damping: 25 }}
                className="w-full h-full relative"
              >
                {/* Main Image */}
                <Image
                  src={isHovered ? hoverImage : mainImage}
                  alt={product.title}
                  fill
                  className="object-cover transition-all duration-500"
                />
              </motion.div>
            </Link>

            {/* Bottom Gradient Overlay for Text Readability */}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-zinc-100 via-zinc-100/95 to-transparent dark:from-zinc-950 dark:via-zinc-950/95 z-10 pointer-events-none" />

            {/* Details Content Overlay */}
            <motion.div 
              style={!isTouchDevice ? { transformStyle: 'preserve-3d' } : {}}
              animate={{ y: 0, z: isTouchDevice ? 0 : 30 }}
              className="absolute bottom-0 inset-x-0 p-5 z-20 flex flex-col justify-end pointer-events-none [&_button]:pointer-events-auto [&_a]:pointer-events-auto text-gray-850 dark:text-white"
            >
              {/* Text details and price container (Fades/blurs out on hover) */}
              <motion.div
                animate={isHovered ? { opacity: 0, y: 15, filter: 'blur(6px)' } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <div>
                  <span className="block text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                    {product.brand || 'SwiftBrand'}
                  </span>

                  <Link href={`/product/${product.id}`} className="hover:underline">
                    <h3 className="font-serif text-sm sm:text-base font-bold text-gray-900 dark:text-white line-clamp-1 mb-1 leading-tight">
                      {product.title}
                    </h3>
                  </Link>

                  <p className="text-[10px] text-text-muted line-clamp-1 mb-2 font-normal leading-relaxed">
                    {product.description || 'Premium design with high quality materials.'}
                  </p>

                  {/* Rating & reviews row */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex items-center text-yellow-500 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300 dark:text-gray-700'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-[9px] text-text-muted font-bold font-sans">
                      ({product.rating.toFixed(1)}) • {mockReviewCount} reviews
                    </span>
                  </div>
                </div>

                {/* Price and Stock Status */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-black text-gray-950 dark:text-[#f5f1eb] font-serif">
                      ${discountedPrice.toFixed(0)}
                    </span>
                    {product.discountPercentage > 0 && (
                      <span className="text-xs text-gray-400 line-through">
                        ${product.price.toFixed(0)}
                      </span>
                    )}
                  </div>
                  {getStockBadge()}
                </div>
              </motion.div>

              {/* Action Buttons Row (Slides up on hover) */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={isHovered ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="w-full flex gap-2 pt-2"
              >
                <button
                  onClick={() => setIsQuickViewOpen(true)}
                  className="p-2.5 rounded-full border border-gray-250 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 bg-white dark:bg-gray-950 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors shadow-sm flex items-center justify-center cursor-pointer"
                  title="Quick View"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2.5 px-4 rounded-full text-[11px] transition-all duration-200 text-center shadow-sm hover:scale-[1.02] cursor-pointer"
                >
                  Add to Cart
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick View Modal */}
      <Modal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        title="Product Details Quick View"
        size="lg"
      >
        {isQuickViewOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
            
            {/* Gallery images inside modal */}
            <div className="relative w-full h-64 bg-gray-50 dark:bg-gray-950 rounded-2xl overflow-hidden border">
              <Image
                src={product.thumbnail}
                alt={product.title}
                fill
                className="object-cover"
              />
              {product.discountPercentage > 0 && (
                <div className="absolute top-3 left-3 bg-red-650 text-white font-bold px-2 py-0.5 rounded text-[8px]">
                  -{product.discountPercentage}% OFF
                </div>
              )}
            </div>

            {/* Product details description list */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                  {product.brand}
                </span>
                <h3 className="font-serif text-xl font-bold text-gray-950 dark:text-white mt-1 leading-tight">
                  {product.title}
                </h3>
                <p className="text-[11px] text-text-muted mt-2 leading-relaxed">
                  {product.description}
                </p>

                {/* Rating selection row */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center text-yellow-500 gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300 dark:text-gray-700'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-text-muted font-bold">
                    ({product.rating.toFixed(1)}) • {mockReviewCount} Reviews
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xl font-black text-gray-950 dark:text-white font-serif">
                    ${discountedPrice.toFixed(0)}
                  </span>
                  {product.discountPercentage > 0 && (
                    <span className="text-xs text-gray-400 line-through">
                      ${product.price.toFixed(0)}
                    </span>
                  )}
                  {getStockBadge()}
                </div>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full font-bold px-6 shadow-md border-0 text-xs py-2.5 flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </Button>
                <Link href={`/product/${product.id}`} className="flex-1" onClick={() => setIsQuickViewOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full rounded-full text-xs font-bold py-2.5 flex items-center justify-center gap-1"
                  >
                    View Page
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        )}
      </Modal>
    </>
  );
}
