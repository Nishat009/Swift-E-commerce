'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, X, ArrowRight, Trash2 } from 'lucide-react';
import { useCompareStore } from '@/stores/compareStore';
import Button from '@/components/ui/Button';

export default function StickyCompareBar() {
  const { items, removeFromCompare, clearCompare, openCompareModal } = useCompareStore();

  if (items.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-3xl p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-3"
      >
        {/* Selected Thumbnails */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {items.map((product) => (
            <div
              key={product.id}
              className="relative flex-shrink-0 group w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-xs"
            >
              <Image
                src={product.thumbnail || product.images?.[0] || ''}
                alt={product.title}
                fill
                className="object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromCompare(product.id);
                }}
                className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove product"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Empty Placeholders up to 3 */}
          {Array.from({ length: 3 - items.length }).map((_, idx) => (
            <div
              key={idx}
              className="w-12 h-12 flex-shrink-0 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-700"
            >
              <Scale className="w-4 h-4" />
            </div>
          ))}
        </div>

        {/* Counter and Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={clearCompare}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition"
            title="Clear comparison list"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <Button
            onClick={openCompareModal}
            className="bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 rounded-full text-xs font-bold px-4 py-2.5 flex items-center gap-2 shadow-sm"
          >
            <Scale className="w-4 h-4" />
            <span>Compare ({items.length}/3)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
