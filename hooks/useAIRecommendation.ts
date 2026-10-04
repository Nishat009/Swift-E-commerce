import { useEffect, useMemo, useState } from 'react';
import { useAIStore } from '@/stores/aiStore';
import { aiService } from '@/services/aiService';
import { Product } from '@/types';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

export function useAIRecommendation(catalog: Product[]) {
  const { userProfile, trackViewedProduct } = useAIStore();
  const { user } = useAuth();
  const [serverPicks, setServerPicks] = useState<ReturnType<typeof aiService.getPersonalizedRecommendations> | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    apiClient.get('/recommendations').then(({ data }) => {
      if (active && data?.success) setServerPicks(data.data);
    }).catch(() => {});
    return () => { active = false; };
  }, [user?.id]);

  const recommendations = useMemo(() => {
    return aiService.getPersonalizedRecommendations(userProfile, catalog);
  }, [userProfile, catalog]);

  return {
    ...(serverPicks || recommendations),
    userProfile,
    trackViewedProduct,
  };
}
