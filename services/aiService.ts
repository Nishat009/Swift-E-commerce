import { Product, ProductReview } from '@/types';
import {
  StylistMessage,
  SemanticSearchResult,
  CompleteOutfit,
  UserPersonalizationProfile,
  ReviewSentimentAnalysis,
} from '@/types/ai';

// Outfit rules for the stylist; kept in step with backend/src/services/stylistService.js,
// which answers the live chat assistant.
type OutfitSlot = 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessory';
type Season = 'summer' | 'winter';
type PieceGender = 'male' | 'female' | 'unisex';

interface StylistPiece {
  product: Product;
  slot: OutfitSlot;
  gender: PieceGender;
  paidCents: number;
  fit: number;
  score: number;
}

interface StylistOutfit {
  items: StylistPiece[];
  totalCents: number;
  score: number;
}

const OUTFIT_SLOTS: Record<OutfitSlot, string[]> = {
  top: ['top', 'tops', 'shirt', 'shirts', 't-shirt', 'tee', 'blouse', 'sweater', 'hoodie', 'knitwear'],
  bottom: ['pants', 'trousers', 'jeans', 'chinos', 'skirt', 'skirts', 'shorts'],
  dress: ['dress', 'dresses', 'jumpsuit'],
  outerwear: ['jacket', 'jackets', 'coat', 'coats', 'blazer', 'outerwear'],
  shoes: ['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'footwear'],
  accessory: ['bag', 'bags', 'hat', 'hats', 'glasses', 'sunglasses', 'jewelry', 'accessory', 'accessories', 'watch', 'scarf', 'belt'],
};
const SLOT_ORDER = Object.keys(OUTFIT_SLOTS) as OutfitSlot[];
const SLOT_LABELS: Partial<Record<OutfitSlot, string>> = { top: 'a top', bottom: 'bottoms', outerwear: 'a jacket or coat', shoes: 'shoes' };
// Fabrics and pieces too warm for hot weather
const WARM_MARKERS = /\b(leather|lambskin|calfskin|suede|shearling|fur|wool|merino|cashmere|alpaca|mohair|fleece|felt(?:ed)?|tweed|melton|corduroy|velvet|puffer|quilted|knitwear|sweater|cardigan|turtleneck|cable knit|boots?|coat|parka|thermal|cozy|winter|autumn)\b/g;
// Pieces made only for hot weather
const SUMMER_ONLY_MARKERS = /\b(linen|flax|seersucker|sandals?|shorts|tank|swim\w*|sleeveless|bikini)\b/g;
// Light fabrics that suit hot weather (preference only)
const LIGHT_MARKERS = /\b(linen|flax|silk|cotton|breathable|lightweight|seersucker|chambray|canvas|mesh)\b/g;
// Occasion words in a request -> occasion / style tags on products
const OCCASION_TAGS: [RegExp, string[]][] = [
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
// Same default as the backend's BDT_PER_USD
const BDT_PER_USD = 120;

const toCents = (amount: number) => Math.round(amount * 100);
// The price the shopper actually pays (storefront discount convention)
const paidPrice = (product: Product) => Math.max(0, product.price * (1 - (product.discountPercentage || 0) / 100));
const specValue = (product: Product, key: string) => String(product.specifications?.[key] || '');
// Distinct markers found, so a fabric named in both title and spec counts once
const distinctCount = (pattern: RegExp, text: string) => new Set(text.match(pattern) || []).size;
const isPiece = (piece: StylistPiece | null): piece is StylistPiece => piece !== null;
const listPhrase = (words: string[]) =>
  words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}` : words[0] || '';

function parseOutfitBudget(query: string): number | undefined {
  const amount = String.raw`(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)`;
  const currency = String.raw`(?:\$|usd|৳|tk\.?|bdt|taka)?`;
  const patterns = [
    new RegExp(String.raw`(?:under|below|within|less than|up to|upto|no more than|max(?:imum)?|budget(?:\s+(?:of|is))?\s*:?)\s*${currency}\s*${amount}`),
    new RegExp(String.raw`(?:\$|৳|usd\s*)\s*${amount}`),
    new RegExp(String.raw`${amount}\s*(?:\$|usd|dollars?|bucks|৳|tk\b|bdt|taka|budget)`),
  ];
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) return Number(match[1].replace(/,/g, '')) || undefined;
  }
  return undefined;
}

function detectSeason(query: string): Season | undefined {
  const summer = /\b(summer\w*|hot|heat\w*|humid|tropical|beach\w*|resort|pool\w*|sunny)\b/.test(query);
  const winter = /\b(winter\w*|cold|freezing|snow\w*|chilly|frosty|ski|skiing)\b/.test(query);
  if (summer === winter) return undefined;
  return summer ? 'summer' : 'winter';
}

function detectGender(query: string): Exclude<PieceGender, 'unisex'> | undefined {
  const female = /\b(women'?s?|woman|female|ladies|lady|her|she|girl'?s?|girlfriend|wife|mom|mother|sister)\b/.test(query);
  const male = /\b(men'?s?|man|male|guys?|gentlem[ae]n|him|he|his|boys?|boyfriend|husband|dad|father|brother)\b/.test(query);
  if (female === male) return undefined;
  return female ? 'female' : 'male';
}

// Classify a product for the outfit, or null when it is not clothing or does not suit the season
function toStylistPiece(product: Product, season: Season | undefined, occasionTags: string[], color?: string): StylistPiece | null {
  let slot: OutfitSlot | undefined;
  for (const value of [product.category, specValue(product, 'Layer'), product.subcategory]) {
    const name = String(value || '').toLowerCase();
    slot = SLOT_ORDER.find((key) => OUTFIT_SLOTS[key].includes(name));
    if (slot) break;
  }
  if (!slot) return null;

  const tagList = [...(product.tags || []), ...specValue(product, 'Occasion').split(','), ...specValue(product, 'StyleTags').split(',')]
    .map((tag) => tag.trim().toLowerCase());
  const tagText = tagList.join(' ');
  const text = [product.title, product.subcategory, specValue(product, 'Material'), specValue(product, 'Fabric'), tagText].join(' ').toLowerCase();
  const taggedSummer = /\b(summer|beach|resort)/.test(tagText);
  const taggedWinter = /\b(winter|autumn)\b/.test(tagText);
  const warm = distinctCount(WARM_MARKERS, text);
  const summerOnly = distinctCount(SUMMER_ONLY_MARKERS, text) > 0;
  // Summer: no leather, wool, knitwear, boots or heavy layers. Winter: nothing made only for the heat.
  if (season === 'summer' && !(taggedSummer && !taggedWinter) && (taggedWinter || warm > 0 || (slot === 'outerwear' && !summerOnly))) return null;
  if (season === 'winter' && !(taggedWinter && !taggedSummer) && (taggedSummer || summerOnly)) return null;

  let fit = 0;
  if (season === 'summer') fit += Math.min(20, 7 * (distinctCount(LIGHT_MARKERS, text) + (taggedSummer ? 1 : 0)));
  if (season === 'winter') fit += Math.min(20, 7 * (warm + (taggedWinter ? 1 : 0)));
  if (occasionTags.length) fit += Math.min(20, 10 * occasionTags.filter((tag) => tagList.includes(tag)).length);
  if (color && `${product.title} ${tagText}`.toLowerCase().includes(color)) fit += 12;

  const gender = specValue(product, 'Gender').toLowerCase();
  return {
    product,
    slot,
    gender: /^(male|men|man|mens)$/.test(gender) ? 'male' : /^(female|women|woman|womens|ladies)$/.test(gender) ? 'female' : 'unisex',
    paidCents: toCents(paidPrice(product)),
    fit,
    score: fit + (product.featured || product.isFeatured ? 2 : 0) + (product.rating || 0),
  };
}

// Pick one piece per slot so the whole outfit (not each piece) stays within the budget
function buildStylistOutfit(pieces: StylistPiece[], budgetCents: number, season: Season | undefined, picky: boolean): StylistOutfit | null {
  const weights: Record<OutfitSlot, number> = {
    top: 100, bottom: 100, dress: 200, shoes: 45, outerwear: season === 'winter' ? 100 : 10, accessory: 6,
  };
  const isOptional = (slot: OutfitSlot) => slot === 'accessory' || (slot === 'outerwear' && season !== 'winter');
  const options = (slot: OutfitSlot): (StylistPiece | null)[] => {
    // Extras are only worth adding when they suit the brief
    const fits = pieces.filter((piece) => piece.slot === slot && piece.paidCents <= budgetCents && (!picky || !isOptional(slot) || piece.fit > 0));
    const best = [...fits].sort((a, b) => b.score - a.score).slice(0, 6);
    const cheapest = [...fits].sort((a, b) => a.paidCents - b.paidCents).slice(0, 3);
    return [null, ...new Set([...best, ...cheapest])];
  };
  const value = (piece: StylistPiece | null) => (piece ? weights[piece.slot] * (1 + piece.score / 50) : 0);
  const cost = (piece: StylistPiece | null) => (piece ? piece.paidCents : 0);

  const bases: (StylistPiece | null)[][] = options('dress').filter(isPiece).map((dress) => [dress]);
  for (const top of options('top')) for (const bottom of options('bottom')) bases.push([top, bottom]);
  const outerwear = options('outerwear');
  const shoes = options('shoes');
  const accessories = options('accessory');

  let best: StylistOutfit | null = null;
  for (const base of bases) {
    const baseCents = base.reduce((sum, piece) => sum + cost(piece), 0);
    const baseValue = base.reduce((sum, piece) => sum + value(piece), 0);
    for (const layer of outerwear) {
      for (const shoe of shoes) {
        for (const accessory of accessories) {
          const totalCents = baseCents + cost(layer) + cost(shoe) + cost(accessory);
          if (totalCents > budgetCents) continue;
          // Ties go to the cheaper outfit
          const score = baseValue + value(layer) + value(shoe) + value(accessory) - totalCents / 1e7;
          if (!best || score > best.score) best = { score, totalCents, items: [...base, layer, shoe, accessory].filter(isPiece) };
        }
      }
    }
  }
  if (!best || !best.items.length) return null;
  best.items.sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
  return best;
}

class AIService {
  /**
   * AI Fashion Stylist assistant query parser.
   * A stated budget caps the whole outfit, and a stated season rules out pieces that do not suit it.
   */
  async queryAIStylist(
    query: string,
    profile: UserPersonalizationProfile,
    catalog: Product[]
  ): Promise<StylistMessage> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const lower = query.toLowerCase();
    const statedBudget = parseOutfitBudget(lower);
    const inTaka = /(?:taka|bdt|৳|\btk\b)/.test(lower);
    const maxBudget = statedBudget && inTaka ? statedBudget / BDT_PER_USD : statedBudget;
    const budgetLabel = statedBudget ? (inTaka ? `${statedBudget.toLocaleString('en-US')} taka` : `$${statedBudget}`) : '';
    const season = detectSeason(lower);
    const gender = detectGender(lower);
    const color = ['black', 'white', 'blue', 'navy', 'red', 'green', 'olive', 'beige', 'brown', 'cream', 'camel', 'grey', 'gray', 'gold', 'pink']
      .find((word) => new RegExp(`\\b${word}\\b`).test(lower));
    const occasions = OCCASION_TAGS.filter(([pattern]) => pattern.test(lower));
    const occasionTags = Array.from(new Set(occasions.flatMap(([, tags]) => tags)));
    const occasionWord = occasions.length ? lower.match(occasions[0][0])?.[1] || '' : '';
    const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

    const pieces = catalog
      .map((product) => toStylistPiece(product, season, occasionTags, color))
      .filter(isPiece)
      .filter((piece) => !gender || piece.gender === gender || piece.gender === 'unisex');
    const budgetCents = maxBudget ? toCents(maxBudget) : Infinity;
    const picky = Boolean(season || occasionTags.length || color);

    let best: { outfit: StylistOutfit; pool: StylistPiece[]; gender: Exclude<PieceGender, 'unisex'> } | null = null;
    for (const option of gender ? [gender] : (['female', 'male'] as const)) {
      const pool = pieces.filter((piece) => piece.gender === option || piece.gender === 'unisex');
      const outfit = buildStylistOutfit(pool, budgetCents, season, picky);
      if (outfit && (!best || outfit.score > best.outfit.score)) best = { outfit, pool, gender: option };
    }

    const message = (text: string, items: StylistPiece[] = [], title = '') => ({
      id: Math.random().toString(),
      sender: 'assistant' as const,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedProducts: items.map((piece) => piece.product),
      suggestedOutfit: items.length
        ? { title, items: items.map((piece) => piece.product), totalPrice: items.reduce((sum, piece) => sum + piece.paidCents, 0) / 100 }
        : undefined,
    });

    if (!best) {
      return message(pieces.length && maxBudget
        ? `Nothing in the catalog fits a ${budgetLabel} budget for ${season ? `a ${season} ` : 'an '}outfit.`
        : 'There are no available products to recommend right now.');
    }

    const { outfit, pool } = best;
    const genderLabel = outfit.items.some((piece) => piece.gender !== 'unisex') ? `${best.gender === 'female' ? "women's" : "men's"} ` : '';
    const look = `${genderLabel}${season ? `${season} ` : ''}${occasionWord ? `${occasionWord} ` : ''}look`;
    const title = `${[season, occasionWord]
      .filter((word): word is string => Boolean(word))
      .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
      .join(' ') || 'Curated'} Look`;
    const pieceList = outfit.items.map((piece) => `${piece.product.title} (${money(piece.paidCents)})`).join(', ');

    // Core pieces still missing: either they exist but would break the budget, or none are in stock
    const covered = new Set(outfit.items.map((piece) => piece.slot));
    const needed: OutfitSlot[] = [];
    if (!covered.has('dress')) {
      if (!covered.has('top')) needed.push('top');
      if (!covered.has('bottom')) needed.push('bottom');
    }
    if (!covered.has('shoes')) needed.push('shoes');
    if (season === 'winter' && !covered.has('outerwear')) needed.push('outerwear');
    const inStock = (slot: OutfitSlot) => pool.some((piece) => piece.slot === slot || (['top', 'bottom'].includes(slot) && piece.slot === 'dress'));
    const overBudget = maxBudget ? needed.filter(inStock) : [];
    const unavailable = needed.filter((slot) => !maxBudget || !inStock(slot));

    const parts: string[] = [];
    if (overBudget.length) {
      parts.push(`A complete ${look} doesn't fit in your ${budgetLabel} budget, so here is the closest outfit I could put together for ${money(outfit.totalCents)}: ${pieceList}.`);
      parts.push(`Adding ${listPhrase(overBudget.map((slot) => SLOT_LABELS[slot] || slot))} would take it over budget.`);
    } else {
      parts.push(`Here is a ${look} for ${money(outfit.totalCents)} in total${maxBudget ? `, within your ${budgetLabel} budget` : ''}: ${pieceList}.`);
    }
    if (unavailable.length) {
      const pronoun = unavailable.length > 1 || ['shoes', 'bottom'].includes(unavailable[0]) ? 'them' : 'it';
      parts.push(`I don't have ${season ? `${season}-appropriate ` : ''}${listPhrase(unavailable.map((slot) => SLOT_LABELS[slot] || slot))} in stock right now, so I left ${pronoun} out.`);
    }
    if (season === 'summer' && !covered.has('outerwear')) parts.push('No jacket needed in the heat.');

    return message(parts.join(' '), outfit.items, title);
  }

  /**
   * AI Semantic Search parser
   */
  parseSemanticSearch(query: string, catalog: Product[]): SemanticSearchResult {
    const lower = query.toLowerCase();

    // Intent extraction logic
    const categoryKeywords = ['shirt', 'top', 'pants', 'jeans', 'dress', 'jacket', 'shoes', 'accessories', 'hoodie'];
    const colorKeywords = ['black', 'blue', 'white', 'red', 'green', 'beige', 'yellow', 'brown', 'cream', 'gold'];
    const purposeKeywords = ['office', 'wedding', 'casual', 'party', 'summer', 'winter', 'formal', 'gym'];

    const category = categoryKeywords.find((k) => lower.includes(k));
    const color = colorKeywords.find((k) => lower.includes(k));
    const purpose = purposeKeywords.find((k) => lower.includes(k));

    const priceMatch = lower.match(/(?:under|below|less than|max)?\s*(\d{3,6})/i);
    const maxBudget = priceMatch ? parseInt(priceMatch[1], 10) : undefined;

    let matched = catalog.filter((p) => {
      let pass = true;
      if (category && !p.category.toLowerCase().includes(category) && !p.title.toLowerCase().includes(category)) {
        pass = false;
      }
      if (color && !p.title.toLowerCase().includes(color) && !p.description.toLowerCase().includes(color)) {
        pass = false;
      }
      if (maxBudget && p.price > maxBudget) {
        pass = false;
      }
      return pass;
    });

    if (matched.length === 0) {
      // Fallback matching if exact search was too strict
      matched = catalog.filter((p) =>
        lower.split(' ').some((word) => word.length > 2 && p.title.toLowerCase().includes(word))
      );
    }

    return {
      query,
      parsedIntent: { category, color, purpose, maxBudget },
      matchedProducts: matched.length > 0 ? matched : catalog.slice(0, 6),
      trendingSearches: [
        'Black shirt for office under 2500',
        'Summer linen dress',
        'Luxury blazer for evening',
        'White sneakers casual fit',
      ],
      suggestedKeywords: ['Slim Fit', '100% Breathable Cotton', 'Formal Attire', 'Lightweight Outerwear'],
    };
  }

  /**
   * AI Personalized Recommendation Engine
   */
  getPersonalizedRecommendations(
    profile: UserPersonalizationProfile,
    catalog: Product[]
  ): {
    recommendedForYou: Product[];
    completeTheLook: Product[];
    becauseYouViewed: Product[];
    trendingForStyle: Product[];
    similarProducts: Product[];
  } {
    const recommendedForYou = catalog.filter((p) =>
      profile.favoriteCategories.some((c) => p.category.toLowerCase().includes(c.toLowerCase())) ||
      profile.favoriteColors.some((c) => p.title.toLowerCase().includes(c.toLowerCase()))
    );

    const becauseYouViewed = catalog.filter((p) =>
      profile.viewedProductIds.includes(String(p.id)) || p.featured || p.isFeatured
    );

    const trendingForStyle = catalog.filter((p) => p.rating && p.rating >= 4.5);
    const completeTheLook = catalog.filter((p) => ['shoes', 'accessory', 'jacket', 'pants'].includes(p.category.toLowerCase()));

    return {
      recommendedForYou: recommendedForYou.length > 0 ? recommendedForYou.slice(0, 8) : catalog.slice(0, 8),
      completeTheLook: completeTheLook.slice(0, 4),
      becauseYouViewed: becauseYouViewed.length > 0 ? becauseYouViewed.slice(0, 4) : catalog.slice(0, 4),
      trendingForStyle: trendingForStyle.slice(0, 4),
      similarProducts: catalog.slice(2, 6),
    };
  }

  /**
   * AI Complete Outfit Builder
   */
  generateCompleteOutfit(baseProduct: Product, catalog: Product[]): CompleteOutfit {
    const category = baseProduct.category.toLowerCase();

    let top: Product | undefined;
    let bottom: Product | undefined;
    let shoes: Product | undefined;
    let accessory: Product | undefined;

    if (category.includes('top') || category.includes('shirt') || category.includes('jacket')) {
      top = baseProduct;
      bottom = catalog.find((p) => ['pants', 'jeans', 'skirt'].includes(p.category.toLowerCase()));
      shoes = catalog.find((p) => p.category.toLowerCase().includes('shoes'));
      accessory = catalog.find((p) => ['accessory', 'jewelry', 'glasses', 'bag'].includes(p.category.toLowerCase()));
    } else if (category.includes('pants') || category.includes('jeans') || category.includes('skirt')) {
      bottom = baseProduct;
      top = catalog.find((p) => ['top', 'shirt', 'jacket'].includes(p.category.toLowerCase()));
      shoes = catalog.find((p) => p.category.toLowerCase().includes('shoes'));
      accessory = catalog.find((p) => ['accessory', 'jewelry', 'glasses', 'bag'].includes(p.category.toLowerCase()));
    } else {
      top = catalog.find((p) => ['top', 'shirt'].includes(p.category.toLowerCase()));
      bottom = catalog.find((p) => ['pants', 'jeans'].includes(p.category.toLowerCase()));
      shoes = catalog.find((p) => p.category.toLowerCase().includes('shoes'));
      accessory = baseProduct;
    }

    const items = [top, bottom, shoes, accessory].filter(Boolean) as Product[];
    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

    return {
      id: `outfit_${baseProduct.id}`,
      title: `AI Styled Match for ${baseProduct.title}`,
      baseProduct,
      top,
      bottom,
      shoes,
      accessory,
      totalPrice,
    };
  }

  /**
   * Admin: AI Customer Review Sentiment Analysis
   */
  analyzeReviewsSentiment(reviews: ProductReview[]): ReviewSentimentAnalysis {
    if (!reviews || reviews.length === 0) {
      return {
        totalReviews: 0,
        positivePercentage: 0,
        negativePercentage: 0,
        neutralPercentage: 0,
        summary: 'No customer reviews are available yet.',
        keyPros: [],
        keyCons: [],
      };
    }

    const total = reviews.length;
    let pos = 0;
    let neg = 0;
    let neu = 0;

    reviews.forEach((r) => {
      if (r.rating >= 4) pos++;
      else if (r.rating <= 2) neg++;
      else neu++;
    });

    const positivePercentage = Math.round((pos / total) * 100);
    const negativePercentage = Math.round((neg / total) * 100);
    const neutralPercentage = 100 - positivePercentage - negativePercentage;

    return {
      totalReviews: total,
      positivePercentage,
      negativePercentage,
      neutralPercentage,
      summary: `${pos} positive, ${neu} neutral and ${neg} negative rating${total === 1 ? '' : 's'} across ${total} customer review${total === 1 ? '' : 's'}.`,
      keyPros: [],
      keyCons: [],
    };
  }

}

export const aiService = new AIService();
