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
  syncGuestCart: () => Promise<void>;
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
        const previousItems = get().items;
        const productId = product.id;
        const existingItem = previousItems.find((item) => String(item.product.id) === String(productId));

        // 1. Optimistic Update (Immediate UI response)
        let optimisticItems: CartItem[] = [];
        if (existingItem) {
          optimisticItems = previousItems.map((item) =>
            String(item.product.id) === String(productId)
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          optimisticItems = [...previousItems, { product, quantity }];
        }
        set({ items: optimisticItems });

        // 2. Asynchronous backend sync if logged in
        if (getAccessToken()) {
          try {
            const response = await apiClient.post('/cart', { productId, quantity });
            if (response.data?.success) {
              const backendItems = response.data.data.products.map((item: any) => ({
                product: item.product,
                quantity: item.quantity,
              }));
              set({ items: backendItems });
            } else {
              throw new Error('Backend update unsuccessful');
            }
          } catch (error) {
            console.error('Failed to add item to backend cart, rolling back:', error);
            // Roll back state to previous items cache
            set({ items: previousItems });
            throw error; // Re-throw to trigger toast warning in UI
          }
        }
      },

      removeItem: async (productId) => {
        const previousItems = get().items;
        
        // 1. Optimistic Update
        const optimisticItems = previousItems.filter((item) => String(item.product.id) !== String(productId));
        set({ items: optimisticItems });

        // 2. Asynchronous backend sync if logged in
        if (getAccessToken()) {
          try {
            const response = await apiClient.delete(`/cart/${productId}`);
            if (response.data?.success) {
              const backendItems = response.data.data.products.map((item: any) => ({
                product: item.product,
                quantity: item.quantity,
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

      updateQuantity: async (productId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(productId);
          return;
        }

        const previousItems = get().items;

        // 1. Optimistic Update
        const optimisticItems = previousItems.map((item) =>
          String(item.product.id) === String(productId) ? { ...item, quantity } : item
        );
        set({ items: optimisticItems });

        // 2. Asynchronous backend sync if logged in
        if (getAccessToken()) {
          try {
            const response = await apiClient.put('/cart', { productId, quantity });
            if (response.data?.success) {
              const backendItems = response.data.data.products.map((item: any) => ({
                product: item.product,
                quantity: item.quantity,
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
          // Push guest cart items to backend cart safely
          await Promise.all(
            guestItems.map((item) =>
              apiClient.post('/cart', {
                productId: item.product.id,
                quantity: item.quantity,
              }).catch((err) => {
                console.warn(`Could not sync item ${item.product.id} to cart:`, err);
                return null;
              })
            )
          );
          // Load integrated cart from backend
          const response = await apiClient.get('/cart').catch(() => null);
          if (response?.data?.success && response.data.data?.products) {
            const backendItems = response.data.data.products
              .filter((item: any) => item.product)
              .map((item: any) => ({
                product: item.product,
                quantity: item.quantity,
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
