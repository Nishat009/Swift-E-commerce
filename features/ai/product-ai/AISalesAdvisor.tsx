import React, { useEffect, useState } from 'react';
import { ArrowRight, Lightbulb } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { SalesAdvisorInsight } from '@/types/ai';
import { Panel, Pill } from '@/components/admin/AdminUI';

export default function AISalesAdvisor() {
  const [insights, setInsights] = useState<SalesAdvisorInsight[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    apiClient.get('/admin/insights').then(({ data }) => {
      if (active) setInsights(data?.data || []);
    }).catch(() => { if (active) setError('Could not load sales insights.'); });
    return () => { active = false; };
  }, []);

  return (
    <Panel
      title={<span className="flex items-center gap-2"><Lightbulb className="size-4 text-[#8b6f47] dark:text-[#c9a96b]" /> Sales & inventory insights</span>}
      description="Observations calculated from store orders and products."
    >
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!error && insights.length === 0 && <p className="text-sm text-stone-500">No sales insights yet.</p>}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {insights.map((insight) => (
          <div key={insight.id} className="flex flex-col gap-3 rounded-lg border border-line p-4">
            <div className="space-y-1.5">
              <Pill tone={insight.impactScore === 'high' ? 'warning' : 'neutral'} className="capitalize">{insight.impactScore} impact</Pill>
              <h4 className="text-sm font-semibold leading-snug text-stone-900 dark:text-white">{insight.title}</h4>
              <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">{insight.description}</p>
            </div>
            <p className="mt-auto flex gap-1.5 border-t border-line pt-3 text-xs text-stone-700 dark:text-stone-300">
              <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-[#8b6f47] dark:text-[#c9a96b]" />
              <span>{insight.actionRecommendation}</span>
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
