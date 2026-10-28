// Derives the storefront filter fields (specifications.Sizes / specifications.ColorName)
// from a product's category, title and hex colour. Shared by seed.js and
// add_filter_metadata.js so fresh and existing databases get the same values.

const APPAREL_SIZES = 'XS, S, M, L, XL';
const SHOE_SIZES = '38, 39, 40, 41, 42, 43, 44';
const APPAREL = ['top', 'pants', 'dress', 'jacket'];
const ONE_SIZE = ['bag', 'hat', 'glasses', 'jewelry'];

const sizesFor = (category) => {
  const c = String(category || '').toLowerCase();
  if (APPAREL.includes(c)) return APPAREL_SIZES;
  if (c === 'shoes') return SHOE_SIZES;
  if (ONE_SIZE.includes(c)) return 'One Size';
  return null; // bags, jewelry, glasses, ... have no size options
};

// Colour words in a title win over the swatch hex (a "denim" jacket is Blue even if its hex is dark)
const TITLE_COLOURS = [
  [/\b(denim|indigo|navy|blue)\b/i, 'Blue'],
  [/\b(emerald|olive|green)\b/i, 'Green'],
  [/\b(noir|black|charcoal)\b/i, 'Black'],
  [/\b(white|ivory)\b/i, 'White'],
  [/\b(cream|oat)\b/i, 'Cream'],
  [/\b(beige|camel|sand)\b/i, 'Beige'],
  [/\b(grey|gray)\b/i, 'Grey'],
  [/\b(brown|walnut|cognac)\b/i, 'Brown'],
  [/\b(gold|brass)\b/i, 'Gold'],
  [/\b(pink|rose|blush)\b/i, 'Pink'],
  [/\b(red|burgundy)\b/i, 'Red'],
];

const hexToHsl = (hex) => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let hue;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  return { h: (hue * 60 + 360) % 360, s, l };
};

const colourFromHex = (hex) => {
  const hsl = hexToHsl(hex);
  if (!hsl) return null;
  const { h, s, l } = hsl;
  if (l < 0.18) return 'Black';
  if (l > 0.95) return 'White';
  if (s < 0.08) return l > 0.85 ? 'White' : 'Grey';
  // Warm, muted tones: cream -> beige -> brown by lightness
  if (h >= 15 && h < 50 && s < 0.6) {
    if (l > 0.8) return 'Cream';
    if (l > 0.45) return 'Beige';
    return 'Brown';
  }
  if (h >= 40 && h < 65) return 'Gold';
  if (h >= 10 && h < 40) return 'Orange';
  if (h >= 65 && h < 170) return 'Green';
  if (h >= 170 && h < 260) return 'Blue';
  if (h >= 260 && h < 320) return 'Purple';
  return l > 0.65 ? 'Pink' : 'Red';
};

const colourFor = (title, hex) => {
  for (const [pattern, name] of TITLE_COLOURS) {
    if (pattern.test(String(title || ''))) return name;
  }
  return colourFromHex(hex);
};

// Returns the filter fields to merge into a product's specifications (only the ones we can derive)
const deriveFilterSpecs = ({ title, category, specifications }) => {
  const specs = specifications instanceof Map ? Object.fromEntries(specifications) : (specifications || {});
  const derived = {};
  const sizes = sizesFor(category);
  if (sizes) derived.Sizes = sizes;
  const colour = colourFor(title, specs.Color || specs.SvgColor);
  if (colour) derived.ColorName = colour;
  return derived;
};

module.exports = { deriveFilterSpecs, colourFromHex, sizesFor };
