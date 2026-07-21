'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Star, Check, Minus, Trash2, ArrowRight, ShieldCheck, Scale } from 'lucide-react';
import { useCompareStore } from '@/stores/compareStore';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';

export default function CompareModal() {
  const { items, isOpen, closeCompareModal, removeFromCompare, clearCompare } = useCompareStore();
  const addItem = useCartStore((state) => state.addItem);
  const toast = useToast();

  if (!isOpen || items.length === 0) return null;

  // Gather all unique specification keys across all products
  const allSpecKeys = Array.from(
    new Set(
      items.flatMap((p) => (p.specifications ? Object.keys(p.specifications) : []))
    )
  );

  const handleAddToCart = (product: any) => {
    addItem(product, 1);
    toast.success(`Added ${product.title} to cart!`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeCompareModal}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-6xl bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl border border-gray-150 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-950/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] rounded-xl">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-gray-900 dark:text-white">
                  Product Comparison ({items.length}/3)
                </h2>
                <p className="text-xs text-text-muted">
                  Side-by-side feature and technical specification matrix
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={clearCompare}
                className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
              <button
                onClick={closeCompareModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Matrix Content */}
          <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr>
                  <th className="w-44 p-4 text-xs font-black uppercase text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                    Product Summary
                  </th>
                  {items.map((product) => (
                    <th
                      key={product.id}
                      className="p-4 border-b border-gray-100 dark:border-gray-800 min-w-[220px] align-top"
                    >
                      <div className="relative group bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center">
                        <button
                          onClick={() => removeFromCompare(product.id)}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition"
                          title="Remove from comparison"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="relative w-24 h-24 mb-3 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-xs">
                          <Image
                            src={product.thumbnail || product.images?.[0] || ''}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider mb-0.5">
                          {product.brand}
                        </span>

                        <Link
                          href={`/product/${product.id}`}
                          onClick={closeCompareModal}
                          className="text-xs font-serif font-bold text-gray-900 dark:text-white hover:text-[#8b6f47] line-clamp-1 mb-1"
                        >
                          {product.title}
                        </Link>

                        <div className="text-sm font-bold text-[#8b6f47] dark:text-[#c9a96b] mb-3">
                          ${product.price}
                          {product.salePrice && (
                            <span className="text-xs text-gray-400 line-through ml-1.5 font-normal">
                              ${product.salePrice}
                            </span>
                          )}
                        </div>

                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="w-full bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                {/* Rating & Reviews */}
                <tr>
                  <td className="p-4 font-bold text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-950/30">
                    Rating & Reviews
                  </td>
                  {items.map((product) => (
                    <td key={product.id} className="p-4">
                      <div className="flex items-center gap-1 text-yellow-500 font-bold">
                        <Star className="w-4 h-4 fill-yellow-500" />
                        <span>{product.rating.toFixed(1)}</span>
                        <span className="text-gray-400 font-normal">
                          ({product.reviewCount || 12} reviews)
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Stock & Availability */}
                <tr>
                  <td className="p-4 font-bold text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-950/30">
                    Stock & Availability
                  </td>
                  {items.map((product) => (
                    <td key={product.id} className="p-4">
                      {product.stock > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-lg text-[11px]">
                          <Check className="w-3.5 h-3.5" />
                          <span>In Stock ({product.totalStock || product.stock} available)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-lg text-[11px]">
                          <Minus className="w-3.5 h-3.5" />
                          <span>Out of Stock</span>
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Category & Brand */}
                <tr>
                  <td className="p-4 font-bold text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-950/30">
                    Category & Brand
                  </td>
                  {items.map((product) => (
                    <td key={product.id} className="p-4 text-gray-700 dark:text-gray-300">
                      <span className="capitalize font-medium">{product.category}</span> by{' '}
                      <span className="font-bold text-gray-900 dark:text-white">{product.brand}</span>
                    </td>
                  ))}
                </tr>

                {/* Badges & Tags */}
                <tr>
                  <td className="p-4 font-bold text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-950/30">
                    Badges & Tags
                  </td>
                  {items.map((product) => (
                    <td key={product.id} className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {product.tags && product.tags.length > 0 ? (
                          product.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] font-bold text-[10px] rounded-md"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 font-normal">Standard Item</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Dynamic Specifications Rows */}
                {allSpecKeys.map((specKey) => (
                  <tr key={specKey}>
                    <td className="p-4 font-bold text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-950/30">
                      {specKey}
                    </td>
                    {items.map((product) => {
                      const value = product.specifications?.[specKey];
                      return (
                        <td key={product.id} className="p-4 text-gray-700 dark:text-gray-300">
                          {value ? (
                            <span className="font-medium">{value}</span>
                          ) : (
                            <span className="text-gray-400 italic">N/A</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Shipping & Returns */}
                <tr>
                  <td className="p-4 font-bold text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-950/30">
                    Shipping & Guarantee
                  </td>
                  {items.map((product) => (
                    <td key={product.id} className="p-4">
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{product.shippingInfo?.freeShipping ? 'Free Delivery' : 'Standard Shipping'}</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                          {product.shippingInfo?.estimate || '2-4 Business Days'}
                        </p>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50 flex justify-between items-center">
            <span className="text-xs text-text-muted">
              Click any product title above to view full product details page.
            </span>
            <Button
              variant="outline"
              onClick={closeCompareModal}
              className="rounded-full text-xs font-bold px-5 py-2"
            >
              Close Comparison
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
