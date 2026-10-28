const Product = require('../models/Product');
const { discounted } = require('../utils/pricing');

const LIVE = { active: true, status: 'published', visibility: 'public', stock: { $gt: 0 } };

// Catalog categories that make up an outfit, grouped by the slot they fill.
// A dress fills the top and bottom slots on its own.
const SLOTS = {
  top: ['top', 'tops', 'shirt', 'shirts', 't-shirt', 'tee', 'blouse', 'sweater', 'hoodie', 'knitwear'],
  bottom: ['pants', 'trousers', 'jeans', 'chinos', 'skirt', 'skirts', 'shorts'],
  dress: ['dress', 'dresses', 'jumpsuit'],
  outerwear: ['jacket', 'jackets', 'coat', 'coats', 'blazer', 'outerwear'],
  shoes: ['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'footwear'],
  accessory: ['bag', 'bags', 'hat', 'hats', 'glasses', 'sunglasses', 'jewelry', 'accessory', 'accessories', 'watch', 'scarf', 'belt'],
};
const FASHION_CATEGORIES = Object.values(SLOTS).flat();
const SLOT_ORDER = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'];
const SLOT_LABELS = { top: 'a top', bottom: 'bottoms', dress: 'a dress', outerwear: 'a jacket or coat', shoes: 'shoes' };

// Words a shopper uses for a piece -> the slot it fills (plurals are matched too)
const ITEM_WORDS = {
  shirt: 'top', tee: 'top', 't-shirt': 'top', top: 'top', blouse: 'top', sweater: 'top', hoodie: 'top',
  pants: 'bottom', trouser: 'bottom', jeans: 'bottom', chino: 'bottom', skirt: 'bottom', shorts: 'bottom',
  dress: 'dress', jacket: 'outerwear', coat: 'outerwear', blazer: 'outerwear',
  shoe: 'shoes', sneaker: 'shoes', boot: 'shoes', sandal: 'shoes',
  bag: 'accessory', hat: 'accessory', cap: 'accessory', sunglasses: 'accessory', jewelry: 'accessory',
};
const COLOR_WORDS = ['black', 'white', 'blue', 'navy', 'red', 'green', 'olive', 'beige', 'brown', 'cream', 'camel', 'grey', 'gray', 'gold', 'pink'];

const OUTFIT_INTENT = /\b(outfits?|looks?|ensembles?|attire|clothes|wear|wearing|style me|head to toe)\b/;
const PAIRING_INTENT = /\b(match(?:es|ing)?|pair(?:s|ed|ing)?|goes with|go with|wear with|complements?)\b/;
// "dress me", "dress up", "how should I dress" use dress as a verb, not a product
const DRESS_VERB = /\bdress(?:ed|ing)?\s+(?:me|up|down)\b|\b(?:to|should i|do i|can i)\s+dress\b/g;

const SEASON_WORDS = {
  summer: /\b(summer\w*|hot|heat\w*|humid|tropical|beach\w*|resort|pool\w*|sunny)\b/,
  winter: /\b(winter\w*|cold|freezing|snow\w*|chilly|frosty|ski|skiing)\b/,
};
// Fabrics and pieces too warm for hot weather
const WARM = /\b(leather|lambskin|calfskin|suede|shearling|fur|wool|merino|cashmere|alpaca|mohair|fleece|felt(?:ed)?|tweed|melton|corduroy|velvet|puffer|quilted|knitwear|sweater|cardigan|turtleneck|cable knit|boots?|coat|parka|thermal|cozy|winter|autumn)\b/g;
// Pieces made only for hot weather
const SUMMER_ONLY = /\b(linen|flax|seersucker|sandals?|shorts|tank|swim\w*|sleeveless|bikini)\b/g;
// Light fabrics that suit hot weather (preference only)
const LIGHT = /\b(linen|flax|silk|cotton|breathable|lightweight|seersucker|chambray|canvas|mesh)\b/g;

// Occasion words in a request -> occasion / style tags on products
const OCCASIONS = [
  [/\b(office|work|business|meeting|interview|professional)\b/, ['office', 'professional', 'smart-casual', 'smart', 'formal', 'tailored']],
  [/\b(wedding|gala|formal)\b/, ['wedding', 'wedding-guest', 'formal', 'gala', 'evening', 'luxury']],
  [/\b(party|cocktail|evening|night out|date|club)\b/, ['party', 'cocktail', 'evening', 'night out', 'summer-party', 'gala']],
  [/\b(casual|everyday|weekend|relaxed|brunch)\b/, ['casual', 'everyday', 'streetwear', 'comfort']],
  [/\b(street|streetwear|urban|edgy)\b/, ['streetwear', 'edgy', 'utility']],
  [/\b(gym|sport|sporty|athletic|workout)\b/, ['athletic', 'comfort']],
  [/\b(luxury|luxe|elegant|chic)\b/, ['luxury', 'quiet-luxury', 'quiet luxury', 'chic', 'evening']],
  [/\b(minimal|minimalist)\b/, ['minimalist']],
  [/\b(vintage|retro)\b/, ['vintage', 'retro', 'heritage']],
  [/\b(autumn|fall)\b/, ['autumn', 'layering']],
];

// Number of distinct markers found, so a fabric named in both title and spec counts once
const count = (pattern, text) => new Set(text.match(pattern) || []).size;
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const spec = (product, key) => {
  const specs = product.specifications;
  if (!specs) return '';
  return String((typeof specs.get === 'function' ? specs.get(key) : specs[key]) || '');
};
const cents = (amount) => Math.round(amount * 100);
// The price the shopper actually pays, rounded like cart and order lines
const paidPrice = (product) => Number(Math.max(0, discounted(Number(product.price) || 0, product.discountPercentage)).toFixed(2));

const parseBudget = (query) => {
  const amount = String.raw`(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)`;
  const currency = String.raw`(?:\$|usd|৳|tk\.?|bdt|taka)?`;
  const patterns = [
    new RegExp(String.raw`(?:under|below|within|less than|up to|upto|no more than|max(?:imum)?|budget(?:\s+(?:of|is))?\s*:?)\s*${currency}\s*${amount}`),
    new RegExp(String.raw`(?:\$|৳|usd\s*)\s*${amount}`),
    new RegExp(String.raw`${amount}\s*(?:\$|usd|dollars?|bucks|৳|tk\b|bdt|taka|budget)`),
  ];
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) return Number(match[1].replace(/,/g, '')) || null;
  }
  return null;
};

