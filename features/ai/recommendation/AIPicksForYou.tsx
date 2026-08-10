import React from 'react';
import ProductCard from '@/components/ui/ProductCard';
import AIBadge from '@/components/ui/AIBadge';
import { useAIRecommendation } from '@/hooks/useAIRecommendation';
import { fashionProducts } from '@/data/fashionCatalog';
import { Sparkles, Eye, Flame, Layers } from 'lucide-react';

export default function AIPicksForYou() {
  const {
    recommendedForYou,
    completeTheLook,
    becauseYouViewed,
    trendingForStyle,
  } = useAIRecommendation(fashionProducts);

  return (
    <div className="space-y-12 py-8">
      {/* 1. Recommended For You */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AIBadge type="recommended" label="Curated By AI" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              AI Picks For You
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendedForYou.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 2. Complete The Look */}
      <section className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 dark:from-amber-950/30 dark:via-purple-950/30 dark:to-amber-950/30 rounded-3xl p-6 border border-amber-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <AIBadge type="match" label="AI Outfit Matcher" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              Complete The Look
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {completeTheLook.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 3. Because You Viewed This & Trending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Because You Viewed */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Because You Viewed Similar Styles
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {becauseYouViewed.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Trending For Your Style */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Trending For Your Style
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trendingForStyle.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
