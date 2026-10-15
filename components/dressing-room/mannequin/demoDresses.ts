import type { Fabric, GarmentSpec, Silhouette } from './profile';

export type DemoOccasion = 'casual' | 'party' | 'evening' | 'traditional';

/** Showroom-only looks used to demo the 3D model; they are not catalog products. */
export interface DemoDress extends GarmentSpec {
  id: string;
  name: string;
  description: string;
  occasion: DemoOccasion;
  colors: string[]; // first entry is the default colour
}

export const DEMO_DRESSES: DemoDress[] = [
  {
    id: 'rose-garden-midi',
    name: 'Rose Garden Midi',
    description: 'Sweetheart bodice, puff sleeves and a soft A-line skirt in a rose print.',
    occasion: 'casual',
    silhouette: 'a-line', neckline: 'sweetheart', sleeves: 'puff', fabric: 'cotton', pattern: 'floral',
    color: '#f4c2c2', accent: '#c2185b',
    colors: ['#f4c2c2', '#fdf6e3', '#bfd8f0', '#2f3e46'],
  },
  {
    id: 'midnight-satin-gown',
    name: 'Midnight Satin Ball Gown',
    description: 'Strapless liquid-satin gown with a full floor-length skirt and a gold belt.',
    occasion: 'evening',
    silhouette: 'ballgown', neckline: 'strapless', sleeves: 'none', fabric: 'satin', pattern: 'solid',
    color: '#1b2a4a', belt: '#c9a96b',
    colors: ['#1b2a4a', '#7b1e3a', '#0f5132', '#e8d8c3'],
  },
  {
    id: 'emerald-velvet-mermaid',
    name: 'Emerald Velvet Mermaid',
    description: 'V-neck velvet gown fitted to the knee, then flaring into a sweeping hem.',
    occasion: 'evening',
    silhouette: 'mermaid', neckline: 'v-neck', sleeves: 'straps', fabric: 'velvet', pattern: 'solid',
    color: '#0b5d3b',
    colors: ['#0b5d3b', '#5b1a32', '#111111', '#3a3f8f'],
  },
  {
    id: 'scarlet-halter-bodycon',
    name: 'Scarlet Halter Bodycon',
    description: 'Sculpting rib-knit halter dress with a pencil hem just below the knee.',
    occasion: 'party',
    silhouette: 'bodycon', neckline: 'halter', sleeves: 'none', fabric: 'knit', pattern: 'solid',
    color: '#c1121f',
    colors: ['#c1121f', '#111111', '#f5f0e8', '#e07a5f'],
  },
  {
    id: 'sunny-polka-skater',
    name: 'Sunny Polka Skater',
    description: 'Playful polka-dot skater dress with short sleeves and a contrast belt.',
    occasion: 'casual',
    silhouette: 'skater', neckline: 'round', sleeves: 'short', fabric: 'cotton', pattern: 'polka',
    color: '#f6c945', accent: '#ffffff', belt: '#1d3557',
    colors: ['#f6c945', '#1d3557', '#e63946', '#2a9d8f'],
  },
  {
    id: 'royal-anarkali',
    name: 'Royal Paisley Anarkali',
    description: 'Empire-waist anarkali with long sleeves, gold paisley, zari hem and churidar.',
    occasion: 'traditional',
    silhouette: 'anarkali', neckline: 'round', sleeves: 'long', fabric: 'silk', pattern: 'paisley',
    color: '#7a1027', accent: '#d4a017', trim: '#d4a017', leggings: '#f3e5c0',
    colors: ['#7a1027', '#0b3d5c', '#1f5f3a', '#4a148c'],
  },
  {
    id: 'lavender-boho-maxi',
    name: 'Lavender Boho Maxi',
    description: 'Flowing chiffon maxi with a deep V and billowy bishop sleeves.',
    occasion: 'casual',
    silhouette: 'maxi', neckline: 'v-neck', sleeves: 'bishop', fabric: 'chiffon', pattern: 'leaf',
    color: '#d9c8f0', accent: '#7e57c2',
    colors: ['#d9c8f0', '#f7e1d7', '#cfe3d4', '#f2d0a9'],
  },
  {
    id: 'gingham-sundress',
    name: 'Gingham Picnic Sundress',
    description: 'Square-neck gingham sundress with skinny straps and a breezy A-line skirt.',
    occasion: 'casual',
    silhouette: 'a-line', neckline: 'square', sleeves: 'straps', fabric: 'cotton', pattern: 'gingham',
    color: '#5b8fd8', accent: '#ffffff',
    colors: ['#5b8fd8', '#e5484d', '#3f9d5b', '#222222'],
  },
  {
    id: 'little-black-dress',
    name: 'Classic Little Black Dress',
    description: 'Boat-neck silk crepe dress with cap sleeves and a knee-length A-line skirt.',
    occasion: 'party',
    silhouette: 'a-line', neckline: 'boat', sleeves: 'cap', fabric: 'silk', pattern: 'solid',
    color: '#121212',
    colors: ['#121212', '#3b2f2f', '#1c2541', '#5e503f'],
  },
  {
    id: 'champagne-sequin-cocktail',
    name: 'Champagne Sequin Cocktail',
    description: 'Fully sequinned sweetheart mini with a flippy skater skirt.',
    occasion: 'party',
    silhouette: 'skater', neckline: 'sweetheart', sleeves: 'straps', fabric: 'sequin', pattern: 'solid',
    color: '#d8b98a',
    colors: ['#d8b98a', '#c0c0c0', '#b76e79', '#1a1a1a'],
  },
  {
    id: 'ivory-satin-slip',
    name: 'Ivory Satin Slip',
    description: 'Bias-cut satin slip dress with a V neckline and fine straps.',
    occasion: 'evening',
    silhouette: 'slip', neckline: 'v-neck', sleeves: 'straps', fabric: 'satin', pattern: 'solid',
    color: '#efe6d8',
    colors: ['#efe6d8', '#b5838d', '#6d6875', '#2b2d42'],
  },
  {
    id: 'sage-striped-linen',
    name: 'Sage Striped Linen Dress',
    description: 'Elbow-sleeve striped linen day dress with a round neck and tie belt.',
    occasion: 'casual',
    silhouette: 'a-line', neckline: 'round', sleeves: 'elbow', fabric: 'linen', pattern: 'stripes',
    color: '#9caf88', accent: '#f5f1e8', belt: '#9caf88',
    colors: ['#9caf88', '#c9b79c', '#8fb3c9', '#d98e73'],
  },
];

export const DEMO_OCCASIONS: { id: 'all' | DemoOccasion; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'casual', label: 'Casual' },
  { id: 'party', label: 'Party' },
  { id: 'evening', label: 'Evening' },
  { id: 'traditional', label: 'Traditional' },
];

export const SILHOUETTE_LABEL: Record<Silhouette, string> = {
  'a-line': 'A-line', skater: 'Skater', ballgown: 'Ball gown', maxi: 'Maxi', slip: 'Slip',
  bodycon: 'Bodycon', mermaid: 'Mermaid', anarkali: 'Anarkali',
  top: 'Top', crop: 'Crop top', jacket: 'Jacket', coat: 'Coat',
};

export const FABRIC_LABEL: Record<Fabric, string> = {
  cotton: 'Cotton', linen: 'Linen', satin: 'Satin', silk: 'Silk', velvet: 'Velvet', chiffon: 'Chiffon',
  sequin: 'Sequin', knit: 'Knit', denim: 'Denim', wool: 'Wool', leather: 'Leather',
};
