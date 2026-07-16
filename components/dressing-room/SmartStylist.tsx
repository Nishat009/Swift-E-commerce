import React, { useMemo } from 'react';
import { useAvatarStore } from '@/stores/avatarStore';
import { useCartStore } from '@/stores/cartStore';
import { fashionProducts } from '@/data/fashionCatalog';
import { Product } from '@/types';
import { Sparkles, ShoppingCart, TrendingUp, DollarSign, Palette, Award, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import Button from '../ui/Button';

export default function SmartStylist() {
  const { wornItems } = useAvatarStore();
  const addItem = useCartStore((state) => state.addItem);

  // --- OUTFIT ANALYSIS ENGINE ---
  const analysis = useMemo(() => {
    const items = Object.values(wornItems).filter(Boolean) as any[];
    
    // Default fallback state when nothing is worn
    if (items.length === 0) {
      return {
        colorHarmony: 0,
        colorFeedback: 'No clothing worn yet. Dress your avatar to calculate color harmony.',
        trend: 0,
        trendFeedback: 'Add items to evaluate style trends.',
        budget: 100,
        budgetFeedback: 'Closet is empty. No budget impact.',
        overall: 0,
        totalPrice: 0,
        aiSummary: 'Hello! I am your AI Smart Stylist. Try on different combinations from the closet, and I will instantly analyze your color coordinates, style trends, and budget harmony!',
        recommendations: fashionProducts.slice(0, 3),
      };
    }

    // 1. Total Price & Budget Score (Target budget: $250)
    const totalPrice = items.reduce((sum, item) => {
      const discountedPrice = item.price * (1 - (item.discountPercentage || 0) / 100);
      return sum + discountedPrice;
    }, 0);

    let budgetScore = 100;
    let budgetFeedback = 'Excellent! Outfit is highly cost-efficient.';
    if (totalPrice > 250) {
      budgetScore = Math.max(20, Math.round(100 - (totalPrice - 250) / 3));
      budgetFeedback = `Outfit is above average budget. Total: $${totalPrice.toFixed(0)}`;
    } else if (totalPrice > 150) {
      budgetScore = 85;
      budgetFeedback = 'Good budget management. Mid-range outfit.';
    }

    // Helper helper to get specifications
    const getSpec = (p: any, key: string): string => {
      if (!p.specifications) return '';
      if (typeof p.specifications.get === 'function') {
        return p.specifications.get(key) || '';
      }
      return p.specifications[key] || '';
    };

    // 2. Color Harmony Score
    const colors = items.map((p) => getSpec(p, 'Color').toLowerCase()).filter(Boolean);
    let colorScore = 80;
    let colorFeedback = 'Modern neutral coordination.';

    // Check color matching patterns
    if (colors.length >= 2) {
      const hasBlack = colors.includes('#1c1c1c') || colors.includes('#1a1a1a') || colors.includes('#111111');
      const hasWhite = colors.includes('#ffffff') || colors.includes('#fcfcfc');
      const hasCreamBeige = colors.includes('#e3dac9') || colors.includes('#dfdcd6') || colors.includes('#c2b29a') || colors.includes('#c8b195');
      const hasOlive = colors.includes('#3d4b3c');
      const hasDenim = colors.includes('#4a6b82') || colors.includes('#3b5266');

      if (hasBlack && hasWhite) {
        colorScore = 95;
        colorFeedback = 'Timeless monochrome contrast! Black & White is universally sharp.';
      } else if (hasCreamBeige && (hasOlive || hasDenim)) {
        colorScore = 98;
        colorFeedback = 'Exceptional Earth Harmony! Sand, beige, and olive create a premium rustic warmth.';
      } else if (hasBlack && hasCreamBeige) {
        colorScore = 92;
        colorFeedback = 'Sophisticated minimal contrast. Sleek dark tones pair beautifully with camel.';
      } else if (colors.every((c) => c === colors[0])) {
        colorScore = 90;
        colorFeedback = 'Bold Monochromatic Look. Clean single-tone profile.';
      }
    }

    // 3. Trend Score
    const styleTags = items.flatMap((p) => getSpec(p, 'StyleTags').split(',').map((t) => t.trim()));
    let trendScore = 75;
    let trendFeedback = 'Classic essential daily wear.';

    if (styleTags.includes('streetwear') && styleTags.includes('utility')) {
      trendScore = 96;
      trendFeedback = 'Utility Streetwear Trend! Boxy layers and cargo pockets are hot in Tokyo & London.';
    } else if (styleTags.includes('minimalist') && styleTags.includes('chic')) {
      trendScore = 94;
      trendFeedback = 'Quiet Luxury Trend. Understated elegance with premium fabric drapes.';
    } else if (styleTags.includes('resort') || styleTags.includes('summer')) {
      trendScore = 90;
      trendFeedback = 'Seasonal Resort Trend. Airy linen cuts look effortless.';
    }

    // 4. Overall Score & AI summary comments
    const overallScore = Math.round((budgetScore + colorScore + trendScore) / 3);
    
    let aiSummary = 'Your outfit is looking stylish! ';
    if (overallScore > 90) {
      aiSummary = `Stunning combination! The stylist rates this look highly. Color matching is visually balanced, and the style feels modern yet effortless. Ready for the lookbook.`;
    } else if (overallScore > 75) {
      aiSummary = `Solid look. The colors mesh well together for a versatile outfit. Consider accessorizing with oval sunglasses or a minimalist tote bag to elevate the style profile!`;
    } else {
      aiSummary = `An interesting experiment! Try swapping out contrasting items for clean neutral tones (cream, navy, charcoal) to build a more harmonious base look.`;
    }

    // 5. Dynamic recommendations (Items in catalog of other categories to "Complete the Look")
    const activeCategories = items.map((p) => p.category);
    const recommendations = fashionProducts
      .filter((p) => !activeCategories.includes(p.category)) // Not wearing this category
      .slice(0, 3);

    return {
      colorHarmony: colorScore,
      colorFeedback,
      trend: trendScore,
      trendFeedback,
      budget: budgetScore,
      budgetFeedback,
      overall: overallScore,
      totalPrice,
      aiSummary,
      recommendations,
    };
  }, [wornItems]);

  // Add all worn items to the cart
  const handleAddOutfitToCart = () => {
    const items = Object.values(wornItems).filter(Boolean) as Product[];
    if (items.length === 0) return;
    
    items.forEach((item) => {
      addItem(item, 1);
    });
    
    // Simple notification effect
    alert(`Successfully added all ${items.length} outfit items to your shopping cart!`);
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm h-full max-h-[500px] overflow-y-auto justify-between scrollbar-thin">
      <div>
        {/* Header Title */}
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-[#8b6f47] dark:text-[#c9a96b]" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
            AI Smart Stylist
          </h3>
        </div>

        {/* AI Stylist Dialogue box */}
        <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-900 text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
          <p className="italic">"{analysis.aiSummary}"</p>
        </div>

        {/* Score Charts */}
        <div className="space-y-4 mb-6">
          {/* Overall Style Quotient */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#8b6f47]/10 to-transparent p-3 rounded-xl border border-[#8b6f47]/15">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#8b6f47] dark:text-[#c9a96b]" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Style Quotient</span>
            </div>
            <span className="text-sm font-extrabold text-[#8b6f47] dark:text-[#c9a96b]">{analysis.overall} / 100</span>
          </div>

          {/* Color Harmony */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1.5"><Palette className="w-3.5 h-3.5 text-blue-500" /> Color Harmony</span>
              <span>{analysis.colorHarmony}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-850 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${analysis.colorHarmony}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{analysis.colorFeedback}</p>
          </div>

          {/* Trend Quotient */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-purple-500" /> Trend Factor</span>
              <span>{analysis.trend}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-850 h-2 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${analysis.trend}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{analysis.trendFeedback}</p>
          </div>

          {/* Budget Quotient */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Budget Quotient</span>
              <span>{analysis.budget}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-850 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${analysis.budget}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{analysis.budgetFeedback}</p>
          </div>
        </div>

        {/* Complete the Look Section */}
        <div className="border-t border-gray-100 dark:border-gray-900 pt-6">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Complete the Look
          </h4>
          <div className="space-y-2.5">
            {analysis.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-2 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/20"
              >
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-gray-100">
                    <Image src={rec.thumbnail} alt={rec.title} fill className="object-cover" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{rec.title}</p>
                    <p className="text-[10px] text-[#8b6f47] dark:text-[#c9a96b] font-bold">${rec.price}</p>
                  </div>
                </div>
                
                {/* Apply button */}
                <button
                  onClick={() => useAvatarStore.getState().tryOnItem(rec)}
                  className="px-3 py-1.5 border border-gray-200 hover:border-[#8b6f47] hover:text-[#8b6f47] dark:border-gray-800 dark:hover:border-[#c9a96b] dark:hover:text-[#c9a96b] text-[10px] font-bold rounded-lg transition-colors"
                >
                  Try On
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Actions */}
      <div className="mt-8 border-t border-gray-100 dark:border-gray-900 pt-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-gray-500">Outfit Value:</span>
          <span className="text-lg font-black text-gray-900 dark:text-white">${analysis.totalPrice.toFixed(2)}</span>
        </div>
        <Button
          onClick={handleAddOutfitToCart}
          disabled={Object.keys(wornItems).length === 0}
          className="w-full bg-[#8b6f47] hover:bg-[#6b5435] text-white border-0 flex items-center justify-center gap-2 py-3 rounded-full text-xs font-bold shadow-sm transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
          Add Outfit to Cart
        </Button>
      </div>
    </div>
  );
}
