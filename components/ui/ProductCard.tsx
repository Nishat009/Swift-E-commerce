'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import Card from './Card';
import Button from './Button';
import { useCartStore } from '@/stores/cartStore';
import { ShoppingCart, Star } from 'lucide-react';
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
          <Card className="p-4 flex flex-row gap-4 hover:shadow-md transition-shadow duration-300">
            <motion.div
              className="relative w-32 h-32 flex-shrink-0 rounded-sm overflow-hidden"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src={product.thumbnail}
                alt={product.title}
                fill
                className="object-cover"
              />
            </motion.div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-serif font-semibold text-[#2c2c2c] mb-1">
                  {product.title}
                </h3>
                <p className="text-sm text-[#6b6b6b] line-clamp-2 mb-2">
                  {product.description}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-[#d4a574] text-[#d4a574]" />
                    <span className="text-sm text-[#6b6b6b] ml-1">
                      {product.rating}
                    </span>
                  </div>
                  <span className="text-sm text-[#9c9c9c]">
                    ({product.stock} in stock)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-serif font-bold text-[#8b6f47]">
                    ${discountedPrice.toFixed(2)}
                  </span>
                  {product.discountPercentage > 0 && (
                    <>
                      <span className="text-sm text-[#9c9c9c] line-through">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-sm text-[#c17a5f] font-medium">
                        -{product.discountPercentage}%
                      </span>
                    </>
                  )}
                </div>
                <Button onClick={handleAddToCart} size="sm" variant="outline" className="border-[#8b6f47] text-[#8b6f47]">
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Add
                </Button>
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
        <Card className="overflow-hidden group h-full flex flex-col hover:shadow-lg transition-all duration-300 bg-white">
          <motion.div
            className="relative w-full h-56 sm:h-64 bg-[#f5f1eb] overflow-hidden"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              className="object-cover"
            />
            {product.discountPercentage > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 bg-[#c17a5f] text-white px-2.5 py-1 rounded-sm text-xs font-semibold shadow-md"
              >
                -{product.discountPercentage}%
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-3 right-3"
            >
              <Button
                onClick={handleAddToCart}
                size="sm"
                variant="classic"
                className="shadow-md"
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>
          <div className="p-4 sm:p-5 flex-1 flex flex-col">
            <h3 className="font-serif text-base sm:text-lg font-semibold text-[#2c2c2c] mb-2 line-clamp-1 group-hover:text-[#8b6f47] transition-colors">
              {product.title}
            </h3>
            <p className="text-sm text-[#6b6b6b] line-clamp-2 mb-3 flex-1">
              {product.description}
            </p>
            <div className="flex items-center gap-1 mb-3">
              <Star className="w-4 h-4 fill-[#d4a574] text-[#d4a574]" />
              <span className="text-sm text-[#6b6b6b]">
                {product.rating}
              </span>
              <span className="text-sm text-[#9c9c9c] ml-2">
                ({product.stock} left)
              </span>
            </div>
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#e8e0d6]">
              <div className="flex flex-col">
                <motion.span
                  className="font-serif text-lg sm:text-xl font-bold text-[#8b6f47]"
                  whileHover={{ scale: 1.05 }}
                >
                  ${discountedPrice.toFixed(2)}
                </motion.span>
                {product.discountPercentage > 0 && (
                  <span className="text-xs text-[#9c9c9c] line-through">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