const parseGender = (query) => {
  const female = /\b(women'?s?|woman|female|ladies|lady|her|she|girl'?s?|girlfriend|wife|mom|mother|sister)\b/.test(query);
  const male = /\b(men'?s?|man|male|guys?|gentlem[ae]n|him|he|his|boys?|boyfriend|husband|dad|father|brother)\b/.test(query);
  if (female === male) return null;
  return female ? 'female' : 'male';
};

const parseSeason = (query) => {
  const summer = SEASON_WORDS.summer.test(query);
  const winter = SEASON_WORDS.winter.test(query);
  if (summer === winter) return null;
  return summer ? 'summer' : 'winter';
};

const slotOf = (product) => {
  for (const value of [product.category, spec(product, 'Layer'), product.subcategory]) {
    const name = String(value || '').toLowerCase();
    const slot = SLOT_ORDER.find((key) => SLOTS[key].includes(name));
    if (slot) return slot;
  }
  return null;
};

const genderOf = (product) => {
  const gender = spec(product, 'Gender').toLowerCase();
  if (/^(male|men|man|mens)$/.test(gender)) return 'male';
  if (/^(female|women|woman|womens|ladies)$/.test(gender)) return 'female';
  return 'unisex';
};

// Season signals read from the merchandiser's tags first, then from fabric and piece names
const seasonProfile = (product) => {
  const tagText = [...(product.tags || []), spec(product, 'Occasion'), spec(product, 'StyleTags')].join(' ').toLowerCase();
  const text = [product.title, product.subcategory, spec(product, 'Material'), spec(product, 'Fabric'), tagText].join(' ').toLowerCase();
  return {
    taggedSummer: /\b(summer|beach|resort)/.test(tagText),
    taggedWinter: /\b(winter|autumn)\b/.test(tagText),
    warm: count(WARM, text),
    light: count(LIGHT, text),
    summerOnly: count(SUMMER_ONLY, text) > 0,
  };
};

const suitsSeason = (item, season) => {
  if (!season) return true;
  const { taggedSummer, taggedWinter, warm, summerOnly } = item.season;
  if (season === 'summer') {
    if (taggedSummer && !taggedWinter) return true;
    if (taggedWinter || warm) return false;
    // Heavy layers are not needed in the heat; only summer-weight jackets qualify
    return item.slot !== 'outerwear' || summerOnly;
  }
  if (taggedWinter && !taggedSummer) return true;
  return !taggedSummer && !summerOnly;
};

// How well a piece suits what was asked for (season, occasion, colour); 0 when none of it matches
const requestFit = (item, { season, occasionTags, color }) => {
  const { product } = item;
  let fit = 0;
  if (season === 'summer') fit += Math.min(20, 7 * (item.season.light + (item.season.taggedSummer ? 1 : 0)));
  if (season === 'winter') fit += Math.min(20, 7 * (item.season.warm + (item.season.taggedWinter ? 1 : 0)));
  if (occasionTags.length) {
    const tags = [...(product.tags || []), ...spec(product, 'Occasion').split(','), ...spec(product, 'StyleTags').split(',')]
      .map((tag) => tag.trim().toLowerCase());
    fit += Math.min(20, 10 * occasionTags.filter((tag) => tags.includes(tag)).length);
  }
  if (color && item.colorText.includes(color)) fit += 12;
  return fit;
};

// Core pieces weigh far more than extras (a coat is core in winter); how well a piece fits the brief scales its weight
const slotWeight = (slot, season) => ({
  top: 100, bottom: 100, dress: 200, shoes: 45, outerwear: season === 'winter' ? 100 : 10, accessory: 6,
}[slot]);
const isOptional = (slot, season) => slot === 'accessory' || (slot === 'outerwear' && season !== 'winter');

// Best-scoring pieces plus the cheapest few, so tight budgets can still be met
const shortlist = (items) => {
  const best = [...items].sort((a, b) => b.score - a.score).slice(0, 6);
  const cheapest = [...items].sort((a, b) => a.paid - b.paid).slice(0, 3);
  return [...new Set([...best, ...cheapest])];
};

// Pick one piece per slot so that the whole outfit (not each piece) stays within budget
const buildOutfit = (pool, { budget, season, anchor, owned, picky }) => {
  const budgetCents = budget ? cents(budget) : Infinity;
  const options = (slot) => {
    if (owned.has(slot)) return [null];
    const anchored = anchor && anchor.slot === slot;
    const fits = pool.filter((item) => item.slot === slot && item.paidCents <= budgetCents
      && (!anchored || anchor.matches(item))
      // Extras are only worth adding when they suit the brief
      && (anchored || !picky || !isOptional(slot, season) || item.fit > 0));
    return [null, ...shortlist(fits)];
  };
  const value = (item) => (item
    ? slotWeight(item.slot, season) * (1 + item.score / 50) + (anchor && anchor.slot === item.slot ? 60 : 0)
    : 0);

  const dresses = owned.has('dress') || owned.has('top') || owned.has('bottom') || (anchor && ['top', 'bottom'].includes(anchor.slot))
    ? []
    : options('dress').filter(Boolean);
  const bases = dresses.map((dress) => [dress]);
  // A requested dress replaces separates, unless no dress fits
  if (!owned.has('dress') && !(anchor && anchor.slot === 'dress' && dresses.length)) {
    for (const top of options('top')) for (const bottom of options('bottom')) bases.push([top, bottom]);
  }
  const outerwear = options('outerwear');
  const shoes = options('shoes');
  const accessories = options('accessory');

  let best = null;
  for (const base of bases) {
    const baseCents = base.reduce((sum, item) => sum + (item ? item.paidCents : 0), 0);
    if (baseCents > budgetCents) continue;
    const baseValue = base.reduce((sum, item) => sum + value(item), 0);
    for (const layer of outerwear) {
      const layerCents = baseCents + (layer ? layer.paidCents : 0);
      if (layerCents > budgetCents) continue;
      for (const shoe of shoes) {
        const shoeCents = layerCents + (shoe ? shoe.paidCents : 0);
        if (shoeCents > budgetCents) continue;
        for (const accessory of accessories) {
          const totalCents = shoeCents + (accessory ? accessory.paidCents : 0);
          if (totalCents > budgetCents) continue;
          // Ties go to the cheaper outfit
          const score = baseValue + value(layer) + value(shoe) + value(accessory) - totalCents / 1e7;
          if (!best || score > best.score) best = { score, totalCents, items: [...base, layer, shoe, accessory].filter(Boolean) };
        }
      }
    }
  }
  if (!best || !best.items.length) return null;
  best.items.sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
  return best;
};

// Core pieces the outfit is missing, split by "exists but over budget" and "none in stock"
const missingPieces = (outfit, pool, { budget, season, owned }) => {
  const covered = new Set(outfit.items.map((item) => item.slot));
  const needed = [];
  if (!covered.has('dress') && !owned.has('dress')) {
    if (!covered.has('top') && !owned.has('top')) needed.push('top');
    if (!covered.has('bottom') && !owned.has('bottom')) needed.push('bottom');
  }
  if (!covered.has('shoes') && !owned.has('shoes')) needed.push('shoes');
  if (season === 'winter' && !covered.has('outerwear') && !owned.has('outerwear')) needed.push('outerwear');
  const inStock = (slot) => pool.some((item) => item.slot === slot || (['top', 'bottom'].includes(slot) && item.slot === 'dress'));
  return {
    overBudget: budget ? needed.filter(inStock) : [],
    unavailable: needed.filter((slot) => !budget || !inStock(slot)),
  };
};

const listPhrase = (words) => (words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}` : words[0] || '');

const advise = async (message) => {
  const query = message.toLowerCase();
  const statedBudget = parseBudget(query);
  const inTaka = /(?:taka|bdt|৳|\btk\b)/i.test(query);
  const exchangeRate = require('./paymentSettings').bdtPerUsd();
  const budget = statedBudget && inTaka ? statedBudget / exchangeRate : statedBudget;
  const money = (usd) => `$${usd.toFixed(2)}${inTaka ? ` / ${Math.round(usd * exchangeRate).toLocaleString('en-US')} taka` : ''}`;
  const budgetLabel = statedBudget ? (inTaka ? `${statedBudget.toLocaleString('en-US')} taka` : `$${statedBudget}`) : '';

  const itemQuery = query.replace(DRESS_VERB, ' ');
  const itemWord = Object.keys(ITEM_WORDS).find((word) => new RegExp(`\\b${escape(word)}(?:e?s)?\\b`).test(itemQuery));
  const color = COLOR_WORDS.find((word) => new RegExp(`\\b${word}\\b`).test(query));
  const season = parseSeason(query);
  const gender = parseGender(query);
  const occasionMatches = OCCASIONS.filter(([pattern]) => pattern.test(query));
  const occasionTags = [...new Set(occasionMatches.flatMap(([, tags]) => tags))];
  const occasionWord = occasionMatches.length ? query.match(occasionMatches[0][0])[1] : '';
  const pairing = Boolean(itemWord) && PAIRING_INTENT.test(query);
  const outfitMode = pairing || OUTFIT_INTENT.test(query) || (!itemWord && !color);

  const docs = await Product.find({
    ...LIVE,
    $or: [{ category: { $in: FASHION_CATEGORIES } }, { 'specifications.Layer': { $in: FASHION_CATEGORIES } }],
  }).sort({ featured: -1, rating: -1 }).limit(500);

  const wordPattern = itemWord ? new RegExp(`\\b${escape(itemWord)}`, 'i') : null;
  const matchesWord = (item) => [item.product.category, item.product.subcategory, item.product.title, spec(item.product, 'Layer')]
    .some((value) => wordPattern.test(String(value || '')));
  const items = docs.map((doc) => {
    const product = doc.toJSON();
    const paid = paidPrice(product);
    const item = {
      product, paid, paidCents: cents(paid), slot: slotOf(product), gender: genderOf(product),
      season: seasonProfile(product),
      colorText: [product.title, ...(product.tags || []), spec(product, 'Color')].join(' ').toLowerCase(),
    };
    item.fit = requestFit(item, { season, occasionTags, color });
    item.score = item.fit + (product.featured ? 2 : 0) + (Number(product.rating) || 0);
    return item;
  }).filter((item) => item.slot && suitsSeason(item, season) && (!gender || item.gender === gender || item.gender === 'unisex'));

  if (!items.length) {
    return { text: 'There are no available products to recommend right now. Please check back after the catalog is updated.', products: [] };
  }

  if (!outfitMode) {
    // A product search: the budget is a per-piece price limit here
    const affordable = [...items].sort((a, b) => b.score - a.score).filter((item) => !budget || item.paidCents <= cents(budget));
    let picks = affordable.filter((item) => (!itemWord || matchesWord(item)) && (!color || item.colorText.includes(color))).slice(0, 4);
    const matchedRequest = picks.length > 0;
    if (!picks.length) picks = affordable.slice(0, 4);
    if (!picks.length) {
      return { text: `Nothing in stock is priced within your ${budgetLabel} budget right now.`, products: [] };
    }
    const text = `${matchedRequest ? 'Here are' : 'I could not find an exact match. Here are'} ${picks.length} available ${season ? `${season} ` : ''}pieces from our current catalog${budget ? `, each within your ${budgetLabel} budget` : ''}: ${picks.map((item) => `${item.product.title} (${money(item.paid)})`).join(', ')}. Select a product to check sizes, stock and details.`;
    return { text, products: picks.map((item) => item.product) };
  }

  const owned = new Set(pairing ? [ITEM_WORDS[itemWord]] : []);
  const anchor = itemWord && !pairing ? { slot: ITEM_WORDS[itemWord], matches: matchesWord } : null;
  const genders = gender ? [gender] : ['female', 'male'];
  let best = null;
  for (const option of genders) {
    const pool = items.filter((item) => item.gender === option || item.gender === 'unisex');
    const outfit = buildOutfit(pool, { budget, season, anchor, owned, picky: Boolean(season || occasionTags.length || color) });
    if (outfit && (!best || outfit.score > best.outfit.score)) best = { outfit, pool, gender: option };
  }

  if (!best) {
    const cheapest = [...items].sort((a, b) => a.paid - b.paid)[0];
    return {
      text: `Nothing in stock fits ${budget ? `a ${budgetLabel} budget` : 'your request'} for ${season ? `a ${season} ` : 'an '}outfit. The most affordable suitable piece is the ${cheapest.product.title} at ${money(cheapest.paid)}.`,
      products: [],
    };
  }

  const { outfit, pool } = best;
  const total = outfit.totalCents / 100;
  const genderLabel = outfit.items.some((item) => item.gender !== 'unisex') ? `${best.gender === 'female' ? "women's" : "men's"} ` : '';
  const look = `${genderLabel}${season ? `${season} ` : ''}${occasionWord ? `${occasionWord} ` : ''}look`;
  const pieces = outfit.items.map((item) => `${item.product.title} (${money(item.paid)})`).join(', ');
  const { overBudget, unavailable } = missingPieces(outfit, pool, { budget, season, owned });
  const parts = [];
  if (overBudget.length) {
    parts.push(`A complete ${look} doesn't fit in your ${budgetLabel} budget, so here is the closest outfit I could put together for ${money(total)}: ${pieces}.`);
    parts.push(`Adding ${listPhrase(overBudget.map((slot) => SLOT_LABELS[slot]))} would take it over budget.`);
  } else {
    parts.push(`Here is a ${look}${pairing ? ` to go with your ${itemWord}` : ''} for ${money(total)} in total${budget ? `, within your ${budgetLabel} budget` : ''}: ${pieces}.`);
  }
  if (unavailable.length) {
    const pronoun = unavailable.length > 1 || ['shoes', 'bottom'].includes(unavailable[0]) ? 'them' : 'it';
    parts.push(`I don't have ${season ? `${season}-appropriate ` : ''}${listPhrase(unavailable.map((slot) => SLOT_LABELS[slot]))} in stock right now, so I left ${pronoun} out.`);
  }
  if (season === 'summer' && !outfit.items.some((item) => item.slot === 'outerwear') && !owned.has('outerwear')) {
    parts.push('No jacket needed in the heat.');
  }
  return { text: parts.join(' '), products: outfit.items.map((item) => item.product) };
};

module.exports = { advise };
