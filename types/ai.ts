import { Product } from '@/types';

export type GenderType = 'male' | 'female';
export type BodyType = 'slim' | 'regular' | 'athletic' | 'plus_size';
export type HeightType = 'short' | 'average' | 'tall';
export type HairStyleType = 'short' | 'long' | 'curly' | 'bob' | 'bald';
export type FaceShapeType = 'oval' | 'round' | 'square' | 'heart';

export interface AvatarProfile {
  id: string;
  user_id?: string;
  name: string;
  gender: GenderType;
  body_type: BodyType;
  height: HeightType;
  skin_tone: string;
  hair_style: HairStyleType;
  hair_color: string;
  eye_style?: string;
  face_shape?: FaceShapeType;
  avatar_image?: string;
  created_at?: string;
}

export interface StylistMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedProducts?: Product[];
  suggestedOutfit?: {
    title: string;
    items: Product[];
    totalPrice: number;
  };
}

export interface SemanticSearchResult {
  query: string;
  parsedIntent: {
    category?: string;
    color?: string;
    purpose?: string;
    maxBudget?: number;
    gender?: string;
  };
  matchedProducts: Product[];
  trendingSearches: string[];
  suggestedKeywords: string[];
}

export interface CompleteOutfit {
  id: string;
  title: string;
  baseProduct: Product;
  top?: Product;
  bottom?: Product;
  shoes?: Product;
  accessory?: Product;
  totalPrice: number;
}

export interface UserPersonalizationProfile {
  stylePreference: 'casual' | 'formal' | 'streetwear' | 'luxury' | 'athletic';
  favoriteColors: string[];
  favoriteCategories: string[];
  budgetTier: 'budget' | 'medium' | 'premium';
  preferredBrands: string[];
  viewedProductIds: string[];
}

export interface AdminAIDescriptionInput {
  image?: string;
  category: string;
  material: string;
  color: string;
  brand: string;
}

export interface AdminAIDescriptionOutput {
  title: string;
  shortDescription: string;
  seoDescription: string;
  highlights: string[];
  tags: string[];
  metaKeywords: string[];
}

export interface AdminAIImageEnhancements {
  original: string;
  ecommerceClean: string;
  lifestyle: string;
  modelWearing: string;
  socialBanner: string;
  thumbnail: string;
}

export interface ReviewSentimentAnalysis {
  totalReviews: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  summary: string;
  keyPros: string[];
  keyCons: string[];
}

export interface SalesAdvisorInsight {
  id: string;
  type: 'trending' | 'inventory_warning' | 'cross_sell' | 'pricing_tip';
  title: string;
  description: string;
  actionRecommendation: string;
  impactScore: 'high' | 'medium' | 'low';
}
