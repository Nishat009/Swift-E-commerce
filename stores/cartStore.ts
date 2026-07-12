import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';
import apiClient, { getAccessToken } from '@/lib/apiClient';

interface CartStore {
  items: CartItem[];
  loadCart: () => Promise<void>;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string | number) => Promise<void>;
  updateQuantity: (productId: string | number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      loadCart: async () => {
        if (!getAccessToken()) return;
        try {
          const response = await apiClient.get('/cart');
          if (response.data?.success) {
            const backendItems = response.data.data.products.map((item: any) => ({
              product: item.product,
              quantity: item.quantity,
            }));
            set({ items: backendItems });
          }
        } catch (error) {
          console.error('Failed to load cart from backend:', error);
        }
      },

      addItem: async (product, quantity = 1) => {
        const items = get().items;
        const productId = product.id;
        const existingItem = items.find((item) => String(item.product.id) === String(productId));

        // 1. Sync with backend if logged in
        if (getAccessToken()) {
          try {
            const response = await apiClient.post('/cart', { productId, quantity });
            if (response.data?.success) {
              const backendItems = response.data.data.products.map((item: any) => ({
                product: item.product,
                quantity: item.quantity,
              }));
              set({ items: backendItems });
              return;
            }
          } catch (error) {
            console.error('Failed to add item to backend cart:', error);
          }
        }

        // 2. Local fallback
        if (existingItem) {
          set({
            items: items.map((item) =>
              String(item.product.id) === String(productId)
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ items: [...items, { product, quantity }] });
        }
      },

      removeItem: async (productId) => {
        // 1. Sync with backend if logged in
        if (getAccessToken()) {
          try {
            const response = await apiClient.delete(`/cart/${productId}`);
            if (response.data?.success) {
              const backendItems = response.data.data.products.map((item: any) => ({
                product: item.product,
                quantity: item.quantity,
              }));
              set({ items: backendItems });
              return;
            }
          } catch (error) {
            console.error('Failed to remove item from backend cart:', error);
          }
        }

        // 2. Local fallback
        set({ items: get().items.filter((item) => String(item.product.id) !== String(productId)) });
      },

      updateQuantity: async (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        // 1. Sync with backend if logged in
        if (getAccessToken()) {
          try {
            const response = await apiClient.put('/cart', { productId, quantity });
            if (response.data?.success) {
              const backendItems = response.data.data.products.map((item: any) => ({
                product: item.product,
                quantity: item.quantity,
              }));
              set({ items: backendItems });
              return;
            }
          } catch (error) {
            console.error('Failed to update quantity in backend cart:', error);
          }
        }

        // 2. Local fallback
        set({
          items: get().items.map((item) =>
            String(item.product.id) === String(productId) ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: async () => {
        // 1. Sync with backend if logged in
        if (getAccessToken()) {
          try {
            await apiClient.post('/cart/clear');
          } catch (error) {
            console.error('Failed to clear backend cart:', error);
          }
        }

        // 2. Local fallback
        set({ items: [] });
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = item.product.price * (1 - item.product.discountPercentage / 100);
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
