import { Product } from './index';

export type GenderType = 'male' | 'female';
export type BodyType = 'slim' | 'regular' | 'athletic' | 'plus';
export type HeightType = 'short' | 'average' | 'tall';
export type HairStyleType = 'short' | 'long' | 'curly' | 'wavy' | 'bald';
export type ViewAngle = 'front' | 'back' | 'left' | 'right';

export interface AvatarState {
  gender: GenderType;
  bodyType: BodyType;
  height: HeightType;
  skinTone: string; // Hex color code (e.g. #ffd1b3)
  hairStyle: HairStyleType;
  hairColor: string; // Hex color code (e.g. #4a3728)
  eyeColor: string; // Hex color code
  browStyle: 'normal' | 'thick' | 'thin';
  mouthExpression: 'smile' | 'neutral' | 'open';
  pose: 'default' | 'hips' | 'crossed';
  backgroundScene: string; // Background backdrop key
}

export interface WornItems {
  top?: Product;
  pants?: Product;
  dress?: Product;
  jacket?: Product;
  shoes?: Product;
  hat?: Product;
  bag?: Product;
  jewelry?: Product;
  glasses?: Product;
}

export interface SavedAvatar {
  id: string;
  name: string;
  avatar: AvatarState;
  wornItems: WornItems;
  createdAt: string;
}

export interface StylistFeedback {
  colorHarmonyScore: number; // 0-100
  colorHarmonyFeedback: string;
  trendScore: number; // 0-100
  trendFeedback: string;
  budgetScore: number; // 0-100
  budgetFeedback: string;
  overallScore: number; // 0-100
  recommendations: Product[];
}

export interface StyleChallenge {
  id: string;
  title: string;
  description: string;
  targetScore: number;
  maxBudget: number;
  tagsRequired: string[];
  rewardBadgeId: string;
  rewardPoints: number;
  completed: boolean;
}

export interface FashionBadge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or SVG name
  unlockedAt?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedItems?: Product[];
}
