import React, { useState, useEffect } from 'react';
import { Search, Sparkles, X, Tag, TrendingUp, Filter } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { useAIStore } from '@/stores/aiStore';
import { fashionProducts } from '@/data/fashionCatalog';
import { SemanticSearchResult } from '@/types/ai';
import ProductCard from '@/components/ui/ProductCard';
import AIBadge from '@/components/ui/AIBadge';

interface AISmartSearchProps {
  onResultsFound?: (results: SemanticSearchResult) => void;
}

export default function AISmartSearch({ onResultsFound }: AISmartSearchProps) {
  const { addSearchHistory } = useAIStore();
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SemanticSearchResult | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResult(null);
      return;
    }

    const timer = setTimeout(() => {
      const parsed = aiService.parseSemanticSearch(query, fashionProducts);
      setSearchResult(parsed);
      if (onResultsFound) {
        onResultsFound(parsed);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, onResultsFound]);

  const handleSelectQuery = (q: string) => {
    setQuery(q);
    addSearchHistory(q);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto space-y-3">
      {/* Search Bar Input */}
      <div className="relative flex items-center">
        <div className="absolute left-4 text-amber-500">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>

        <input
          type="text"
          placeholder="Try searching: 'I need a black shirt for office under 2500'..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-2 border-amber-500/30 focus:border-amber-500 rounded-full pl-12 pr-10 py-3.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 shadow-xl focus:outline-none transition-all"
        />

        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* AI Parsed Intent Badge Bar */}
      {searchResult && searchResult.parsedIntent && (
        <div className="flex flex-wrap items-center gap-2 px-2 text-xs">
          <span className="font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-500" />
            AI Parsed Intent:
          </span>

          {searchResult.parsedIntent.category && (
            <span className="bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full capitalize">
              Category: {searchResult.parsedIntent.category}
            </span>
          )}
          {searchResult.parsedIntent.color && (
            <span className="bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full capitalize">
              Color: {searchResult.parsedIntent.color}
            </span>
          )}
          {searchResult.parsedIntent.purpose && (
            <span className="bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full capitalize">
              Occasion: {searchResult.parsedIntent.purpose}
            </span>
          )}
          {searchResult.parsedIntent.maxBudget && (
            <span className="bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
              Max Price: ${searchResult.parsedIntent.maxBudget}
            </span>
          )}
        </div>
      )}

      {/* Dropdown Suggestions & Trending Searches */}
      {isFocused && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-2xl z-40 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div>
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              Trending AI Fashion Searches
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                'Black shirt for office under 2500',
                'Summer linen dress resort',
                'Luxury blazer for gala',
                'White leather sneakers',
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectQuery(item)}
                  className="bg-gray-100 dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs font-medium transition-all text-left"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Results Grid */}
      {searchResult && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AIBadge type="recommended" label="AI Semantic Matches" />
              <span>({searchResult.matchedProducts.length} Items)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {searchResult.matchedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
