'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import Card from './Card';
import { useCartStore } from '@/stores/cartStore';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  index?: number;
}

export default function ProductCard({ product, viewMode = 'grid', index = 0 }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const discountedPrice = product.price * (1 - product.discountPercentage / 100);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touchscreen devices to fall back safely
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    setIsTouchDevice(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

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

    // Normalize coordinates to [-0.5, 0.5] range
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        whileHover={{ scale: 1.01 }}
      >
        <Link href={`/product/${product.id}`}>
          <Card className="p-4 flex flex-row gap-4 hover:shadow-md transition-shadow duration-300 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
            <motion.div
              className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-950"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src={product.thumbnail}
                alt={product.title}
                fill
                className="object-cover"
              />
              {product.discountPercentage > 0 && (
                <div className="absolute bottom-2 left-2 bg-red-650 text-white px-2 py-0.5 rounded text-[8px] font-bold">
                  -{product.discountPercentage}%
                </div>
              )}
            </motion.div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="block text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">
                  {product.brand}
                </span>
                <h3 className="text-base font-serif font-semibold text-gray-900 dark:text-white mb-1 leading-tight">
                  {product.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {product.description}
                </p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm sm:text-base font-black text-gray-950 dark:text-white">
                    ${discountedPrice.toFixed(0)}
                  </span>
                  {product.discountPercentage > 0 && (
                    <span className="text-xs text-gray-400 line-through">
                      ${product.price.toFixed(0)}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleAddToCart}
                  className="text-[10px] font-bold bg-gray-50 dark:bg-gray-800 hover:bg-[#8b6f47] hover:text-white text-gray-600 dark:text-gray-300 py-1.5 px-3 rounded-full transition-all border border-gray-100 dark:border-gray-700"
                >
                  Buy
                </button>
              </div>
            </div>
          </Card>
        </Link>
      </motion.div>
    );
  }

  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1000 }}
      className="h-full"
    >
      <Link href={`/product/${product.id}`} className="block h-full">
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

          {/* Wishlist Heart Button (Top-Right) */}
          <button
            onClick={handleWishlist}
            className="absolute top-4 right-4 z-20 bg-white/70 dark:bg-gray-900/70 hover:bg-white/90 dark:hover:bg-gray-900/90 backdrop-blur-md text-gray-700 dark:text-white p-2 rounded-full shadow-md transition-colors border border-gray-200/50 dark:border-gray-800"
            title="Wishlist"
          >
            <Heart 
              className={`w-3.5 h-3.5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700 dark:text-white'}`} 
            />
          </button>

          {/* Product Image Section (Card Background - Dynamic 3D Zoom Popup via Framer Motion) */}
          <motion.div 
            style={
              !isTouchDevice
                ? {
                    transformStyle: 'preserve-3d',
                  }
                : {}
            }
            animate={
              isHovered
                ? {
                    scale: 1.25,
                    y: -24,
                    z: isTouchDevice ? 0 : 60,
                  }
                : {
                    scale: 1.0,
                    y: 0,
                    z: 0,
                  }
            }
            transition={{
              type: 'spring',
              stiffness: 150,
              damping: 25,
            }}
            className="absolute inset-0 w-full h-full z-0 flex items-center justify-center pointer-events-none"
          >
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              className="object-cover"
            />
          </motion.div>

          {/* Bottom Gradient Overlay for Text Readability (Fades, blurs and slides on hover) */}
          <motion.div 
            animate={
              isHovered
                ? { opacity: 0, y: 12, filter: 'blur(8px)' }
                : { opacity: 1, y: 0, filter: 'blur(0px)' }
            }
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-zinc-100 via-zinc-100/95 to-transparent dark:from-zinc-950 dark:via-zinc-950/95 z-10 pointer-events-none"
          />

          {/* Details Content Overlay (Always active parent, with child animations) */}
          <motion.div 
            style={
              !isTouchDevice
                ? {
                    transformStyle: 'preserve-3d',
                  }
                : {}
            }
            animate={{
              y: 0,
              z: isTouchDevice ? 0 : 30,
            }}
            className="absolute bottom-0 inset-x-0 p-5 z-20 flex flex-col justify-end pointer-events-none [&_button]:pointer-events-auto text-gray-800 dark:text-white"
          >
            {/* Text details and price container (Fades/blurs out on hover) */}
            <motion.div
              animate={
                isHovered
                  ? {
                      opacity: 0,
                      y: 10,
                      filter: 'blur(6px)',
                    }
                  : {
                      opacity: 1,
                      y: 0,
                      filter: 'blur(0px)',
                    }
              }
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div>
                {/* Brand Name */}
                <span className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
                  {product.brand || 'SwiftBrand'}
                </span>

                {/* Product Title */}
                <h3 className="font-serif text-sm sm:text-base font-semibold text-gray-850 dark:text-gray-150 line-clamp-1 mb-1 leading-tight">
                  {product.title}
                </h3>

                {/* Short Description */}
                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mb-1.5 font-normal leading-relaxed">
                  {product.description || 'Premium design with high quality materials.'}
                </p>

                {/* Rating Section */}
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="flex items-center text-yellow-500 gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300 dark:text-gray-700'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-505 font-medium">({product.rating.toFixed(1)})</span>
                </div>
              </div>

              {/* Price and Discount Row */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm sm:text-base font-black text-gray-950 dark:text-[#f5f1eb]">
                  ${discountedPrice.toFixed(0)}
                </span>
                {product.discountPercentage > 0 && (
                  <>
                    <span className="text-xs text-gray-400 line-through">
                      ${product.price.toFixed(0)}
                    </span>
                    <span className="bg-red-650 text-white font-bold px-1.5 py-0.5 rounded-lg text-[9px] shadow-sm">
                      -{product.discountPercentage}%
                    </span>
                  </>
                )}
              </div>
            </motion.div>

            {/* Action Buttons Row (Stays visible and clickable on hover, slides up slightly) */}
            <motion.div
              animate={
                isHovered
                  ? {
                      y: -12,
                      scale: 1.02,
                    }
                  : {
                      y: 0,
                      scale: 1.0,
                    }
              }
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full pointer-events-auto"
            >
              <button
                onClick={handleAddToCart}
                className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-2.5 px-4 rounded-full text-[11px] transition-all duration-200 text-center shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                Add to Cart
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
