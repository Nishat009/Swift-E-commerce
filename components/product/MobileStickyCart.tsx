'use client';

import React from 'react';
import Button from '@/components/ui/Button';

import { useCurrencyStore } from '@/stores/currencyStore';

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
  const { symbol, rate } = useCurrencyStore();
  const converted = displayPrice * rate;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-line bg-paper px-4 py-3 lg:hidden flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm text-ink">
          {title}
        </h4>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-sm font-medium tabular-nums text-ink">
            {symbol}{converted.toFixed(2)}
          </span>
          {activeVariantSummary && (
            <span className="truncate text-xs text-stone-500">
              · {activeVariantSummary}
            </span>
          )}
        </div>
      </div>

      <Button
        disabled={isOutOfStock}
        onClick={onAddToCart}
        className="h-11 shrink-0 px-6"
      >
        <span>{isOutOfStock ? 'Sold Out' : 'Add to bag'}</span>
      </Button>
    </div>
  );
}
