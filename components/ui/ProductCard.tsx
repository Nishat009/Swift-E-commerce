'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import Card from './Card';
import { useCartStore } from '@/stores/cartStore';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  index?: number;
}

export default function ProductCard({ product, viewMode = 'grid', index = 0 }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const discountedPrice = product.price * (1 - product.discountPercentage / 100);
  const [isHovered, setIsHovered] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-full"
    >
      <Link href={`/product/${product.id}`}>
        <Card className="overflow-hidden group h-full flex flex-col hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-3 shadow-sm">
          {/* Rounded Image Frame */}
          <div className="relative w-full h-56 sm:h-64 bg-[#f5f1eb] dark:bg-gray-950 rounded-2xl overflow-hidden">
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            
            {/* Discount Pill at Bottom-Left of the image (exactly matching user screenshot) */}
            {product.discountPercentage > 0 && (
              <div className="absolute bottom-3 left-3 bg-red-600 text-white px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider uppercase shadow-sm">
                -{product.discountPercentage}%
              </div>
            )}

            {/* Quick Add To Cart Button */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={handleAddToCart}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md text-[#8b6f47] p-2.5 rounded-full shadow-lg hover:bg-[#8b6f47] hover:text-white transition-colors"
                title="Add to Cart"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Details Content (matching user screenshot typography) */}
          <div className="pt-4 px-2 pb-2 flex-1 flex flex-col justify-between">
            <div>
              {/* Brand Name (tracked uppercase) */}
              <span className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
                {product.brand || 'SwiftBrand'}
              </span>

              {/* Product Title (serif style) */}
              <h3 className="font-serif text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 mb-2 group-hover:text-[#8b6f47] dark:group-hover:text-[#c9a96b] transition-colors leading-tight">
                {product.title}
              </h3>
            </div>

            {/* Price and Action Row (matching user screenshot price format) */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-150 dark:border-gray-800">
              <div className="flex items-baseline gap-2">
                <span className="text-sm sm:text-base font-black text-gray-950 dark:text-[#f5f1eb]">
                  ${discountedPrice.toFixed(0)}
                </span>
                {product.discountPercentage > 0 && (
                  <span className="text-xs text-gray-400 line-through">
                    ${product.price.toFixed(0)}
                  </span>
                )}
              </div>

              {/* Action pill button */}
              <button
                onClick={handleAddToCart}
                className="text-[10px] font-bold bg-gray-50 dark:bg-gray-850 hover:bg-[#8b6f47] hover:text-white dark:hover:bg-[#c9a96b] dark:hover:text-gray-950 text-gray-600 dark:text-gray-300 py-1.5 px-3 rounded-full transition-all border border-gray-100 dark:border-gray-800"
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
