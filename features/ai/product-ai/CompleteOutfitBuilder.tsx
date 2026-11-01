import React, { useMemo } from 'react';
import { Product } from '@/types';
import { aiService } from '@/services/aiService';
import { useCatalog } from '@/hooks/useCatalog';
import { useCartStore } from '@/stores/cartStore';
import { useAvatarStore } from '@/stores/avatarStore';
import { ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

interface CompleteOutfitBuilderProps {
  baseProduct: Product;
}

export default function CompleteOutfitBuilder({ baseProduct }: CompleteOutfitBuilderProps) {
  const addItem = useCartStore((state) => state.addItem);
  const tryOnItem = useAvatarStore((state) => state.tryOnItem);
  const toast = useToast();

  const { products: fashionProducts } = useCatalog();

  const outfit = useMemo(() => {
    return aiService.generateCompleteOutfit(baseProduct, fashionProducts);
  }, [baseProduct, fashionProducts]);

  const items = useMemo(() => {
    return [outfit.top, outfit.bottom, outfit.shoes, outfit.accessory].filter(Boolean) as Product[];
  }, [outfit]);

  const handleAddAllToCart = async () => {
    const available = items.filter((item) => item.stock > 0);
    if (available.length !== items.length) {
      toast.error('Some pieces in this look are out of stock.');
      return;
    }
    try {
      for (const item of available) await addItem(item, 1);
      toast.success('Outfit pieces added to cart.');
    } catch {
      toast.error('Could not add every piece. Please check your cart.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Outfit builder</p>
          <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Style it as a full look</h2>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
            Complementary pieces selected from the current catalog.
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-stone-500">Total outfit price</p>
          <p className="text-2xl font-medium tabular-nums text-ink">${outfit.totalPrice.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
        {items.map((item, idx) => (
          <div key={item.id || idx} className="group flex flex-col">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm bg-surface-muted">
              <Image
                src={item.images?.[0] || item.thumbnail || item.image || '/placeholder-fashion.jpg'}
                alt={item.title}
                fill
                sizes="(min-width: 640px) 25vw, 50vw"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {item.id === baseProduct.id && (
                <span className="absolute left-2 top-2 rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium text-ink">
                  Current item
                </span>
              )}
            </div>
            <p className="mt-3 line-clamp-1 text-sm text-ink">{item.title}</p>
            <p className="mt-0.5 text-sm font-medium tabular-nums text-ink">${item.price.toFixed(2)}</p>
            <button
              type="button"
              onClick={() => tryOnItem(item)}
              className="mt-2 w-fit cursor-pointer text-xs text-stone-500 underline underline-offset-4 transition-colors hover:text-ink"
            >
              Try on
            </button>
          </div>
        ))}
      </div>

      <Button onClick={handleAddAllToCart} size="lg" className="h-12 w-full sm:w-auto sm:px-10">
        <ShoppingBag className="size-4" />
        Add entire look to bag (${outfit.totalPrice.toFixed(2)})
      </Button>
    </div>
  );
}
