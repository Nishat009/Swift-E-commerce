import { Product } from '@/types';

export const specOf = (p: Product, key: string): string => {
  const specs: any = p.specifications;
  if (!specs) return '';
  if (typeof specs.get === 'function') return String(specs.get(key) || '');
  return String(specs[key] || '');
};

export const layerOf = (p: Product): string =>
  (specOf(p, 'Layer') || p.category || '').toLowerCase();

const haystack = (p: Product): string =>
  [
    specOf(p, 'Occasion'),
    specOf(p, 'StyleTags'),
    specOf(p, 'Style'),
    (p.tags || []).join(' '),
    p.title,
    p.category,
  ]
    .join(' ')
    .toLowerCase();

export const matchesKeywords = (p: Product, keywords: string[]): boolean => {
  const h = haystack(p);
  return keywords.some((k) => h.includes(k.toLowerCase()));
};

/**
 * Builds a small outfit from the live catalog: one item per requested layer
 * (top, pants, jacket, dress, shoes...), preferring items whose Occasion /
 * StyleTags / tags match the keywords, otherwise any item of that layer.
 */
export const pickOutfit = (
  products: Product[],
  keywords: string[],
  layers: string[]
): Product[] => {
  const result: Product[] = [];
  for (const layer of layers) {
    const ofLayer = products.filter((p) => layerOf(p) === layer);
    const pick = ofLayer.find((p) => matchesKeywords(p, keywords)) || ofLayer[0];
    if (pick && !result.some((r) => String(r.id) === String(pick.id))) result.push(pick);
  }
  return result;
};
