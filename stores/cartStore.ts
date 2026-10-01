import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, VariantCombination } from '@/types';
import apiClient, { getAccessToken } from '@/lib/apiClient';

interface BackendCartProduct {
  product: Product;
  quantity: number;
  variant?: VariantCombination;
}

interface CartStore {
  items: CartItem[];
  loadCart: () => Promise<void>;
  addItem: (product: Product, quantity?: number, selectedVariant?: VariantCombination) => Promise<void>;
  removeItem: (productId: string | number, variantId?: string) => Promise<void>;
  updateQuantity: (productId: string | number, quantity: number, variantId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  syncGuestCart: () => Promise<void>;
}

const isSameItem = (item: CartItem, productId: string | number, variantId?: string) => {
  const sameProd = String(item.product.id) === String(productId);
  const currentVarId = item.selectedVariant?.id || '';
  const targetVarId = variantId || '';
  return targetVarId ? (sameProd && currentVarId === targetVarId) : sameProd;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      loadCart: async () => {
        if (!getAccessToken()) return;
        try {
          const response = await apiClient.get('/cart');
          if (response.data?.success && Array.isArray(response.data.data?.products)) {
            const backendItems = (response.data.data.products as BackendCartProduct[])
              .filter((item) => Boolean(item.product))
              .map((item) => ({
                product: item.product,
                quantity: item.quantity,
                selectedVariant: item.variant || undefined,
              }));
            set({ items: backendItems });
          }
        } catch (error) {
          console.error('Failed to load cart from backend:', error);
        }
      },

      addItem: async (product, quantity = 1, selectedVariant) => {
        const previousItems = get().items;
        const productId = product.id;
        const variantId = selectedVariant?.id;
        const existingItem = previousItems.find((item) => isSameItem(item, productId, variantId));

        // 1. Optimistic Update (Immediate UI response)
        let optimisticItems: CartItem[] = [];
        if (existingItem) {
          optimisticItems = previousItems.map((item) =>
            isSameItem(item, productId, variantId)
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          optimisticItems = [...previousItems, { product, quantity, selectedVariant }];
        }
        set({ items: optimisticItems });

        // 2. Asynchronous backend sync if logged in
        if (getAccessToken()) {
          try {
            const response = await apiClient.post('/cart', {
              productId,
              quantity,
              variant: selectedVariant,
            });
            if (response.data?.success && Array.isArray(response.data.data?.products)) {
              const backendItems = (response.data.data.products as BackendCartProduct[])
                .filter((item) => Boolean(item.product))
                .map((item) => ({
                  product: item.product,
                  quantity: item.quantity,
                  selectedVariant: item.variant || undefined,
                }));
              set({ items: backendItems });
            } else {
              throw new Error('Backend update unsuccessful');
            }
          } catch (error) {
            console.error('Failed to add item to backend cart, rolling back:', error);
            set({ items: previousItems });
            throw error;
          }
        }
      },

      removeItem: async (productId, variantId) => {
        const previousItems = get().items;
        
        // 1. Optimistic Update
        const optimisticItems = previousItems.filter((item) => !isSameItem(item, productId, variantId));
        set({ items: optimisticItems });

        // 2. Asynchronous backend sync if logged in
        if (getAccessToken()) {
          try {
            const query = variantId ? `?variantId=${encodeURIComponent(variantId)}` : '';
            const response = await apiClient.delete(`/cart/${productId}${query}`);
            if (response.data?.success && Array.isArray(response.data.data?.products)) {
              const backendItems = (response.data.data.products as BackendCartProduct[])
                .filter((item) => Boolean(item.product))
                .map((item) => ({
                  product: item.product,
                  quantity: item.quantity,
                  selectedVariant: item.variant || undefined,
                }));
              set({ items: backendItems });
            } else {
              throw new Error('Backend update unsuccessful');
            }
          } catch (error) {
            console.error('Failed to remove item from backend cart, rolling back:', error);
            set({ items: previousItems });
            throw error;
          }
        }
      },

      updateQuantity: async (productId, quantity, variantId) => {
        if (quantity <= 0) {
          await get().removeItem(productId, variantId);
          return;
        }

        const previousItems = get().items;

        // 1. Optimistic Update
        const optimisticItems = previousItems.map((item) =>
          isSameItem(item, productId, variantId) ? { ...item, quantity } : item
        );
        set({ items: optimisticItems });

        // 2. Asynchronous backend sync if logged in
        if (getAccessToken()) {
          try {
            const response = await apiClient.put('/cart', { productId, quantity, variantId });
            if (response.data?.success && Array.isArray(response.data.data?.products)) {
              const backendItems = (response.data.data.products as BackendCartProduct[])
                .filter((item) => Boolean(item.product))
                .map((item) => ({
                  product: item.product,
                  quantity: item.quantity,
                  selectedVariant: item.variant || undefined,
                }));
              set({ items: backendItems });
            } else {
              throw new Error('Backend update unsuccessful');
            }
          } catch (error) {
            console.error('Failed to update quantity in backend cart, rolling back:', error);
            set({ items: previousItems });
            throw error;
          }
        }
      },

      clearCart: async () => {
        const previousItems = get().items;

        // 1. Optimistic Update
        set({ items: [] });

        // 2. Asynchronous backend sync if logged in
        if (getAccessToken()) {
          try {
            await apiClient.post('/cart/clear');
          } catch (error) {
            console.error('Failed to clear backend cart, rolling back:', error);
            set({ items: previousItems });
            throw error;
          }
        }
      },

      syncGuestCart: async () => {
        const guestItems = get().items;
        if (guestItems.length === 0 || !getAccessToken()) return;
        try {
          await Promise.all(
            guestItems.map((item) =>
              apiClient.post('/cart', {
                productId: item.product.id,
                quantity: item.quantity,
                variant: item.selectedVariant,
              }).catch((err) => {
                console.warn(`Could not sync item ${item.product.id} to cart:`, err);
                return null;
              })
            )
          );
          const response = await apiClient.get('/cart').catch(() => null);
          if (response?.data?.success && Array.isArray(response.data.data?.products)) {
            const backendItems = (response.data.data.products as BackendCartProduct[])
              .filter((item) => Boolean(item.product))
              .map((item) => ({
                product: item.product,
                quantity: item.quantity,
                selectedVariant: item.variant || undefined,
              }));
            if (backendItems.length > 0) {
              set({ items: backendItems });
            }
          }
        } catch (error) {
          console.error('Failed to sync guest cart to backend:', error);
        }
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          if (!item.product) return total;
          const discount = item.product.discountPercentage || 0;
          const price = (item.product.price || 0) * (1 - discount / 100);
          return total + price * item.quantity;
        }, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
