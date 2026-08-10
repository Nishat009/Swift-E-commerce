import React, { useMemo } from 'react';
import { aiService } from '@/services/aiService';
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight, Lightbulb } from 'lucide-react';

export default function AISalesAdvisor() {
  const insights = useMemo(() => {
    return aiService.getAdminSalesAdvisorInsights();
  }, []);

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            AI Business Advisor & Inventory Intelligence
          </h3>
          <p className="text-xs text-gray-500">
            Predictive sales analytics and automated cross-sell strategies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="bg-gradient-to-b from-gray-50 to-amber-500/5 dark:from-gray-800 dark:to-amber-950/20 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-xs hover:border-amber-500 transition-colors"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    insight.impactScore === 'high'
                      ? 'bg-amber-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {insight.impactScore} Impact
                </span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>

              <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                {insight.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {insight.description}
              </p>
            </div>

            <div className="bg-amber-500/10 dark:bg-amber-500/5 p-3 rounded-xl border border-amber-500/20 text-xs">
              <p className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1 mb-1">
                <ArrowRight className="w-3.5 h-3.5" /> AI Action Tip:
              </p>
              <p className="text-[11px] text-gray-700 dark:text-gray-300">
                {insight.actionRecommendation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
