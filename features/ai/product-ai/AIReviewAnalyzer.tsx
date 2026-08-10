import React, { useMemo } from 'react';
import { aiService } from '@/services/aiService';
import { ProductReview } from '@/types';
import { Sparkles, ThumbsUp, ThumbsDown, MessageSquare, BarChart3 } from 'lucide-react';

interface AIReviewAnalyzerProps {
  reviews?: ProductReview[];
}

export default function AIReviewAnalyzer({ reviews = [] }: AIReviewAnalyzerProps) {
  const analysis = useMemo(() => {
    return aiService.analyzeReviewsSentiment(reviews);
  }, [reviews]);

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            AI Customer Sentiment & Review Intelligence
          </h3>
          <p className="text-xs text-gray-500">
            Real-time NLP sentiment analysis computed across customer product reviews.
          </p>
        </div>
      </div>

      {/* Sentiment Stats Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Positive */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" /> Positive Sentiment
            </span>
            <span>{analysis.positivePercentage}%</span>
          </div>
          <div className="w-full h-2 bg-emerald-200 dark:bg-emerald-950 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${analysis.positivePercentage}%` }} />
          </div>
        </div>

        {/* Neutral */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-amber-800 dark:text-amber-300">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> Neutral
            </span>
            <span>{analysis.neutralPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-amber-200 dark:bg-amber-950 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${analysis.neutralPercentage}%` }} />
          </div>
        </div>

        {/* Negative */}
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-rose-800 dark:text-rose-300">
            <span className="flex items-center gap-1">
              <ThumbsDown className="w-3.5 h-3.5" /> Critical Feedback
            </span>
            <span>{analysis.negativePercentage}%</span>
          </div>
          <div className="w-full h-2 bg-rose-200 dark:bg-rose-950 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 transition-all" style={{ width: `${analysis.negativePercentage}%` }} />
          </div>
        </div>
      </div>

      {/* AI Executive Summary Card */}
      <div className="bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
        <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          AI Review Summary:
        </h4>
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic">
          &quot;{analysis.summary}&quot;
        </p>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/20 space-y-2">
          <h5 className="font-bold text-emerald-800 dark:text-emerald-300">Top Customer Highlights:</h5>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            {analysis.keyPros.map((pro, i) => (
              <li key={i}>{pro}</li>
            ))}
          </ul>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-500/20 space-y-2">
          <h5 className="font-bold text-rose-800 dark:text-rose-300">Improvement Opportunities:</h5>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            {analysis.keyCons.map((con, i) => (
              <li key={i}>{con}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
