import { useMemo } from 'react';
import { useAIStore } from '@/stores/aiStore';
import { aiService } from '@/services/aiService';
import { Product } from '@/types';

export function useAIRecommendation(catalog: Product[]) {
  const { userProfile, trackViewedProduct } = useAIStore();

  const recommendations = useMemo(() => {
    return aiService.getPersonalizedRecommendations(userProfile, catalog);
  }, [userProfile, catalog]);

  return {
    ...recommendations,
    userProfile,
    trackViewedProduct,
  };
}
