import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

interface CompareStore {
  items: Product[];
  isOpen: boolean;
  addToCompare: (product: Product) => boolean;
  removeFromCompare: (productId: string | number) => void;
  toggleCompare: (product: Product) => boolean;
  isInCompare: (productId: string | number) => boolean;
  clearCompare: () => void;
  openCompareModal: () => void;
  closeCompareModal: () => void;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addToCompare: (product) => {
        const { items } = get();
        if (items.some((p) => String(p.id) === String(product.id))) {
          return true;
        }
        if (items.length >= 3) {
          return false; // Reached maximum limit of 3
        }
        set({ items: [...items, product] });
        return true;
      },

      removeFromCompare: (productId) => {
        set({
          items: get().items.filter((p) => String(p.id) !== String(productId)),
        });
      },

      toggleCompare: (product) => {
        const { items, addToCompare, removeFromCompare } = get();
        const exists = items.some((p) => String(p.id) === String(product.id));
        if (exists) {
          removeFromCompare(product.id);
          return false;
        } else {
          return addToCompare(product);
        }
      },

      isInCompare: (productId) => {
        return get().items.some((p) => String(p.id) === String(productId));
      },

      clearCompare: () => {
        set({ items: [], isOpen: false });
      },

      openCompareModal: () => set({ isOpen: true }),
      closeCompareModal: () => set({ isOpen: false }),
    }),
    {
      name: 'swiftcart_compare_store',
    }
  )
);
