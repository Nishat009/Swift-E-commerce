import type { Product } from '@/types';
import type { DemoDressSelection, WornItems } from '@/types/dressingRoom';
import type { Fabric, GarmentSpec, Silhouette } from './profile';
import type { Outfit, PantsSpec, ShoeSpec } from './build';
import { DEMO_DRESSES } from './demoDresses';

const spec = (p: Product, key: string): string => {
  const s = p.specifications as any;
  if (!s) return '';
  return (typeof s.get === 'function' ? s.get(key) : s[key]) || '';
};

const colorOf = (p: Product, fallback = '#8a8178') => {
  const c = String(spec(p, 'Color') || spec(p, 'SvgColor'));
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c) ? c : fallback;
};

const has = (text: string, ...words: string[]) => words.some((w) => text.includes(w));

function fabricOf(p: Product): Fabric {
  const t = `${spec(p, 'Fabric')} ${spec(p, 'Material')} ${p.title}`.toLowerCase();
  if (has(t, 'sequin')) return 'sequin';
  if (has(t, 'velvet')) return 'velvet';
  if (has(t, 'satin', 'charmeuse')) return 'satin';
  if (has(t, 'chiffon')) return 'chiffon';
  if (has(t, 'silk')) return 'silk';
  if (has(t, 'linen', 'flax')) return 'linen';
  if (has(t, 'denim', 'jean')) return 'denim';
  if (has(t, 'leather')) return 'leather';
  if (has(t, 'knit', 'rib', 'cashmere', 'sweater', 'jersey')) return 'knit';
  if (has(t, 'wool', 'felt', 'tweed')) return 'wool';
  return 'cotton';
}

function dressFromProduct(p: Product): GarmentSpec {
  const t = p.title.toLowerCase();
  const silhouette: Silhouette = has(t, 'bodycon') ? 'bodycon'
    : has(t, 'gown') ? 'mermaid'
    : has(t, 'maxi') ? 'maxi'
    : has(t, 'slip') ? 'slip'
    : has(t, 'cocktail', 'mini') ? 'skater'
    : 'a-line';
  const strappy = has(t, 'slip', 'cowl', 'gown', 'corset');
  return {
    silhouette,
    neckline: has(t, 'corset') ? 'sweetheart' : strappy ? 'v-neck' : silhouette === 'bodycon' ? 'square' : 'round',
    sleeves: strappy ? 'straps' : silhouette === 'maxi' ? 'puff' : silhouette === 'bodycon' ? 'none' : 'cap',
    fabric: fabricOf(p),
    pattern: has(t, 'floral') ? 'floral' : has(t, 'stripe') ? 'stripes' : 'solid',
    color: colorOf(p),
    accent: '#f2b5c4',
  };
}

function topFromProduct(p: Product): GarmentSpec {
  const t = p.title.toLowerCase();
  return {
    silhouette: has(t, 'crop') ? 'crop' : 'top',
    neckline: has(t, 'shirt') ? 'v-neck' : 'round',
    sleeves: has(t, 'tank') ? 'none' : has(t, 'camp', 'tee', 't-shirt') ? 'short' : 'long',
    fabric: fabricOf(p),
    pattern: has(t, 'stripe') ? 'stripes' : 'solid',
    color: colorOf(p, '#e7e2da'),
    accent: '#f8f6f2',
  };
}

function jacketFromProduct(p: Product): GarmentSpec {
  const t = p.title.toLowerCase();
  return {
    silhouette: has(t, 'trench', 'coat') ? 'coat' : 'jacket',
    neckline: 'v-neck',
    sleeves: 'long',
    fabric: fabricOf(p),
    pattern: 'solid',
    color: colorOf(p, '#5b4636'),
  };
}

function pantsFromProduct(p: Product): PantsSpec {
  const t = p.title.toLowerCase();
  return {
    color: colorOf(p, '#3c3c3c'),
    fabric: fabricOf(p),
    fit: has(t, 'wide') ? 'wide' : has(t, 'cargo', 'relaxed') ? 'relaxed' : has(t, 'chino', 'slim', 'skinny') ? 'slim' : 'straight',
  };
}

function shoesFromProduct(p: Product): ShoeSpec {
  const t = p.title.toLowerCase();
  return {
    color: colorOf(p, '#1c1c1c'),
    kind: has(t, 'boot') ? 'boot' : has(t, 'sneaker', 'trainer') ? 'sneaker' : has(t, 'heel', 'stiletto', 'sandal', 'pump') ? 'heel' : 'flat',
  };
}

/** Outfit for the 3D model: a demo dress replaces any catalog dress, top or trousers. */
export function outfitFromState(worn: WornItems, demo: DemoDressSelection | null): Outfit {
  const outfit: Outfit = {};
  const demoDress = demo ? DEMO_DRESSES.find((d) => d.id === demo.id) : undefined;
  if (demoDress) {
    outfit.dress = { ...demoDress, color: demo!.color };
  } else {
    if (worn.dress) outfit.dress = dressFromProduct(worn.dress);
    if (worn.top) outfit.top = topFromProduct(worn.top);
    if (worn.pants) outfit.pants = pantsFromProduct(worn.pants);
  }
  if (worn.jacket) outfit.jacket = jacketFromProduct(worn.jacket);
  if (worn.shoes) outfit.shoes = shoesFromProduct(worn.shoes);
  if (worn.hat) outfit.hat = colorOf(worn.hat, '#3b2f2a');
  if (worn.glasses) outfit.glasses = colorOf(worn.glasses, '#2b2522');
  if (worn.jewelry) outfit.jewelry = colorOf(worn.jewelry, '#d4af37');
  if (worn.bag) outfit.bag = colorOf(worn.bag, '#7a4b2a');
  return outfit;
}

/** Short caption of what the model is wearing. */
export function describeLook(worn: WornItems, demo: DemoDressSelection | null): string {
  const demoDress = demo ? DEMO_DRESSES.find((d) => d.id === demo.id) : undefined;
  const items = Object.entries(worn)
    .filter(([layer, item]) => item && !(demoDress && ['dress', 'top', 'pants'].includes(layer)))
    .map(([, item]) => (item as Product).title);
  return [demoDress?.name, ...items].filter(Boolean).join(' + ') || 'Bare mannequin — pick a dress to try it on';
}
