import { Product, ProductReview } from '@/types';
import {
  AvatarProfile,
  StylistMessage,
  SemanticSearchResult,
  CompleteOutfit,
  UserPersonalizationProfile,
  AdminAIDescriptionInput,
  AdminAIDescriptionOutput,
  AdminAIImageEnhancements,
  ReviewSentimentAnalysis,
  SalesAdvisorInsight,
} from '@/types/ai';

class AIService {
  private cache: Map<string, any> = new Map();

  /**
   * AI Virtual Try-On generation
   */
  async generateVirtualTryOn(
    avatar: AvatarProfile,
    photoUrl: string | null,
    product: Product
  ): Promise<{ previewUrl: string; angles: string[] }> {
    const cacheKey = `tryon_${avatar.id}_${photoUrl ? 'photo' : 'avatar'}_${product.id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Simulate AI synthesis latency safely
    await new Promise((resolve) => setTimeout(resolve, 800));

    const previewUrl = product.images?.[0] || product.image || '/placeholder-fashion.jpg';
    const result = {
      previewUrl,
      angles: ['Front View', 'Side Profile (Left)', 'Side Profile (Right)', 'Back View'],
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * AI Fashion Stylist assistant query parser
   */
  async queryAIStylist(
    query: string,
    profile: UserPersonalizationProfile,
    catalog: Product[]
  ): Promise<StylistMessage> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const lower = query.toLowerCase();
    let text = "I've analyzed your style preferences and selected these top recommendation matches for you!";
    let suggestedProducts: Product[] = [];
    let suggestedOutfit: StylistMessage['suggestedOutfit'] = undefined;

    // Extract price budget if present (e.g., "under 5000", "below 2000")
    const priceMatch = lower.match(/(?:under|below|less than|max)?\s*(\d{3,6})\s*(?:taka|bdt|\$)?/i);
    const maxBudget = priceMatch ? parseInt(priceMatch[1], 10) : undefined;

    let filtered = catalog;
    if (maxBudget) {
      filtered = filtered.filter((p) => p.price <= maxBudget);
    }

    if (lower.includes('wedding') || lower.includes('party') || lower.includes('evening')) {
      text = maxBudget
        ? `Here is an elegant evening outfit curated for your event under ${maxBudget} currency units. Perfect for weddings and formal parties!`
        : "For weddings and high-end evening events, I recommend a tailored luxury outfit with statement accessories.";

      const tops = filtered.filter((p) => ['top', 'dress', 'jacket'].includes(p.category.toLowerCase()));
      const bottoms = filtered.filter((p) => ['pants', 'skirt'].includes(p.category.toLowerCase()));
      const accessories = filtered.filter((p) => ['jewelry', 'bag', 'glasses'].includes(p.category.toLowerCase()));

      suggestedProducts = filtered.slice(0, 4);

      if (tops.length > 0) {
        const outfitItems = [tops[0], bottoms[0], accessories[0]].filter(Boolean);
        const totalPrice = outfitItems.reduce((acc, item) => acc + item.price, 0);
        suggestedOutfit = {
          title: "Luxury Event & Gala Outfit",
          items: outfitItems,
          totalPrice,
        };
      }
    } else if (lower.includes('office') || lower.includes('business') || lower.includes('work')) {
      text = "For a sharp, modern corporate look, try structured layers with clean lines and breathable fabrics.";
      suggestedProducts = filtered
        .filter((p) => ['shirt', 'top', 'pants', 'jacket', 'shoes'].includes(p.category.toLowerCase()))
        .slice(0, 4);
    } else if (lower.includes('summer') || lower.includes('beach') || lower.includes('vacation')) {
      text = "Here is a light, breathable summer resort ensemble designed to keep you cool and stylish.";
      suggestedProducts = filtered
        .filter((p) => ['top', 'dress', 'pants', 'glasses'].includes(p.category.toLowerCase()))
        .slice(0, 4);
    } else if (lower.includes('match') || lower.includes('pair with') || lower.includes('jeans')) {
      text = "Here are complementary tops, footwear, and outerwear selected to perfectly pair with denim jeans.";
      suggestedProducts = filtered
        .filter((p) => ['top', 'jacket', 'shoes', 'accessory'].includes(p.category.toLowerCase()))
        .slice(0, 4);
    } else {
      // Default semantic match
      suggestedProducts = filtered.slice(0, 4);
    }

    return {
      id: Math.random().toString(),
      sender: 'assistant',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedProducts,
      suggestedOutfit,
    };
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
   * Admin: AI Product Description Generator
   */
  async generateAdminProductDetails(input: AdminAIDescriptionInput): Promise<AdminAIDescriptionOutput> {
    await new Promise((resolve) => setTimeout(resolve, 700));

    const colorTitle = input.color ? input.color.charAt(0).toUpperCase() + input.color.slice(1) : 'Classic';
    const title = `Premium ${colorTitle} ${input.category} by ${input.brand || 'SwiftCart'}`;

    return {
      title,
      shortDescription: `Crafted from high-grade ${input.material || 'cotton'}, this ${colorTitle.toLowerCase()} ${input.category.toLowerCase()} offers unmatched comfort and modern elegance for daily and formal wear.`,
      seoDescription: `Shop the new ${title}. Made with premium ${input.material || 'breathable fabric'}, featuring a modern tailored fit for any occasion. Fast delivery and easy returns.`,
      highlights: [
        `Made from 100% premium ${input.material || 'material'}`,
        'Tailored modern silhouette for maximum comfort',
        'Durable stitching & vibrant color retention',
        'Easy machine washable fabric',
      ],
      tags: [input.category.toLowerCase(), input.color.toLowerCase(), input.brand.toLowerCase(), 'fashion', 'trend'],
      metaKeywords: [title.toLowerCase(), `${input.color} ${input.category}`, `buy ${input.category} online`],
    };
  }

  /**
   * Admin: AI Image Enhancement Tool
   */
  async enhanceProductImage(imageUrl: string): Promise<AdminAIImageEnhancements> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      original: imageUrl,
      ecommerceClean: imageUrl,
      lifestyle: imageUrl,
      modelWearing: imageUrl,
      socialBanner: imageUrl,
      thumbnail: imageUrl,
    };
  }

  /**
   * Admin: AI Customer Review Sentiment Analysis
   */
  analyzeReviewsSentiment(reviews: ProductReview[]): ReviewSentimentAnalysis {
    if (!reviews || reviews.length === 0) {
      return {
        totalReviews: 0,
        positivePercentage: 80,
        negativePercentage: 10,
        neutralPercentage: 10,
        summary: "Customers highlight excellent fabric comfort, though a few note sizing runs slightly snug.",
        keyPros: ["High fabric quality", "Vibrant color match", "Fast delivery"],
        keyCons: ["Runs slightly snug on shoulders"],
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
      summary: positivePercentage >= 70
        ? "Overwhelmingly positive! Customers love the material softness and design detail."
        : "Mixed feedback: Customers admire the style but request more precise sizing guides.",
      keyPros: ["Superb material quality", "Accurate color representation", "Premium packaging"],
      keyCons: ["Consider sizing up for a loose fit"],
    };
  }

  /**
   * Admin: AI Sales & Business Advisor
   */
  getAdminSalesAdvisorInsights(): SalesAdvisorInsight[] {
    return [
      {
        id: 'ins_1',
        type: 'trending',
        title: 'High Velocity Product Detected',
        description: 'Black Hoodies & Denim Jackets are selling 42% faster than last month.',
        actionRecommendation: 'Increase inventory levels by 30% to prevent out-of-stock loss.',
        impactScore: 'high',
      },
      {
        id: 'ins_2',
        type: 'cross_sell',
        title: 'Cross-Sell Bundle Opportunity',
        description: '78% of customers who purchase Slim Fit Jeans also inspect White Leather Sneakers.',
        actionRecommendation: 'Enable AI Complete Outfit bundle discounts on jeans product pages.',
        impactScore: 'high',
      },
      {
        id: 'ins_3',
        type: 'inventory_warning',
        title: 'Seasonal Stock Advisory',
        description: 'Summer Linen Trousers stock level is below 15 units.',
        actionRecommendation: 'Reorder 50 units before the weekend summer campaign release.',
        impactScore: 'medium',
      },
    ];
  }
}

export const aiService = new AIService();
