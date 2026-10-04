import { create } from 'zustand';
import apiClient from '@/lib/apiClient';

// Source of truth is the backend /wishlist collection (not User.wishlist).
interface WishlistStore {
  ids: string[];
  ownerId: string | null;
  loading: boolean;
  load: (userId: string, force?: boolean) => Promise<void>;
  has: (productId: string | number) => boolean;
  add: (productId: string | number) => Promise<void>;
  remove: (productId: string | number) => Promise<void>;
  reset: () => void;
}

let inflight: Promise<void> | null = null;

const idsFromResponse = (data: unknown): string[] =>
  Array.isArray(data) ? data.map((p: any) => String(p?.id ?? p?._id ?? p)) : [];

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  ids: [],
  ownerId: null,
  loading: false,

  load: async (userId, force = false) => {
    if (!force && get().ownerId === userId) return;
    if (inflight) return inflight;
    set({ loading: true });
    inflight = apiClient
      .get('/wishlist')
      .then((res) => {
        set({ ids: idsFromResponse(res.data?.data), ownerId: userId });
      })
      .catch(() => {
        // keep previous state; a later mount can retry
      })
      .finally(() => {
        inflight = null;
        set({ loading: false });
      });
    return inflight;
  },

  has: (productId) => get().ids.includes(String(productId)),

  add: async (productId) => {
    const res = await apiClient.post('/wishlist', { productId });
    set({ ids: idsFromResponse(res.data?.data) });
  },

  remove: async (productId) => {
    const res = await apiClient.delete('/wishlist/' + productId);
    set({ ids: idsFromResponse(res.data?.data) });
  },

  reset: () => set({ ids: [], ownerId: null }),
}));
