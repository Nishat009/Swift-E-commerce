import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, VariantCombination } from '@/types';
import apiClient, { getAccessToken } from '@/lib/apiClient';

interface BackendCartProduct {
  product: Product;
  quantity: number;
  variant?: VariantCombination;
}

interface BackendCart {
  products?: BackendCartProduct[];
  savedForLater?: BackendCartProduct[];
}

interface CartStore {
  items: CartItem[];
  // "Save for later" lines: kept on the account when signed in, in this browser for guests
  savedItems: CartItem[];
  loadCart: () => Promise<void>;
  addItem: (product: Product, quantity?: number, selectedVariant?: VariantCombination) => Promise<void>;
  removeItem: (productId: string | number, variantId?: string) => Promise<void>;
  updateQuantity: (productId: string | number, quantity: number, variantId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  saveForLater: (productId: string | number, variantId?: string) => Promise<void>;
  moveSavedToCart: (productId: string | number, variantId?: string) => Promise<void>;
  removeSaved: (productId: string | number, variantId?: string) => Promise<void>;
  adoptLegacySaved: () => Promise<void>;
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

const toCartItems = (lines?: BackendCartProduct[]): CartItem[] =>
  (lines || [])
    .filter((item) => Boolean(item.product))
    .map((item) => ({
      product: item.product,
      quantity: item.quantity,
      selectedVariant: item.variant || undefined,
    }));

// Cart + saved list from an API cart document, or null when the payload isn't one
const fromBackend = (cart?: BackendCart | null) =>
  cart && Array.isArray(cart.products)
    ? { items: toCartItems(cart.products), savedItems: toCartItems(cart.savedForLater) }
    : null;

const toLines = (list: CartItem[]) =>
  list.map((item) => ({
    productId: item.product.id,
    quantity: item.quantity,
    variant: item.selectedVariant,
  }));

// Items saved by older versions of the cart page, which kept the list in localStorage only
const LEGACY_SAVED_KEY = 'save-for-later';
const takeLegacySaved = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEGACY_SAVED_KEY);
    localStorage.removeItem(LEGACY_SAVED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((i) => i?.product?.id).map((i) => ({ product: i.product, quantity: Number(i.quantity) || 1 }))
      : [];
  } catch {
    return [];
  }
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      savedItems: [],

      loadCart: async () => {
        if (!getAccessToken()) return;
        try {
          const response = await apiClient.get('/cart');
          const next = response.data?.success ? fromBackend(response.data.data) : null;
          if (next) set(next);
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
            const next = response.data?.success ? fromBackend(response.data.data) : null;
            if (!next) throw new Error('Backend update unsuccessful');
            set(next);
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
            const next = response.data?.success ? fromBackend(response.data.data) : null;
            if (!next) throw new Error('Backend update unsuccessful');
            set(next);
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
            const next = response.data?.success ? fromBackend(response.data.data) : null;
            if (!next) throw new Error('Backend update unsuccessful');
            set(next);
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

      saveForLater: async (productId, variantId) => {
        const previous = { items: get().items, savedItems: get().savedItems };
        const line = previous.items.find((item) => isSameItem(item, productId, variantId));
        if (!line) return;
        const lineVariantId = line.selectedVariant?.id || '';

        // 1. Optimistic Update: the whole line moves; an existing saved line grows
        const alreadySaved = previous.savedItems.find((item) => isSameItem(item, productId, lineVariantId));
        set({
          items: previous.items.filter((item) => item !== line),
          savedItems: alreadySaved
            ? previous.savedItems.map((item) => (item === alreadySaved ? { ...item, quantity: item.quantity + line.quantity } : item))
            : [...previous.savedItems, line],
        });

        // 2. Asynchronous backend sync if logged in
        if (getAccessToken()) {
          try {
            const response = await apiClient.post('/cart/saved', { productId, variantId: lineVariantId });
            const next = response.data?.success ? fromBackend(response.data.data) : null;
            if (!next) throw new Error('Backend update unsuccessful');
            set(next);
          } catch (error) {
            console.error('Failed to save item for later, rolling back:', error);
            set(previous);
            throw error;
          }
        }
      },

      moveSavedToCart: async (productId, variantId) => {
        const previous = { items: get().items, savedItems: get().savedItems };
        const saved = previous.savedItems.find((item) => isSameItem(item, productId, variantId));
        if (!saved) return;

        if (getAccessToken()) {
          // The server checks stock before moving the line
          const query = saved.selectedVariant?.id ? { variantId: saved.selectedVariant.id } : {};
          const response = await apiClient.post(`/cart/saved/${productId}/move`, query);
          const next = response.data?.success ? fromBackend(response.data.data) : null;
          if (!next) throw new Error(response.data?.message || 'Could not move the item to your cart');
          set(next);
          return;
        }

        set({ savedItems: previous.savedItems.filter((item) => item !== saved) });
        try {
          await get().addItem(saved.product, saved.quantity, saved.selectedVariant);
        } catch (error) {
          set(previous);
          throw error;
        }
      },

      removeSaved: async (productId, variantId) => {
        const previousSaved = get().savedItems;

        // 1. Optimistic Update
        set({ savedItems: previousSaved.filter((item) => !isSameItem(item, productId, variantId)) });

        // 2. Asynchronous backend sync if logged in
        if (getAccessToken()) {
          try {
            const query = variantId ? `?variantId=${encodeURIComponent(variantId)}` : '';
            const response = await apiClient.delete(`/cart/saved/${productId}${query}`);
            const next = response.data?.success ? fromBackend(response.data.data) : null;
            if (!next) throw new Error('Backend update unsuccessful');
            set(next);
          } catch (error) {
            console.error('Failed to remove saved item, rolling back:', error);
            set({ savedItems: previousSaved });
            throw error;
          }
        }
      },

      adoptLegacySaved: async () => {
        const legacy = takeLegacySaved().filter(
          (old) => !get().savedItems.some((item) => isSameItem(item, old.product.id))
        );
        if (legacy.length === 0) return;
        if (!getAccessToken()) {
          set({ savedItems: [...get().savedItems, ...legacy] });
          return;
        }
        try {
          const response = await apiClient.post('/cart/saved/merge', { items: toLines(legacy) });
          const next = response.data?.success ? fromBackend(response.data.data) : null;
          if (next) set(next);
        } catch (error) {
          console.warn('Could not move saved-for-later items to your account:', error);
          set({ savedItems: [...get().savedItems, ...legacy] });
        }
      },

      syncGuestCart: async () => {
        const guestItems = get().items;
        const guestSaved = get().savedItems;
        if ((guestItems.length === 0 && guestSaved.length === 0) || !getAccessToken()) return;
        try {
          // One idempotent merge: syncing the same browser cart again never doubles quantities
          if (guestItems.length > 0) {
            await apiClient.post('/cart/merge', { items: toLines(guestItems) }).catch((err) => {
              console.warn('Could not merge the guest cart:', err);
              return null;
            });
          }
          if (guestSaved.length > 0) {
            await apiClient.post('/cart/saved/merge', { items: toLines(guestSaved) }).catch((err) => {
              console.warn('Could not merge saved-for-later items:', err);
              return null;
            });
          }
          const response = await apiClient.get('/cart').catch(() => null);
          const next = response?.data?.success ? fromBackend(response.data.data) : null;
          if (next && (next.items.length > 0 || next.savedItems.length > 0)) {
            set(next);
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
