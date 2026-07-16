import { create } from 'zustand';
import { Product } from '@/types';
import { AvatarState, WornItems, SavedAvatar, GenderType, BodyType, HeightType, HairStyleType } from '@/types/dressingRoom';

interface AvatarStore {
  avatar: AvatarState;
  wornItems: WornItems;
  savedAvatars: SavedAvatar[];
  undoStack: WornItems[];
  redoStack: WornItems[];
  zoomLevel: number;
  viewAngle: 'front' | 'back' | 'left' | 'right';
  activeChallengeId: string | null;
  points: number;
  unlockedBadges: string[];

  // Actions
  setAvatarProperty: <K extends keyof AvatarState>(key: K, value: AvatarState[K]) => void;
  tryOnItem: (product: Product) => void;
  takeOffItem: (layer: keyof WornItems) => void;
  undo: () => void;
  redo: () => void;
  resetOutfit: () => void;
  saveCurrentAvatar: (name: string) => void;
  loadSavedAvatar: (saved: SavedAvatar) => void;
  deleteSavedAvatar: (id: string) => void;
  setZoomLevel: (zoom: number) => void;
  setViewAngle: (angle: 'front' | 'back' | 'left' | 'right') => void;
  setActiveChallengeId: (id: string | null) => void;
  completeChallenge: (challengeId: string, badgeId: string, awardPoints: number) => void;
}

const defaultAvatar: AvatarState = {
  gender: 'female',
  bodyType: 'regular',
  height: 'average',
  skinTone: '#e0a96d', // Sand/Warm Beige
  hairStyle: 'long',
  hairColor: '#4a3728', // Dark Brown
  eyeColor: '#5c3818',
  browStyle: 'normal',
  mouthExpression: 'smile',
  pose: 'default',
  backgroundScene: 'studio',
};

// Helper helper to get property from mongoose specs map (since API can return Map or plain Object)
const getSpec = (product: Product, key: string): string => {
  if (!product.specifications) return '';
  
  // If specifications is a Map (MongoDB backend response might have a specifications.get method)
  if (typeof (product.specifications as any).get === 'function') {
    return (product.specifications as any).get(key) || '';
  }
  
  // If specifications is a plain object
  return (product.specifications as any)[key] || '';
};

export const useAvatarStore = create<AvatarStore>((set) => ({
  avatar: defaultAvatar,
  wornItems: {},
  savedAvatars: [],
  undoStack: [],
  redoStack: [],
  zoomLevel: 1.0,
  viewAngle: 'front',
  activeChallengeId: null,
  points: 100, // Starting points
  unlockedBadges: ['first_avatar'], // Starting badge

  setAvatarProperty: (key, value) => set((state) => {
    // Reset angle to front if gender changes
    const extraUpdates: Partial<AvatarStore> = {};
    if (key === 'gender') {
      extraUpdates.viewAngle = 'front';
      // Switch default hair if gender changes for better aesthetics
      extraUpdates.avatar = {
        ...state.avatar,
        [key]: value,
        hairStyle: value === 'male' ? 'short' as HairStyleType : 'long' as HairStyleType,
      };
    } else {
      extraUpdates.avatar = {
        ...state.avatar,
        [key]: value,
      };
    }
    return extraUpdates;
  }),

  tryOnItem: (product) => set((state) => {
    const rawLayer = getSpec(product, 'Layer');
    if (!rawLayer) return {};

    const layer = rawLayer.toLowerCase() as keyof WornItems;
    
    // Save state to undo stack
    const currentWornCopy = { ...state.wornItems };
    const newUndoStack = [...state.undoStack, currentWornCopy];
    
    const newWornItems = { ...state.wornItems };

    // Apply layering exclusions:
    if (layer === 'dress') {
      // Dresses occupy both Top and Pants
      delete newWornItems.top;
      delete newWornItems.pants;
      newWornItems.dress = product;
    } else if (layer === 'top') {
      // Wearing a top replaces dress
      delete newWornItems.dress;
      newWornItems.top = product;
    } else if (layer === 'pants') {
      // Wearing pants replaces dress
      delete newWornItems.dress;
      newWornItems.pants = product;
    } else {
      // Standard accessory layer
      newWornItems[layer] = product;
    }

    return {
      wornItems: newWornItems,
      undoStack: newUndoStack,
      redoStack: [], // Clear redo stack on new action
    };
  }),

  takeOffItem: (layer) => set((state) => {
    if (!state.wornItems[layer]) return {};

    // Save state to undo stack
    const currentWornCopy = { ...state.wornItems };
    const newUndoStack = [...state.undoStack, currentWornCopy];

    const newWornItems = { ...state.wornItems };
    delete newWornItems[layer];

    return {
      wornItems: newWornItems,
      undoStack: newUndoStack,
      redoStack: [],
    };
  }),

  undo: () => set((state) => {
    if (state.undoStack.length === 0) return {};

    const previousWornItems = state.undoStack[state.undoStack.length - 1];
    const newUndoStack = state.undoStack.slice(0, state.undoStack.length - 1);
    const newRedoStack = [...state.redoStack, { ...state.wornItems }];

    return {
      wornItems: previousWornItems,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    };
  }),

  redo: () => set((state) => {
    if (state.redoStack.length === 0) return {};

    const nextWornItems = state.redoStack[state.redoStack.length - 1];
    const newRedoStack = state.redoStack.slice(0, state.redoStack.length - 1);
    const newUndoStack = [...state.undoStack, { ...state.wornItems }];

    return {
      wornItems: nextWornItems,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    };
  }),

  resetOutfit: () => set((state) => {
    if (Object.keys(state.wornItems).length === 0) return {};

    const newUndoStack = [...state.undoStack, { ...state.wornItems }];
    return {
      wornItems: {},
      undoStack: newUndoStack,
      redoStack: [],
    };
  }),

  saveCurrentAvatar: (name) => set((state) => {
    const newSavedAvatar: SavedAvatar = {
      id: Math.random().toString(36).substring(2, 9),
      name: name || `Avatar #${state.savedAvatars.length + 1}`,
      avatar: { ...state.avatar },
      wornItems: { ...state.wornItems },
      createdAt: new Date().toISOString(),
    };

    const newBadges = [...state.unlockedBadges];
    if (state.savedAvatars.length === 0 && !newBadges.includes('avatar_collector')) {
      newBadges.push('avatar_collector');
    }

    return {
      savedAvatars: [...state.savedAvatars, newSavedAvatar],
      unlockedBadges: newBadges,
    };
  }),

  loadSavedAvatar: (saved) => set({
    avatar: { ...saved.avatar },
    wornItems: { ...saved.wornItems },
    undoStack: [],
    redoStack: [],
  }),

  deleteSavedAvatar: (id) => set((state) => ({
    savedAvatars: state.savedAvatars.filter((sa) => sa.id !== id),
  })),

  setZoomLevel: (zoom) => set({ zoomLevel: Math.max(0.6, Math.min(1.8, zoom)) }),
  
  setViewAngle: (angle) => set({ viewAngle: angle }),

  setActiveChallengeId: (id) => set({ activeChallengeId: id }),

  completeChallenge: (challengeId, badgeId, awardPoints) => set((state) => {
    const updatedBadges = [...state.unlockedBadges];
    if (badgeId && !updatedBadges.includes(badgeId)) {
      updatedBadges.push(badgeId);
    }
    return {
      points: state.points + awardPoints,
      unlockedBadges: updatedBadges,
    };
  }),
}));
