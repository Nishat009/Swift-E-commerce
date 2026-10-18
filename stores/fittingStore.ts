import { create } from 'zustand';
import { Product } from '@/types';
import type { Gender } from '@/components/dressing-room/tryon/body';
import type { GarmentKind } from '@/components/dressing-room/tryon/garment';
import type { WornGarment } from '@/components/dressing-room/FittingRoom3D';

export interface FittingItem extends WornGarment {
  productId?: string;
  price?: number;
}

// What each kind takes off when it goes on.
const REPLACES: Record<GarmentKind, GarmentKind[]> = {
  dress: ['dress', 'top', 'pants', 'skirt'],
  top: ['top', 'dress'],
  pants: ['pants', 'skirt', 'dress'],
  skirt: ['pants', 'skirt', 'dress'],
  outer: ['outer'],
};

interface FittingStore {
  gender: Gender;
  worn: FittingItem[];
  setGender: (gender: Gender) => void;
  /** Puts the item on (taking off whatever it replaces), or takes it off if already worn. */
  toggle: (item: FittingItem) => void;
  wear: (item: FittingItem) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export const useFittingStore = create<FittingStore>((set) => ({
  gender: 'female',
  worn: [],
  setGender: (gender) => set({ gender }),
  wear: (item) => set((state) => ({
    worn: [...state.worn.filter((w) => w.key !== item.key && !REPLACES[item.kind].includes(w.kind)), item],
  })),
  toggle: (item) => set((state) => (
    state.worn.some((w) => w.key === item.key)
      ? { worn: state.worn.filter((w) => w.key !== item.key) }
      : { worn: [...state.worn.filter((w) => !REPLACES[item.kind].includes(w.kind)), item] }
  )),
  remove: (key) => set((state) => ({ worn: state.worn.filter((w) => w.key !== key) })),
  clear: () => set({ worn: [] }),
}));

/** Which kind of garment a catalog product is, or null if it can't be worn on the mannequin. */
export function garmentKind(product: Product): GarmentKind | null {
  const specs = product.specifications as any;
  const layer = String((typeof specs?.get === 'function' ? specs.get('Layer') : specs?.Layer) || '').toLowerCase();
  const category = `${layer} ${product.category || ''}`.toLowerCase();
  const text = `${category} ${product.title || ''}`.toLowerCase();
  const pick = (s: string): GarmentKind | null => {
    if (/skirt/.test(s)) return 'skirt';
    if (/dress|gown|jumpsuit/.test(s)) return 'dress';
    if (/jacket|coat|blazer|outer|parka|cardigan|hoodie|trench/.test(s)) return 'outer';
    if (/pant|trouser|jean|chino|\bshorts\b|legging|bottom/.test(s)) return 'pants';
    if (/\btop|shirt|blouse|tee|sweater|knit|polo|tank|cami|jumper|pullover/.test(s)) return 'top';
    return null;
  };
  if (/shoe|bag|jewel|watch|glass|hat|sunglass|accessor|beauty|fragrance/.test(category)) return null;
  return pick(category) ?? pick(text);
}

/** The photo to wear: the plain packshot / flat-lay, never the on-model shot. */
export function garmentImageOf(product: Product) {
  return product.productImage || product.thumbnail || product.images?.[0] || '';
}

export function fittingItemFor(product: Product): FittingItem | null {
  const kind = garmentKind(product);
  const image = garmentImageOf(product);
  if (!kind || !image) return null;
  return { key: `product-${product.id}`, image, kind, title: product.title, productId: String(product.id), price: product.price };
}
