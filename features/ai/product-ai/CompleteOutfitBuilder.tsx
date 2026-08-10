import React, { useMemo } from 'react';
import { Product } from '@/types';
import { aiService } from '@/services/aiService';
import { fashionProducts } from '@/data/fashionCatalog';
import { useCartStore } from '@/stores/cartStore';
import { useAvatarStore } from '@/stores/avatarStore';
import { Sparkles, ShoppingBag, Layers, Plus, Check } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import AIBadge from '@/components/ui/AIBadge';

interface CompleteOutfitBuilderProps {
  baseProduct: Product;
}

export default function CompleteOutfitBuilder({ baseProduct }: CompleteOutfitBuilderProps) {
  const addItem = useCartStore((state) => state.addItem);
  const tryOnItem = useAvatarStore((state) => state.tryOnItem);

  const outfit = useMemo(() => {
    return aiService.generateCompleteOutfit(baseProduct, fashionProducts);
  }, [baseProduct]);

  const items = useMemo(() => {
    return [outfit.top, outfit.bottom, outfit.shoes, outfit.accessory].filter(Boolean) as Product[];
  }, [outfit]);

  const handleAddAllToCart = () => {
    items.forEach((item) => addItem(item, 1));
  };

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-amber-500/10 dark:from-amber-950/20 dark:via-purple-950/20 dark:to-amber-950/20 rounded-3xl p-6 border border-amber-500/20 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AIBadge type="match" label="AI Outfit Stylist" />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" />
            Create Complete Look
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            AI matched these complementary items for a total styled outfit.
          </p>
        </div>

        {/* Outfit Pricing Summary */}
        <div className="text-right">
          <p className="text-xs text-gray-500">Total Outfit Price:</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            ${outfit.totalPrice.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Outfit Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map((item, idx) => (
          <div
            key={item.id || idx}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl p-3 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between group hover:border-amber-500 transition-all"
          >
            <div>
              <div className="relative h-28 w-full rounded-xl overflow-hidden mb-2 bg-gray-100 dark:bg-gray-800">
                <Image
                  src={item.images?.[0] || item.thumbnail || item.image || '/placeholder-fashion.jpg'}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
                {item.id === baseProduct.id && (
                  <span className="absolute top-2 left-2 bg-amber-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                    Current Item
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                {item.title}
              </p>
              <p className="text-xs font-semibold text-amber-600 mt-0.5">
                ${item.price.toFixed(2)}
              </p>
            </div>

            <div className="flex gap-1.5 mt-3">
              <button
                onClick={() => tryOnItem(item)}
                className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-amber-50 text-gray-700 dark:text-gray-300 rounded-lg py-1 text-[10px] font-semibold transition-colors"
              >
                Try On
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Action CTA */}
      <div className="pt-2 flex flex-wrap gap-3">
        <Button onClick={handleAddAllToCart} className="flex-1 justify-center gap-2 text-xs font-bold py-3">
          <ShoppingBag className="w-4 h-4" />
          Add Entire Look To Cart (${outfit.totalPrice.toFixed(2)})
        </Button>
      </div>
    </div>
  );
}
