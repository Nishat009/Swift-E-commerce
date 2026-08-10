import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserPersonalizationProfile } from '@/types/ai';

interface AIStore {
  userProfile: UserPersonalizationProfile;
  searchHistory: string[];
  aiEnabled: boolean;
  tryOnPermission: boolean;
  privacyMode: boolean;

  // Actions
  updateUserProfile: (updates: Partial<UserPersonalizationProfile>) => void;
  trackViewedProduct: (productId: string) => void;
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  toggleAIEnabled: () => void;
  togglePrivacyMode: () => void;
}

const initialProfile: UserPersonalizationProfile = {
  stylePreference: 'casual',
  favoriteColors: ['Black', 'Blue', 'White'],
  favoriteCategories: ['Top', 'Pants', 'Jacket'],
  budgetTier: 'medium',
  preferredBrands: ['SwiftCart', 'UrbanStyle'],
  viewedProductIds: [],
};

export const useAIStore = create<AIStore>()(
  persist(
    (set) => ({
      userProfile: initialProfile,
      searchHistory: ['black shirt office', 'summer resort wear', 'denim jacket'],
      aiEnabled: true,
      tryOnPermission: true,
      privacyMode: false,

      updateUserProfile: (updates) =>
        set((state) => ({
          userProfile: { ...state.userProfile, ...updates },
        })),

      trackViewedProduct: (productId) =>
        set((state) => {
          const exists = state.userProfile.viewedProductIds.includes(productId);
          if (exists) return state;
          const updatedViewed = [productId, ...state.userProfile.viewedProductIds].slice(0, 10);
          return {
            userProfile: {
              ...state.userProfile,
              viewedProductIds: updatedViewed,
            },
          };
        }),

      addSearchHistory: (query) =>
        set((state) => {
          if (!query.trim()) return state;
          const filtered = state.searchHistory.filter((q) => q.toLowerCase() !== query.toLowerCase());
          return {
            searchHistory: [query, ...filtered].slice(0, 8),
          };
        }),

      clearSearchHistory: () => set({ searchHistory: [] }),

      toggleAIEnabled: () => set((state) => ({ aiEnabled: !state.aiEnabled })),
      togglePrivacyMode: () => set((state) => ({ privacyMode: !state.privacyMode })),
    }),
    {
      name: 'swiftcart-ai-store',
      partialize: (state) => ({
        userProfile: state.userProfile,
        searchHistory: state.searchHistory,
        aiEnabled: state.aiEnabled,
        privacyMode: state.privacyMode,
      }),
    }
  )
);
