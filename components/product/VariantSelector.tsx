'use client';

import React from 'react';
import { ProductVariantGroup, ProductVariantOption } from '@/types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

export interface VariantSelectorProps {
  variants?: ProductVariantGroup[];
  selectedOptions: Record<string, ProductVariantOption>;
  onOptionSelect: (groupName: string, option: ProductVariantOption) => void;
  className?: string;
}

export default function VariantSelector({
  variants,
  selectedOptions,
  onOptionSelect,
  className,
}: VariantSelectorProps) {
  if (!variants || variants.length === 0) return null;

  return (
    <div className={cn('space-y-5', className)}>
      {variants.map((group) => {
        const activeOption = selectedOptions[group.name] || group.options[0];

        return (
          <div key={group.id || group.name} className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black uppercase tracking-wider text-gray-900 dark:text-white">
                {group.name}: <span className="font-serif text-[#8b6f47] dark:text-[#c9a96b] font-bold">{activeOption?.value}</span>
              </span>
              {activeOption && activeOption.stock > 0 && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  ({activeOption.stock} available)
                </span>
              )}
            </div>

            {/* Options Buttons */}
            <div className="flex flex-wrap gap-2.5">
              {group.options.map((opt) => {
                const isSelected = activeOption?.id === opt.id || activeOption?.value === opt.value;
                const isOutOfStock = opt.stock === 0;

                // Color Swatch rendering
                if (group.name.toLowerCase() === 'color' && opt.colorHex) {
                  return (
                    <motion.button
                      key={opt.id || opt.value}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => onOptionSelect(group.name, opt)}
                      whileHover={!isOutOfStock ? { scale: 1.15 } : undefined}
                      whileTap={!isOutOfStock ? { scale: 0.9 } : undefined}
                      className={cn(
                        'relative w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer shadow-2xs',
                        isSelected ? 'border-[#8b6f47] dark:border-[#c9a96b] shadow-md ring-2 ring-[#8b6f47]/30' : 'border-gray-200 dark:border-gray-700',
                        isOutOfStock && 'opacity-40 cursor-not-allowed border-gray-300'
                      )}
                      style={{ backgroundColor: opt.colorHex }}
                      title={`${opt.value} ${isOutOfStock ? '(Out of Stock)' : ''}`}
                    >
                      {isSelected && (
                        <Check className={cn('w-4 h-4', ['#ffffff', '#fff', '#e3dac9', 'white', 'cream'].includes(opt.colorHex.toLowerCase()) ? 'text-black' : 'text-white')} />
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-red-500 rotate-45" />
                        </div>
                      )}
                    </motion.button>
                  );
                }

                // Standard Text Pill rendering (Size, Style, etc.)
                return (
                  <motion.button
                    key={opt.id || opt.value}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => onOptionSelect(group.name, opt)}
                    whileHover={!isOutOfStock ? { scale: 1.05 } : undefined}
                    whileTap={!isOutOfStock ? { scale: 0.95 } : undefined}
                    className={cn(
                      'px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer',
                      isSelected
                        ? 'bg-[#8b6f47] text-white border-transparent shadow-xs'
                        : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800 hover:border-gray-400',
                      isOutOfStock && 'opacity-40 cursor-not-allowed line-through bg-gray-100 dark:bg-gray-850'
                    )}
                  >
                    <span>{opt.value}</span>
                    {opt.priceDelta && opt.priceDelta > 0 ? (
                      <span className={cn('text-[10px]', isSelected ? 'text-white/80' : 'text-emerald-600 dark:text-emerald-400')}>
                        (+${opt.priceDelta})
                      </span>
                    ) : null}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
