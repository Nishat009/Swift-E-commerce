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
              <span className="text-stone-500">
                {group.name}: <span className="font-medium text-ink">{activeOption?.value}</span>
              </span>
              {activeOption && activeOption.stock > 0 && (
                <span className="text-xs text-stone-500">
                  {activeOption.stock} available
                </span>
              )}
            </div>

            {/* Options Buttons */}
            <div className="flex flex-wrap gap-2">
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
                      whileTap={!isOutOfStock ? { scale: 0.94 } : undefined}
                      className={cn(
                        'relative w-8 h-8 rounded-full flex items-center justify-center ring-1 ring-black/10 dark:ring-white/20 ring-offset-2 ring-offset-paper transition-all cursor-pointer',
                        isSelected && 'ring-2 ring-ink dark:ring-ink',
                        isOutOfStock && 'opacity-40 cursor-not-allowed'
                      )}
                      style={{ backgroundColor: opt.colorHex }}
                      title={`${opt.value} ${isOutOfStock ? '(Out of Stock)' : ''}`}
                      aria-label={`${group.name} ${opt.value}${isOutOfStock ? ', out of stock' : ''}`}
                      aria-pressed={isSelected}
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
                    whileTap={!isOutOfStock ? { scale: 0.97 } : undefined}
                    aria-pressed={isSelected}
                    className={cn(
                      'min-w-12 h-10 px-4 rounded-md text-[13px] border transition-colors flex items-center justify-center gap-1.5 cursor-pointer',
                      isSelected
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-transparent text-ink border-line hover:border-ink',
                      isOutOfStock && 'opacity-40 cursor-not-allowed line-through hover:border-line'
                    )}
                  >
                    <span>{opt.value}</span>
                    {opt.priceDelta && opt.priceDelta > 0 ? (
                      <span className={cn('text-[11px]', isSelected ? 'opacity-70' : 'text-stone-500')}>
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
