import React, { useEffect, useMemo, useState } from 'react';
import { aiService } from '@/services/aiService';
import { ProductReview } from '@/types';
import { Sparkles, ThumbsUp, ThumbsDown, MessageSquare, BarChart3 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { Panel } from '@/components/admin/AdminUI';

interface AIReviewAnalyzerProps {
  reviews?: ProductReview[];
}

function ShareBar({ icon: Icon, label, hint, pct }: { icon: typeof ThumbsUp; label: string; hint: string; pct: number }) {
  return (
    <div className="rounded-lg border border-line p-4" title={`${label}: ${pct}% of reviews (${hint})`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
          <Icon className="size-4 text-stone-400" /> {label}
        </span>
        <span className="text-sm font-semibold tabular-nums text-stone-900 dark:text-white">{pct}%</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-white/[0.06]">
        <div className="h-full rounded-full bg-[#a0702a] transition-all dark:bg-[#b8862f]" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-stone-400">{hint}</p>
    </div>
  );
}

export default function AIReviewAnalyzer({ reviews = [] }: AIReviewAnalyzerProps) {
  const [liveReviews, setLiveReviews] = useState<ProductReview[]>(reviews);
  const [error, setError] = useState('');
  useEffect(() => {
    if (reviews.length) return;
    let active = true;
    apiClient.get('/reviews').then(({ data }) => {
      if (active) setLiveReviews(Array.isArray(data?.data) ? data.data : []);
    }).catch(() => { if (active) setError('Could not load customer reviews.'); });
    return () => { active = false; };
  }, [reviews]);
  const analysis = useMemo(() => {
    return aiService.analyzeReviewsSentiment(liveReviews);
  }, [liveReviews]);

  return (
    <Panel
      title={<span className="flex items-center gap-2"><BarChart3 className="size-4 text-[#8b6f47] dark:text-[#c9a96b]" /> Customer rating overview</span>}
      description="Rating distribution calculated from customer reviews."
    >
      <div className="space-y-4">
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <ShareBar icon={ThumbsUp} label="Positive" hint="4 or 5 stars" pct={analysis.positivePercentage} />
          <ShareBar icon={MessageSquare} label="Neutral" hint="3 stars" pct={analysis.neutralPercentage} />
          <ShareBar icon={ThumbsDown} label="Critical" hint="1 or 2 stars" pct={analysis.negativePercentage} />
        </div>

        <div className="rounded-lg border border-line bg-stone-50 p-4 dark:bg-white/[0.03]">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold text-stone-900 dark:text-stone-100">
            <Sparkles className="size-4 text-[#8b6f47] dark:text-[#c9a96b]" />
            Summary
          </h4>
          <p className="mt-1.5 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {analysis.summary}
          </p>
        </div>

        {/* Pros & Cons are shown only when supported by review text. */}
        {(analysis.keyPros.length > 0 || analysis.keyCons.length > 0) && <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-line p-4">
            <h5 className="flex items-center gap-1.5 text-sm font-semibold text-stone-900 dark:text-stone-100">
              <ThumbsUp className="size-4 text-emerald-600 dark:text-emerald-400" /> What customers like
            </h5>
            <ul className="list-inside list-disc space-y-1 text-sm text-stone-700 dark:text-stone-300">
              {analysis.keyPros.map((pro, i) => (
                <li key={i}>{pro}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 rounded-lg border border-line p-4">
            <h5 className="flex items-center gap-1.5 text-sm font-semibold text-stone-900 dark:text-stone-100">
              <ThumbsDown className="size-4 text-red-600 dark:text-red-400" /> What to improve
            </h5>
            <ul className="list-inside list-disc space-y-1 text-sm text-stone-700 dark:text-stone-300">
              {analysis.keyCons.map((con, i) => (
                <li key={i}>{con}</li>
              ))}
            </ul>
          </div>
        </div>}
      </div>
    </Panel>
  );
}
