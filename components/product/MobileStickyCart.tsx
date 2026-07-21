'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import Button from '@/components/ui/Button';

export interface MobileStickyCartProps {
  title: string;
  price: number;
  salePrice?: number;
  activeVariantSummary?: string;
  isOutOfStock?: boolean;
  onAddToCart: () => void;
}

export default function MobileStickyCart({
  title,
  price,
  salePrice,
  activeVariantSummary,
  isOutOfStock = false,
  onAddToCart,
}: MobileStickyCartProps) {
  const displayPrice = salePrice || price;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-3 lg:hidden shadow-2xl flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h4 className="text-xs font-serif font-bold text-gray-900 dark:text-white truncate">
          {title}
        </h4>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-sm font-bold text-[#8b6f47] dark:text-[#c9a96b]">
            ${displayPrice}
          </span>
          {activeVariantSummary && (
            <span className="text-[10px] text-text-muted font-bold truncate">
              • {activeVariantSummary}
            </span>
          )}
        </div>
      </div>

      <Button
        disabled={isOutOfStock}
        onClick={onAddToCart}
        className="bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 text-xs font-bold py-2.5 px-5 rounded-full flex items-center gap-1.5 shadow-sm"
      >
        <ShoppingCart className="w-4 h-4" />
        <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
      </Button>
    </div>
  );
}
